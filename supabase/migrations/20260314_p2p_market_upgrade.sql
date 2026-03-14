begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_status'
      and n.nspname = 'public'
  ) then
    create type public.order_status as enum ('open', 'filled', 'cancelled', 'expired');
  end if;
end
$$;

create table if not exists public.market_orders (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  side public.market_side not null,
  price integer not null check (price between 1 and 99),
  quantity integer not null check (quantity > 0),
  remaining_quantity integer not null check (remaining_quantity >= 0),
  locked_gems bigint not null default 0 check (locked_gems >= 0),
  status public.order_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_matches (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  yes_order_id uuid references public.market_orders(id) on delete set null,
  no_order_id uuid references public.market_orders(id) on delete set null,
  yes_user_id uuid not null references public.profiles(id) on delete cascade,
  no_user_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  yes_price integer not null check (yes_price between 1 and 99),
  no_price integer not null check (no_price between 1 and 99),
  total_collateral bigint not null check (total_collateral > 0),
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists touch_market_orders_updated_at on public.market_orders;
create trigger touch_market_orders_updated_at
before update on public.market_orders
for each row execute procedure public.touch_updated_at();

create or replace view public.portfolio_open_orders as
select
  mo.*,
  m.question
from public.market_orders mo
join public.markets m on m.id = mo.market_id
where mo.status = 'open' and mo.remaining_quantity > 0;

alter table public.market_orders enable row level security;
alter table public.market_matches enable row level security;

drop policy if exists "users can read own orders" on public.market_orders;
create policy "users can read own orders" on public.market_orders
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "users can read own matches" on public.market_matches;
create policy "users can read own matches" on public.market_matches
for select using (
  yes_user_id = auth.uid() or no_user_id = auth.uid() or public.is_admin(auth.uid())
);

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
  remaining_quantity integer;
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
  remaining_quantity := p_quantity;

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
    from public.market_orders
    where market_id = p_market_id
      and side <> p_side
      and status = 'open'
      and remaining_quantity > 0
      and price = opposite_price
    order by created_at asc
    for update skip locked
  loop
    exit when remaining_quantity <= 0;

    matched_quantity := least(remaining_quantity, opposite_order.remaining_quantity);
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

    remaining_quantity := remaining_quantity - matched_quantity;
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
    remaining_quantity = remaining_quantity,
    locked_gems = contract_price * remaining_quantity,
    status = case
      when remaining_quantity = 0 then 'filled'
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
  payout bigint;
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
    values (order_row.user_id, p_market_id, 'refund', order_row.locked_gems, 'Unmatched order refund');
    update public.market_orders
    set status = 'expired', remaining_quantity = 0, locked_gems = 0
    where id = order_row.id;
  end loop;

  insert into public.market_resolutions (market_id, outcome, resolved_by, admin_note)
  values (p_market_id, p_outcome, actor, nullif(p_admin_note, ''))
  on conflict (market_id) do update
  set outcome = excluded.outcome, resolved_by = excluded.resolved_by, admin_note = excluded.admin_note, created_at = now();

  for position_row in
    select * from public.positions where market_id = p_market_id
  loop
    payout := case
      when p_outcome = 'yes' then position_row.yes_shares * 100
      else position_row.no_shares * 100
    end;

    if payout > 0 then
      update public.profiles set gem_balance = gem_balance + payout where id = position_row.user_id;
      insert into public.transactions (user_id, market_id, type, amount_gems, description)
      values (position_row.user_id, p_market_id, 'payout', payout, format('Resolved %s', upper(p_outcome::text)));
    end if;
  end loop;
end;
$$;

create or replace function public.delete_market(p_market_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  position_row record;
  order_row record;
begin
  if not public.is_admin(actor) then
    raise exception 'Admins only.';
  end if;

  for order_row in
    select * from public.market_orders where market_id = p_market_id and locked_gems > 0
  loop
    update public.profiles set gem_balance = gem_balance + order_row.locked_gems where id = order_row.user_id;
    insert into public.transactions (user_id, market_id, type, amount_gems, description)
    values (order_row.user_id, p_market_id, 'refund', order_row.locked_gems, 'Open order refund');
    update public.market_orders
    set remaining_quantity = 0, locked_gems = 0, status = 'cancelled'
    where id = order_row.id;
  end loop;

  for position_row in
    select * from public.positions where market_id = p_market_id
  loop
    if position_row.total_cost_basis > 0 then
      update public.profiles set gem_balance = gem_balance + position_row.total_cost_basis where id = position_row.user_id;
      insert into public.transactions (user_id, market_id, type, amount_gems, description)
      values (position_row.user_id, p_market_id, 'refund', position_row.total_cost_basis, 'Market deleted refund');
    end if;
  end loop;

  update public.markets set status = 'deleted' where id = p_market_id;
end;
$$;

grant select on public.portfolio_open_orders to anon, authenticated;
grant execute on function public.place_trade(uuid, public.market_side, integer) to authenticated;
grant execute on function public.resolve_market(uuid, public.market_side, text) to authenticated;
grant execute on function public.delete_market(uuid) to authenticated;

commit;
