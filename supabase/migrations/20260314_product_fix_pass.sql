begin;

alter table if exists public.markets
  add column if not exists vote_end_at timestamptz;

update public.markets
set vote_end_at = coalesce(vote_end_at, vote_start_at + interval '1 day')
where vote_start_at is not null;

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

drop trigger if exists touch_market_reports_updated_at on public.market_reports;
create trigger touch_market_reports_updated_at
before update on public.market_reports
for each row execute procedure public.touch_updated_at();

create or replace view public.market_report_cards as
select
  mr.*,
  p.username,
  m.question
from public.market_reports mr
join public.profiles p on p.id = mr.user_id
join public.markets m on m.id = mr.market_id;

alter table public.market_reports enable row level security;

drop policy if exists "users can read own market reports" on public.market_reports;
create policy "users can read own market reports" on public.market_reports
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

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

grant select on public.market_report_cards to authenticated;
grant execute on function public.review_market_report(uuid, public.deposit_status, text) to authenticated;

commit;
