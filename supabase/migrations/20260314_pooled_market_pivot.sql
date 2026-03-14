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
  cost bigint;
  total_yes_stake bigint;
  total_no_stake bigint;
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
  cost := contract_price * p_quantity;

  update public.profiles
  set gem_balance = gem_balance - cost
  where id = actor and gem_balance >= cost;

  if not found then
    raise exception 'Insufficient Gems.';
  end if;

  insert into public.trades (
    market_id,
    user_id,
    side,
    quantity,
    price,
    cost_gems
  )
  values (
    p_market_id,
    actor,
    p_side,
    p_quantity,
    contract_price,
    cost
  );

  insert into public.transactions (user_id, market_id, type, amount_gems, description)
  values (actor, p_market_id, 'trade', -cost, format('Bought %s x%s', upper(p_side::text), p_quantity));

  insert into public.positions (
    market_id,
    user_id,
    yes_shares,
    no_shares,
    yes_cost_basis,
    no_cost_basis,
    latest_trade_at
  )
  values (
    p_market_id,
    actor,
    case when p_side = 'yes' then p_quantity else 0 end,
    case when p_side = 'no' then p_quantity else 0 end,
    case when p_side = 'yes' then cost else 0 end,
    case when p_side = 'no' then cost else 0 end,
    now()
  )
  on conflict (market_id, user_id) do update
  set
    yes_shares = public.positions.yes_shares + excluded.yes_shares,
    no_shares = public.positions.no_shares + excluded.no_shares,
    yes_cost_basis = public.positions.yes_cost_basis + excluded.yes_cost_basis,
    no_cost_basis = public.positions.no_cost_basis + excluded.no_cost_basis,
    latest_trade_at = now();

  select
    coalesce(sum(yes_cost_basis), 0),
    coalesce(sum(no_cost_basis), 0)
  into total_yes_stake, total_no_stake
  from public.positions
  where market_id = p_market_id;

  update public.markets
  set
    total_volume = total_yes_stake + total_no_stake,
    yes_price = case
      when total_yes_stake + total_no_stake = 0 then 50
      else greatest(5, least(95, round((total_yes_stake::numeric / (total_yes_stake + total_no_stake)::numeric) * 100)::integer))
    end
  where id = p_market_id;
end;
$$;

create or replace function public.resolve_market(
  p_market_id uuid,
  p_outcome public.market_side,
  p_admin_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  market_row public.markets%rowtype;
  position_row record;
  order_row record;
  winner_row record;
  total_yes_stake bigint;
  total_no_stake bigint;
  winner_pool bigint;
  loser_pool bigint;
  distributed_loser bigint := 0;
  extra_remainder bigint := 0;
  lead_winner_id uuid;
  payout bigint;
  loser_share bigint;
begin
  if not public.is_admin(actor) then
    raise exception 'Admins only.';
  end if;

  select * into market_row from public.markets where id = p_market_id for update;
  if not found or market_row.status in ('deleted', 'resolved') then
    raise exception 'Market cannot be resolved.';
  end if;

  update public.markets
  set status = 'resolved', resolved_outcome = p_outcome, resolved_at = now()
  where id = p_market_id;

  for order_row in
    select * from public.market_orders
    where market_id = p_market_id and status = 'open' and locked_gems > 0
  loop
    update public.profiles set gem_balance = gem_balance + order_row.locked_gems where id = order_row.user_id;
    insert into public.transactions (user_id, market_id, type, amount_gems, description)
    values (order_row.user_id, p_market_id, 'refund', order_row.locked_gems, 'Legacy open-order refund');
    update public.market_orders
    set status = 'expired', remaining_quantity = 0, locked_gems = 0
    where id = order_row.id;
  end loop;

  insert into public.market_resolutions (market_id, outcome, resolved_by, admin_note)
  values (p_market_id, p_outcome, actor, nullif(p_admin_note, ''))
  on conflict (market_id) do update
  set outcome = excluded.outcome, resolved_by = excluded.resolved_by, admin_note = excluded.admin_note, created_at = now();

  select
    coalesce(sum(yes_cost_basis), 0),
    coalesce(sum(no_cost_basis), 0)
  into total_yes_stake, total_no_stake
  from public.positions
  where market_id = p_market_id;

  if total_yes_stake = 0 or total_no_stake = 0 then
    for position_row in
      select * from public.positions where market_id = p_market_id and total_cost_basis > 0
    loop
      update public.profiles set gem_balance = gem_balance + position_row.total_cost_basis where id = position_row.user_id;
      insert into public.transactions (user_id, market_id, type, amount_gems, description)
      values (position_row.user_id, p_market_id, 'refund', position_row.total_cost_basis, 'Single-sided market refund');
    end loop;

    return;
  end if;

  winner_pool := case when p_outcome = 'yes' then total_yes_stake else total_no_stake end;
  loser_pool := case when p_outcome = 'yes' then total_no_stake else total_yes_stake end;

  for winner_row in
    select
      user_id,
      case when p_outcome = 'yes' then yes_cost_basis else no_cost_basis end as winning_stake
    from public.positions
    where market_id = p_market_id
      and (case when p_outcome = 'yes' then yes_cost_basis else no_cost_basis end) > 0
    order by
      (case when p_outcome = 'yes' then yes_cost_basis else no_cost_basis end) desc,
      user_id asc
  loop
    if lead_winner_id is null then
      lead_winner_id := winner_row.user_id;
    end if;

    loser_share := floor((winner_row.winning_stake::numeric / winner_pool::numeric) * loser_pool::numeric);
    distributed_loser := distributed_loser + loser_share;
    payout := winner_row.winning_stake + loser_share;

    update public.profiles set gem_balance = gem_balance + payout where id = winner_row.user_id;
    insert into public.transactions (user_id, market_id, type, amount_gems, description)
    values (winner_row.user_id, p_market_id, 'payout', payout, format('Resolved %s', upper(p_outcome::text)));
  end loop;

  extra_remainder := loser_pool - distributed_loser;

  if extra_remainder > 0 and lead_winner_id is not null then
    update public.profiles set gem_balance = gem_balance + extra_remainder where id = lead_winner_id;
    insert into public.transactions (user_id, market_id, type, amount_gems, description)
    values (lead_winner_id, p_market_id, 'payout', extra_remainder, 'Resolution rounding remainder');
  end if;
end;
$$;
