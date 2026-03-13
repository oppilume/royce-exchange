insert into public.categories (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'quiz/exam', 'quiz-exam'),
  ('10000000-0000-0000-0000-000000000002', 'homework', 'homework'),
  ('10000000-0000-0000-0000-000000000003', 'project', 'project'),
  ('10000000-0000-0000-0000-000000000004', 'class policy', 'class-policy'),
  ('10000000-0000-0000-0000-000000000005', 'announcements', 'announcements'),
  ('10000000-0000-0000-0000-000000000006', 'random catchphrase', 'random-catchphrase'),
  ('10000000-0000-0000-0000-000000000007', 'technology', 'technology'),
  ('10000000-0000-0000-0000-000000000008', 'AI/ChatGPT', 'ai-chatgpt'),
  ('10000000-0000-0000-0000-000000000009', 'grading', 'grading'),
  ('10000000-0000-0000-0000-000000000010', 'participation', 'participation')
on conflict do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@example.com', crypt('jayhawkadmin', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'alex@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"alex"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'mila@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"mila"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'jordan@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"jordan"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'zoe@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"zoe"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'samir@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"samir"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.profiles (id, username, role, gem_balance, bio) values
  ('20000000-0000-0000-0000-000000000001', 'admin', 'admin', 100000, 'Platform admin.'),
  ('20000000-0000-0000-0000-000000000002', 'alex', 'user', 14000, 'APUSH specialist and fast-reacting YES buyer.'),
  ('20000000-0000-0000-0000-000000000003', 'mila', 'user', 12800, 'Chem and Algebra markets only.'),
  ('20000000-0000-0000-0000-000000000004', 'jordan', 'user', 9200, 'Fade the hype. Buy NO.'),
  ('20000000-0000-0000-0000-000000000005', 'zoe', 'user', 7100, 'English class volatility enjoyer.'),
  ('20000000-0000-0000-0000-000000000006', 'samir', 'user', 6600, 'Mostly trading participation-point setups.')
on conflict (id) do update set
  username = excluded.username,
  role = excluded.role,
  gem_balance = excluded.gem_balance,
  bio = excluded.bio;

insert into public.markets (
  id, creator_id, teacher_name, prediction_text, course_name, class_period, market_date,
  market_type, notes, trading_close_at, vote_start_at, question, status, yes_price,
  total_volume, resolved_outcome, resolved_at, rejection_reason, created_at, updated_at
)
values
  (
    '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Mr. Thompson',
    'pop quiz', 'APUSH', '3', current_date + 1, 'exact_phrase',
    'Counts if he says the exact phrase "pop quiz" during class.', now() + interval '18 hours',
    now() + interval '1 day 3 hours',
    'Will Mr. Thompson say "pop quiz" during 3rd period APUSH on Friday?', 'approved', 63, 11800, null, null, null, now() - interval '2 days', now()
  ),
  (
    '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Ms. Lee',
    'the midterm', 'Chemistry', '2', current_date + 1, 'broader_mention',
    'Any mention of the upcoming midterm counts.', now() + interval '20 hours',
    now() + interval '1 day 5 hours',
    'Will Ms. Lee mention the midterm during 2nd period Chemistry tomorrow?', 'approved', 57, 8400, null, null, null, now() - interval '3 days', now()
  ),
  (
    '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'Mr. Garcia',
    'ChatGPT', 'English', '5', current_date, 'broader_mention',
    'Any direct mention of ChatGPT or AI writing tools counts.', now() - interval '2 hours',
    now() - interval '30 minutes',
    'Will Mr. Garcia mention ChatGPT in 5th period English today?', 'approved', 44, 9200, null, null, null, now() - interval '1 day', now()
  ),
  (
    '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', 'Ms. Patel',
    'this will be on the test', 'Algebra', '1', current_date - 1, 'exact_phrase',
    'Exact phrase only.', now() - interval '1 day 8 hours',
    now() - interval '1 day 2 hours',
    'Will Ms. Patel say "this will be on the test" during 1st period Algebra?', 'resolved', 69, 10300, 'yes', now() - interval '18 hours', null, now() - interval '4 days', now() - interval '18 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'Coach Reynolds',
    'participation points', 'Health', '6', current_date - 2, 'broader_mention',
    'Any direct reference to participation points or participation grade counts.', now() - interval '2 days 6 hours',
    now() - interval '2 days 1 hour',
    'Will Coach Reynolds mention participation points during 6th period Health?', 'resolved', 38, 7700, 'no', now() - interval '36 hours', null, now() - interval '5 days', now() - interval '36 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'Dr. Brooks',
    'lab report extension', 'Biology', '4', current_date + 2, 'broader_mention',
    'Anything about extending the lab report deadline counts.', now() + interval '1 day 10 hours',
    now() + interval '2 days 5 hours',
    'Will Dr. Brooks mention a lab report extension during 4th period Biology on Saturday?', 'pending', 50, 0, null, null, null, now() - interval '4 hours', now()
  ),
  (
    '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 'Ms. Owens',
    'homework grace period', 'Spanish', '7', current_date + 3, 'broader_mention',
    'Needs to be for this week’s assignment.', now() + interval '2 days 8 hours',
    now() + interval '3 days 4 hours',
    'Will Ms. Owens mention a homework grace period during 7th period Spanish?', 'pending', 50, 0, null, null, null, now() - interval '2 hours', now()
  )
on conflict (id) do nothing;

insert into public.market_categories (market_id, category_id) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000010'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002')
on conflict do nothing;

insert into public.positions (id, market_id, user_id, yes_shares, no_shares, yes_cost_basis, no_cost_basis, latest_trade_at) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 40, 0, 2280, 0, now() - interval '8 hours'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 0, 35, 0, 1365, now() - interval '7 hours'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 18, 0, 918, 0, now() - interval '5 hours'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 22, 0, 968, 0, now() - interval '10 hours'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 25, 0, 1450, 0, now() - interval '2 days'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 0, 30, 0, 1800, now() - interval '3 days')
on conflict do nothing;

insert into public.trades (id, market_id, user_id, side, quantity, price, cost_gems, created_at) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'yes', 40, 57, 2280, now() - interval '8 hours'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'no', 35, 39, 1365, now() - interval '7 hours'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'yes', 18, 51, 918, now() - interval '5 hours'),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'yes', 22, 44, 968, now() - interval '10 hours'),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'yes', 25, 58, 1450, now() - interval '2 days'),
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'no', 30, 60, 1800, now() - interval '3 days')
on conflict do nothing;

insert into public.market_votes (id, market_id, user_id, vote, comment, created_at) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'yes', 'He mentioned ChatGPT while talking about essays.', now() - interval '5 minutes'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'yes', 'She said it almost word for word.', now() - interval '1 day'),
  ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', 'no', 'No participation point speech today.', now() - interval '2 days')
on conflict do nothing;

insert into public.market_resolutions (id, market_id, outcome, resolved_by, admin_note, created_at) values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'yes', '20000000-0000-0000-0000-000000000001', 'Consensus from class participants.', now() - interval '18 hours'),
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 'no', '20000000-0000-0000-0000-000000000001', 'Admin override after checking comments.', now() - interval '36 hours')
on conflict do nothing;

insert into public.transactions (id, user_id, market_id, type, amount_gems, description, created_at) values
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', null, 'deposit', 15000, 'Initial manual credit', now() - interval '8 days'),
  ('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', null, 'deposit', 13000, 'Initial manual credit', now() - interval '8 days'),
  ('80000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', null, 'deposit', 10000, 'Initial manual credit', now() - interval '8 days'),
  ('80000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', null, 'deposit', 8000, 'Initial manual credit', now() - interval '8 days'),
  ('80000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', null, 'deposit', 7000, 'Initial manual credit', now() - interval '8 days'),
  ('80000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'trade', -2280, 'Bought YES x40', now() - interval '8 hours'),
  ('80000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'trade', -1365, 'Bought NO x35', now() - interval '7 hours'),
  ('80000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'trade', -918, 'Bought YES x18', now() - interval '5 hours'),
  ('80000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'trade', -968, 'Bought YES x22', now() - interval '10 hours'),
  ('80000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'trade', -1450, 'Bought YES x25', now() - interval '2 days'),
  ('80000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 'trade', -1800, 'Bought NO x30', now() - interval '3 days'),
  ('80000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'payout', 2500, 'Resolved YES', now() - interval '18 hours'),
  ('80000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 'payout', 3000, 'Resolved NO', now() - interval '36 hours')
on conflict do nothing;

insert into public.balance_adjustments (id, admin_id, user_id, amount_gems, reason, created_at) values
  ('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 15000, 'Initial manual credit', now() - interval '8 days'),
  ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 13000, 'Initial manual credit', now() - interval '8 days'),
  ('90000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 10000, 'Initial manual credit', now() - interval '8 days')
on conflict do nothing;

insert into public.deposit_requests (id, user_id, amount_gems, note, status, reviewed_by, reviewed_at, created_at) values
  ('a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 2500, 'Sent after school club meeting.', 'pending', null, null, now() - interval '3 hours'),
  ('a0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', 4000, 'External deposit already confirmed.', 'approved', '20000000-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '2 days')
on conflict do nothing;
