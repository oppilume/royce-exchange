create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.market_type as enum ('exact_phrase', 'broader_mention');
create type public.market_status as enum ('pending', 'approved', 'rejected', 'resolved', 'deleted');
create type public.market_side as enum ('yes', 'no');
create type public.transaction_type as enum ('trade', 'payout', 'refund', 'adjustment', 'deposit');
create type public.deposit_status as enum ('pending', 'approved', 'rejected');
create type public.balance_transaction_type as enum ('deposit_approved', 'admin_adjustment', 'trade_lock', 'trade_payout', 'trade_refund');
create type public.order_status as enum ('open', 'filled', 'cancelled', 'expired');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or char_length(username) >= 3),
  role public.user_role not null default 'user',
  gem_balance bigint not null default 0 check (gem_balance >= 0),
  bio text,
  avatar_color text default '#ffcf57',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null,
  prediction_text text not null,
  course_name text not null,
  class_period text not null,
  market_date date not null,
  market_type public.market_type not null,
  notes text,
  trading_close_at timestamptz not null,
  vote_start_at timestamptz not null,
  vote_end_at timestamptz,
  question text not null,
  status public.market_status not null default 'pending',
  yes_price integer not null default 50 check (yes_price between 5 and 95),
  total_volume bigint not null default 0,
  resolved_outcome public.market_side,
  resolved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vote_after_close check (vote_start_at >= trading_close_at)
);

create table if not exists public.market_categories (
  market_id uuid not null references public.markets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (market_id, category_id)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  side public.market_side not null,
  quantity integer not null check (quantity > 0),
  price integer not null check (price between 1 and 99),
  cost_gems bigint not null check (cost_gems > 0),
  created_at timestamptz not null default timezone('utc', now())
);

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

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  yes_shares integer not null default 0,
  no_shares integer not null default 0,
  yes_cost_basis bigint not null default 0,
  no_cost_basis bigint not null default 0,
  total_cost_basis bigint generated always as (yes_cost_basis + no_cost_basis) stored,
  latest_trade_at timestamptz not null default timezone('utc', now()),
  unique (market_id, user_id)
);

create table if not exists public.market_votes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote public.market_side not null,
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (market_id, user_id)
);

create table if not exists public.market_resolutions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null unique references public.markets(id) on delete cascade,
  outcome public.market_side not null,
  resolved_by uuid not null references public.profiles(id) on delete cascade,
  admin_note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  type public.transaction_type not null,
  amount_gems bigint not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_gems bigint not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_gems bigint not null check (amount_gems > 0),
  note text,
  status public.deposit_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.deposit_requests add column if not exists admin_note text;
alter table if exists public.deposit_requests add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table if exists public.markets add column if not exists vote_end_at timestamptz;

create table if not exists public.market_reports (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status public.deposit_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.balance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_gems bigint not null,
  type public.balance_transaction_type not null,
  note text,
  related_request_id uuid references public.deposit_requests(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_deposit_requests_updated_at on public.deposit_requests;
create trigger touch_deposit_requests_updated_at
before update on public.deposit_requests
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_markets_updated_at on public.markets;
create trigger touch_markets_updated_at
before update on public.markets
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_market_reports_updated_at on public.market_reports;
create trigger touch_market_reports_updated_at
before update on public.market_reports
for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_market_orders_updated_at on public.market_orders;
create trigger touch_market_orders_updated_at
before update on public.market_orders
for each row execute procedure public.touch_updated_at();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

create or replace function public.market_phase(m public.markets)
returns text
language sql
stable
as $$
  select case
    when m.status = 'pending' then 'Pending review'
    when m.status = 'rejected' then 'Rejected'
    when m.status = 'deleted' then 'Deleted'
    when m.status = 'resolved' or m.resolved_outcome is not null then 'Resolved'
    when now() < m.trading_close_at then 'Live'
    when now() >= m.trading_close_at and now() < m.vote_start_at then 'Closed'
    when now() >= m.vote_start_at and now() < coalesce(m.vote_end_at, m.vote_start_at + interval '1 day') then 'Voting'
    else 'Awaiting resolution'
  end;
$$;

create or replace view public.market_cards as
select
  m.*,
  public.market_phase(m) as phase,
  c.name as category_name,
  p.username as creator_username
from public.markets m
left join public.market_categories mc on mc.market_id = m.id
left join public.categories c on c.id = mc.category_id
left join public.profiles p on p.id = m.creator_id;

create or replace view public.market_positions as
select
  positions.*,
  profiles.username,
  markets.question
from public.positions
join public.profiles on profiles.id = positions.user_id
join public.markets on markets.id = positions.market_id;

create or replace view public.portfolio_positions as
select
  p.*,
  m.question,
  m.status,
  m.resolved_outcome
from public.positions p
join public.markets m on m.id = p.market_id;

create or replace view public.portfolio_open_orders as
select
  mo.*,
  m.question
from public.market_orders mo
join public.markets m on m.id = mo.market_id
where mo.status = 'open' and mo.remaining_quantity > 0;

create or replace view public.public_profile_stats as
with trade_totals as (
  select
    user_id,
    count(*) as total_trades,
    count(distinct market_id) as markets_traded,
    coalesce(sum(case when type in ('trade', 'payout', 'refund') then amount_gems else 0 end), 0) as total_profit,
    abs(coalesce(sum(case when type = 'trade' then amount_gems else 0 end), 0)) as total_staked
  from public.transactions
  group by user_id
),
resolved_markets as (
  select
    p.user_id,
    count(*) filter (
      where (m.resolved_outcome = 'yes' and p.yes_shares > 0)
         or (m.resolved_outcome = 'no' and p.no_shares > 0)
    ) as wins,
    count(*) filter (where m.resolved_outcome is not null) as resolved_count
  from public.positions p
  join public.markets m on m.id = p.market_id
  group by p.user_id
)
select
  pr.id,
  pr.username,
  pr.bio,
  coalesce(tt.total_profit, 0) as total_profit,
  case
    when coalesce(tt.total_staked, 0) = 0 then 0
    else round((tt.total_profit::numeric / tt.total_staked::numeric) * 100, 1)
  end as roi_percent,
  case
    when coalesce(rm.resolved_count, 0) = 0 then 0
    else round((rm.wins::numeric / rm.resolved_count::numeric) * 100, 1)
  end as win_rate,
  coalesce(tt.total_trades, 0) as total_trades,
  coalesce(tt.markets_traded, 0) as markets_traded
from public.profiles pr
left join trade_totals tt on tt.user_id = pr.id
left join resolved_markets rm on rm.user_id = pr.id;

create or replace view public.leaderboard_all_time as
select *
from public.public_profile_stats
order by total_profit desc, roi_percent desc, win_rate desc, markets_traded desc;

create or replace view public.leaderboard_weekly as
with weekly_tx as (
  select
    t.user_id,
    coalesce(sum(case when type in ('trade', 'payout', 'refund') then amount_gems else 0 end), 0) as total_profit,
    abs(coalesce(sum(case when type = 'trade' then amount_gems else 0 end), 0)) as total_staked,
    count(*) filter (where type = 'trade') as total_trades,
    count(distinct market_id) filter (where type = 'trade') as markets_traded
  from public.transactions t
  where t.created_at >= now() - interval '7 days'
  group by t.user_id
),
weekly_wins as (
  select
    p.user_id,
    count(*) filter (
      where m.resolved_at >= now() - interval '7 days'
        and ((m.resolved_outcome = 'yes' and p.yes_shares > 0) or (m.resolved_outcome = 'no' and p.no_shares > 0))
    ) as wins,
    count(*) filter (where m.resolved_at >= now() - interval '7 days') as resolved_count
  from public.positions p
  join public.markets m on m.id = p.market_id
  group by p.user_id
)
select
  pr.id,
  pr.username,
  pr.bio,
  coalesce(wt.total_profit, 0) as total_profit,
  case when coalesce(wt.total_staked, 0) = 0 then 0 else round((wt.total_profit::numeric / wt.total_staked::numeric) * 100, 1) end as roi_percent,
  case when coalesce(ww.resolved_count, 0) = 0 then 0 else round((ww.wins::numeric / ww.resolved_count::numeric) * 100, 1) end as win_rate,
  coalesce(wt.total_trades, 0) as total_trades,
  coalesce(wt.markets_traded, 0) as markets_traded
from public.profiles pr
left join weekly_tx wt on wt.user_id = pr.id
left join weekly_wins ww on ww.user_id = pr.id
order by total_profit desc, roi_percent desc, win_rate desc, markets_traded desc;

create or replace view public.platform_stats as
select
  coalesce(sum(total_volume), 0) as total_volume,
  count(*) filter (where status = 'approved') as active_markets,
  count(*) filter (where status = 'pending') as pending_markets,
  count(*) filter (where status = 'resolved') as resolved_markets
from public.markets;

create or replace view public.deposit_request_cards as
select
  dr.*,
  pr.username
from public.deposit_requests dr
join public.profiles pr on pr.id = dr.user_id;

create or replace view public.market_report_cards as
select
  mr.*,
  p.username,
  m.question
from public.market_reports mr
join public.profiles p on p.id = mr.user_id
join public.markets m on m.id = mr.market_id;

alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.trades enable row level security;
alter table public.market_orders enable row level security;
alter table public.market_matches enable row level security;
alter table public.positions enable row level security;
alter table public.market_votes enable row level security;
alter table public.market_resolutions enable row level security;
alter table public.transactions enable row level security;
alter table public.balance_adjustments enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.market_reports enable row level security;
alter table public.balance_transactions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.categories enable row level security;
alter table public.market_categories enable row level security;

create policy "profiles are public read" on public.profiles for select using (true);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "public can read visible markets" on public.markets
for select using (status in ('approved', 'resolved') or creator_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own trades" on public.trades
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own orders" on public.market_orders
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own matches" on public.market_matches
for select using (
  yes_user_id = auth.uid() or no_user_id = auth.uid() or public.is_admin(auth.uid())
);

create policy "users can read own positions" on public.positions
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "votes are public after creation" on public.market_votes
for select using (true);

create policy "users can read own transactions" on public.transactions
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own deposit requests" on public.deposit_requests
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own market reports" on public.market_reports
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "admins read balance adjustments" on public.balance_adjustments
for select using (user_id = auth.uid() or admin_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users can read own balance transactions" on public.balance_transactions
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "admins read audit log" on public.admin_audit_log
for select using (public.is_admin(auth.uid()));

create policy "categories are public read" on public.categories for select using (true);
create policy "market categories are public read" on public.market_categories for select using (true);

create or replace function public.submit_market_proposal(
  p_teacher_name text,
  p_prediction_text text,
  p_course_name text,
  p_class_period text,
  p_market_date date,
  p_market_type public.market_type,
  p_notes text,
  p_trading_close_at timestamptz,
  p_vote_start_at timestamptz,
  p_category_name text,
  p_creator_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  market_id uuid;
  category_id uuid;
  actor uuid := auth.uid();
begin
  if actor is null or actor <> p_creator_id then
    raise exception 'You must be logged in to propose a market.';
  end if;

  if p_trading_close_at >= p_vote_start_at then
    raise exception 'Vote start must be after trading close.';
  end if;

  if nullif(trim(coalesce(p_category_name, '')), '') is not null then
    insert into public.categories (name, slug)
    values (p_category_name, lower(regexp_replace(p_category_name, '[^a-zA-Z0-9]+', '-', 'g')))
    on conflict (name) do update set name = excluded.name
    returning id into category_id;
  end if;

  insert into public.markets (
    creator_id,
    teacher_name,
    prediction_text,
    course_name,
    class_period,
    market_date,
    market_type,
    notes,
    trading_close_at,
    vote_start_at,
    vote_end_at,
    question
  )
  values (
    actor,
    p_teacher_name,
    p_prediction_text,
    p_course_name,
    p_class_period,
    p_market_date,
    p_market_type,
    nullif(p_notes, ''),
    p_trading_close_at,
    p_vote_start_at,
    p_vote_start_at + interval '1 day',
    format(
      'Will %s say or mention "%s" during %s block %s on %s?',
      p_teacher_name,
      p_prediction_text,
      p_class_period,
      p_course_name,
      to_char(p_market_date, 'FMDay, Mon FMDD')
    )
  )
  returning id into market_id;

  if category_id is not null then
    insert into public.market_categories (market_id, category_id)
    values (market_id, category_id);
  end if;

  return market_id;
end;
$$;

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

create or replace function public.submit_market_vote(
  p_market_id uuid,
  p_vote public.market_side,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  market_row public.markets%rowtype;
  has_position boolean;
begin
  if actor is null then
    raise exception 'Log in to vote.';
  end if;

  select * into market_row from public.markets where id = p_market_id;
  if not found then
    raise exception 'Market not found.';
  end if;
  if market_row.status <> 'approved' or now() < market_row.vote_start_at or market_row.resolved_outcome is not null then
    raise exception 'Voting is not open.';
  end if;

  if now() > coalesce(market_row.vote_end_at, market_row.vote_start_at + interval '1 day') then
    raise exception 'Voting has closed for this market.';
  end if;

  select exists(
    select 1 from public.positions
    where market_id = p_market_id and user_id = actor and (yes_shares > 0 or no_shares > 0)
  ) into has_position;

  if not has_position then
    raise exception 'Only participants can vote on this market.';
  end if;

  insert into public.market_votes (market_id, user_id, vote, comment)
  values (p_market_id, actor, p_vote, nullif(p_comment, ''))
  on conflict (market_id, user_id)
  do update set vote = excluded.vote, comment = excluded.comment, created_at = now();
end;
$$;

create or replace function public.review_market_report(
  p_report_id uuid,
  p_decision public.deposit_status,
  p_admin_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admins only.';
  end if;

  update public.market_reports
  set
    status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_note = nullif(p_admin_note, '')
  where id = p_report_id and status = 'pending';
end;
$$;

create or replace function public.approve_market(p_market_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admins only.';
  end if;

  update public.markets
  set status = 'approved', rejection_reason = null
  where id = p_market_id and status = 'pending';
end;
$$;

create or replace function public.reject_market(p_market_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admins only.';
  end if;

  update public.markets
  set status = 'rejected', rejection_reason = nullif(p_reason, '')
  where id = p_market_id and status = 'pending';
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
    values (order_row.user_id, p_market_id, 'refund', order_row.locked_gems, 'Unmatched order refund');
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

create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_amount_gems bigint,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if not public.is_admin(actor) then
    raise exception 'Admins only.';
  end if;

  if p_amount_gems = 0 then
    raise exception 'Amount cannot be zero.';
  end if;

  update public.profiles
  set gem_balance = gem_balance + p_amount_gems
  where id = p_user_id
    and (gem_balance + p_amount_gems) >= 0;

  if not found then
    raise exception 'Balance update would go negative.';
  end if;

  insert into public.balance_adjustments (admin_id, user_id, amount_gems, reason)
  values (actor, p_user_id, p_amount_gems, p_reason);

  insert into public.transactions (user_id, type, amount_gems, description)
  values (p_user_id, 'adjustment', p_amount_gems, p_reason);
end;
$$;

create or replace function public.submit_deposit_request(
  p_amount_gems bigint,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Log in to request a deposit.';
  end if;

  insert into public.deposit_requests (user_id, amount_gems, note)
  values (auth.uid(), p_amount_gems, nullif(p_note, ''));
end;
$$;

create or replace function public.review_deposit_request(
  p_request_id uuid,
  p_decision public.deposit_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  request_row public.deposit_requests%rowtype;
begin
  if not public.is_admin(actor) then
    raise exception 'Admins only.';
  end if;

  select * into request_row from public.deposit_requests where id = p_request_id for update;
  if not found or request_row.status <> 'pending' then
    raise exception 'Request is not available for review.';
  end if;

  update public.deposit_requests
  set status = p_decision, reviewed_by = actor, reviewed_at = now()
  where id = p_request_id;

  if p_decision = 'approved' then
    update public.profiles set gem_balance = gem_balance + request_row.amount_gems where id = request_row.user_id;
    insert into public.transactions (user_id, type, amount_gems, description)
    values (request_row.user_id, 'deposit', request_row.amount_gems, 'Deposit request approved');
    insert into public.balance_adjustments (admin_id, user_id, amount_gems, reason)
    values (actor, request_row.user_id, request_row.amount_gems, 'Approved deposit request');
  end if;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.market_cards, public.market_positions, public.portfolio_positions, public.portfolio_open_orders, public.public_profile_stats, public.leaderboard_all_time, public.leaderboard_weekly, public.platform_stats, public.deposit_request_cards, public.market_report_cards, public.balance_transactions, public.admin_audit_log to anon, authenticated;
grant execute on function public.submit_market_proposal(text, text, text, text, date, public.market_type, text, timestamptz, timestamptz, text, uuid) to authenticated;
grant execute on function public.place_trade(uuid, public.market_side, integer) to authenticated;
grant execute on function public.submit_market_vote(uuid, public.market_side, text) to authenticated;
grant execute on function public.review_market_report(uuid, public.deposit_status, text) to authenticated;
grant execute on function public.approve_market(uuid) to authenticated;
grant execute on function public.reject_market(uuid, text) to authenticated;
grant execute on function public.resolve_market(uuid, public.market_side, text) to authenticated;
grant execute on function public.delete_market(uuid) to authenticated;
grant execute on function public.admin_adjust_balance(uuid, bigint, text) to authenticated;
grant execute on function public.submit_deposit_request(bigint, text) to authenticated;
grant execute on function public.review_deposit_request(uuid, public.deposit_status) to authenticated;
