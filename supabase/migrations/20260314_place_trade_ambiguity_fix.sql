create or replace function public.place_trade(
  p_market_id uuid,
  p_side public.market_side,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  market_row public.markets%rowtype;
  contract_price integer;
  opposite_price integer;
  cost bigint;
  incoming_remaining_quantity integer;
  open_order_id uuid;
  opposite_order record;
  matched_quantity integer;
  matched_yes_price integer;
  total_matched integer := 0;
begin
  if actor is null then
    raise exception 'Log in to trade.';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be positive.';
  end if;

  select * into market_row from public.markets where id = p_market_id for update;
  if not found or market_row.status <> 'approved' then
    raise exception 'Market is not tradable.';
  end if;
  if now() >= market_row.trading_close_at then
    raise exception 'Trading is closed for this market.';
  end if;

  contract_price := case when p_side = 'yes' then market_row.yes_price else 100 - market_row.yes_price end;
  opposite_price := 100 - contract_price;
  cost := contract_price * p_quantity;
  incoming_remaining_quantity := p_quantity;

  update public.profiles
  set gem_balance = gem_balance - cost
  where id = actor and gem_balance >= cost;

  if not found then
    raise exception 'Insufficient Gems.';
  end if;

  insert into public.transactions (user_id, market_id, type, amount_gems, description)
  values (actor, p_market_id, 'trade', -cost, format('Locked %s order x%s', upper(p_side::text), p_quantity));

  insert into public.market_orders (
    market_id,
    user_id,
    side,
    price,
    quantity,
    remaining_quantity,
    locked_gems
  )
  values (
    p_market_id,
    actor,
    p_side,
    contract_price,
    p_quantity,
    p_quantity,
    cost
  )
  returning id into open_order_id;

  for opposite_order in
    select *
    from public.market_orders mo
    where mo.market_id = p_market_id
      and mo.side <> p_side
      and mo.status = 'open'
      and mo.remaining_quantity > 0
      and mo.price = opposite_price
    order by mo.created_at asc
    for update skip locked
  loop
    exit when incoming_remaining_quantity <= 0;

    matched_quantity := least(incoming_remaining_quantity, opposite_order.remaining_quantity);
    matched_yes_price := case when p_side = 'yes' then contract_price else opposite_order.price end;

    insert into public.market_matches (
      market_id,
      yes_order_id,
      no_order_id,
      yes_user_id,
      no_user_id,
      quantity,
      yes_price,
      no_price,
      total_collateral
    )
    values (
      p_market_id,
      case when p_side = 'yes' then open_order_id else opposite_order.id end,
      case when p_side = 'no' then open_order_id else opposite_order.id end,
      case when p_side = 'yes' then actor else opposite_order.user_id end,
      case when p_side = 'no' then actor else opposite_order.user_id end,
      matched_quantity,
      matched_yes_price,
      100 - matched_yes_price,
      matched_quantity * 100
    );

    insert into public.trades (market_id, user_id, side, quantity, price, cost_gems)
    values
      (
        p_market_id,
        case when p_side = 'yes' then actor else opposite_order.user_id end,
        'yes',
        matched_quantity,
        matched_yes_price,
        matched_yes_price * matched_quantity
      ),
      (
        p_market_id,
        case when p_side = 'no' then actor else opposite_order.user_id end,
        'no',
        matched_quantity,
        100 - matched_yes_price,
        (100 - matched_yes_price) * matched_quantity
      );

    insert into public.positions (
      market_id,
      user_id,
      yes_shares,
      no_shares,
      yes_cost_basis,
      no_cost_basis,
      latest_trade_at
    )
    values
      (
        p_market_id,
        case when p_side = 'yes' then actor else opposite_order.user_id end,
        matched_quantity,
        0,
        matched_yes_price * matched_quantity,
        0,
        now()
      ),
      (
        p_market_id,
        case when p_side = 'no' then actor else opposite_order.user_id end,
        0,
        matched_quantity,
        0,
        (100 - matched_yes_price) * matched_quantity,
        now()
      )
    on conflict (market_id, user_id) do update
    set
      yes_shares = public.positions.yes_shares + excluded.yes_shares,
      no_shares = public.positions.no_shares + excluded.no_shares,
      yes_cost_basis = public.positions.yes_cost_basis + excluded.yes_cost_basis,
      no_cost_basis = public.positions.no_cost_basis + excluded.no_cost_basis,
      latest_trade_at = now();

    incoming_remaining_quantity := incoming_remaining_quantity - matched_quantity;
    total_matched := total_matched + matched_quantity;

    update public.market_orders
    set
      remaining_quantity = opposite_order.remaining_quantity - matched_quantity,
      locked_gems = price * (opposite_order.remaining_quantity - matched_quantity),
      status = case
        when opposite_order.remaining_quantity - matched_quantity = 0 then 'filled'
        else 'open'
      end
    where id = opposite_order.id;
  end loop;

  update public.market_orders
  set
    remaining_quantity = incoming_remaining_quantity,
    locked_gems = contract_price * incoming_remaining_quantity,
    status = case
      when incoming_remaining_quantity = 0 then 'filled'
      else 'open'
    end
  where id = open_order_id;

  if total_matched > 0 then
    update public.markets
    set
      total_volume = total_volume + (total_matched * 100),
      yes_price = matched_yes_price
    where id = p_market_id;
  end if;
end;
$$;
