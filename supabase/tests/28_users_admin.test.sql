begin;

\ir support/helpers.sql

select plan(45);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');

insert into auth.mfa_factors (user_id, status)
values
  (md5('t-closer-a@example.com')::uuid, 'verified'),
  (md5('t-closer-b@example.com')::uuid, 'unverified');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-closer-a@example.com')::uuid, 'Contact A1', 'a1@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', md5('t-closer-a@example.com')::uuid, 'Contact A2', 'a2@example.com'),
  ('00000000-0000-4000-8000-0000000000b1', md5('t-closer-b@example.com')::uuid, 'Contact B1', 'a1@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'contacted', 'hiring'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'lost', 'hiring');

insert into public.leads (id, source, full_name, phone, status, assigned_to, assigned_at) values
  ('00000000-0000-4000-8000-0000000000e1', 'manual', 'Lead Assigned', '600000001', 'assigned', md5('t-closer-a@example.com')::uuid, now()),
  ('00000000-0000-4000-8000-0000000000e2', 'manual', 'Lead Converted', '600000002', 'converted', md5('t-closer-a@example.com')::uuid, now());

insert into public.leads (id, source, full_name, phone) values
  ('00000000-0000-4000-8000-0000000000e3', 'manual', 'Lead New 1', '600000003'),
  ('00000000-0000-4000-8000-0000000000e4', 'manual', 'Lead New 2', '600000004');

insert into public.leads (id, source, full_name, phone, contact_id) values
  ('00000000-0000-4000-8000-0000000000e5', 'manual', 'Lead Waiting', '600000005', '00000000-0000-4000-8000-0000000000a1');

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok($$select * from public.admin_users()$$, '42501', 'forbidden', 'a closer cannot list users');
select throws_ok($$select public.admin_counters()$$, '42501', 'forbidden', 'a closer cannot read the counters');
select throws_ok($$select * from public.admin_audit_log()$$, '42501', 'forbidden', 'a closer cannot read the audit log');
select throws_ok($$select public.set_user_active(md5('t-closer-b@example.com')::uuid, false)$$, '42501', 'forbidden', 'a closer cannot deactivate users');
select throws_ok($$select public.set_user_rates(md5('t-closer-b@example.com')::uuid, 20)$$, '42501', 'forbidden', 'a closer cannot change rates');
select throws_ok($$select * from public.reassign_portfolio(md5('t-closer-a@example.com')::uuid, md5('t-closer-b@example.com')::uuid)$$, '42501', 'forbidden', 'a closer cannot reassign a portfolio');
select throws_ok($$select public.log_totp_reset(md5('t-closer-b@example.com')::uuid)$$, '42501', 'forbidden', 'a closer cannot log a TOTP reset');

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok($$select * from public.admin_users()$$, '42501', 'forbidden', 'an admin without aal2 cannot list users');

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.admin_users()), 6::bigint, 'the admin lists every user');

select is(
  (select email from public.admin_users() where id = md5('t-closer-a@example.com')::uuid),
  't-closer-a@example.com',
  'admin_users returns the email from auth'
);

select is(
  (select array_agg(has_totp order by email) from public.admin_users() where id in (md5('t-closer-a@example.com')::uuid, md5('t-closer-b@example.com')::uuid)),
  array[true, false],
  'has_totp is true only for a verified factor'
);

select is(
  (select row(contacts_count, open_deals, accrued_pending)::text from public.admin_users() where id = md5('t-closer-a@example.com')::uuid),
  '(2,1,0)',
  'the portfolio counters ignore closed deals and the accrued amount is zero for now'
);

select is(
  public.admin_counters(),
  '{"leads_new": 2, "users_active": 6, "leads_waiting_admin": 1, "invitations_pending": 0}'::jsonb,
  'admin_counters counts unassigned and waiting leads separately'
);

select lives_ok(
  $$select public.set_user_rates(md5('t-closer-b@example.com')::uuid, 20, null, 8, null, 'weekly')$$,
  'the admin changes the rates and cadence of a closer'
);

select is(
  (select row(closer_rate, closer_recurring_rate, payout_cadence::text)::text from public.profiles where id = md5('t-closer-b@example.com')::uuid),
  '(20.00,8.00,weekly)',
  'the new rates are stored'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'profiles' and row_id = md5('t-closer-b@example.com')::uuid and action = 'update' and after ->> 'closer_rate' = '20.00'),
  1::bigint,
  'a rate change is audited'
);

select tests.login_as('t-admin@example.com');

select throws_ok($$select public.set_user_rates(md5('t-closer-b@example.com')::uuid, 20, null, 20)$$, 'P0001', 'rates_recurring_not_lower', 'a recurring rate must be below the project rate');
select throws_ok($$select public.set_user_rates(md5('t-closer-b@example.com')::uuid, 120)$$, 'P0001', 'rate_out_of_range', 'a rate above 100 fails');
select throws_ok($$select public.set_user_rates(md5('t-closer-b@example.com')::uuid, 20, 5)$$, 'P0001', 'parent_rate_needs_parent', 'a parent rate needs a parent closer');
select throws_ok($$select public.set_user_rates(md5('t-client@example.com')::uuid, 20)$$, 'P0001', 'rates_only_for_closers', 'rates only apply to closers');
select throws_ok($$select public.set_user_rates(gen_random_uuid(), 20)$$, 'P0001', 'user_not_found', 'an unknown user fails');

select throws_ok(
  $$select public.set_user_active(md5('t-closer-a@example.com')::uuid, false)$$,
  '23514',
  'closer_has_subclosers',
  'a closer with active subclosers cannot be deactivated'
);

select lives_ok($$select public.set_user_active(md5('t-sub-a@example.com')::uuid, false)$$, 'the admin deactivates a subcloser');

select is(
  (select row(is_active, archived_at is not null)::text from public.profiles where id = md5('t-sub-a@example.com')::uuid),
  '(f,t)',
  'deactivating also archives the profile'
);

select lives_ok($$select public.set_user_active(md5('t-closer-a@example.com')::uuid, false)$$, 'a closer without active subclosers can be deactivated');

select throws_ok(
  $$select public.set_user_active(md5('t-sub-a@example.com')::uuid, true)$$,
  'P0001',
  'parent_closer_inactive',
  'a subcloser cannot be reactivated under an inactive parent'
);

select lives_ok($$select public.set_user_active(md5('t-closer-a@example.com')::uuid, true)$$, 'the parent closer is reactivated');
select lives_ok($$select public.set_user_active(md5('t-sub-a@example.com')::uuid, true)$$, 'the subcloser is reactivated afterwards');

select is(
  (select row(is_active, archived_at is null)::text from public.profiles where id = md5('t-sub-a@example.com')::uuid),
  '(t,t)',
  'reactivating clears the archive mark'
);

select throws_ok(
  $$select public.set_user_active(md5('t-admin@example.com')::uuid, false)$$,
  '23514',
  'last_admin_required',
  'the last admin cannot be deactivated'
);

select throws_ok(
  $$select * from public.reassign_portfolio(md5('t-closer-a@example.com')::uuid, md5('t-client@example.com')::uuid)$$,
  'P0001',
  'invalid_assignee',
  'a portfolio cannot go to a client'
);

select throws_ok(
  $$select * from public.reassign_portfolio(md5('t-closer-a@example.com')::uuid, md5('t-closer-a@example.com')::uuid)$$,
  'P0001',
  'invalid_assignee',
  'a portfolio cannot go to the same user'
);

select throws_ok(
  $$select * from public.reassign_portfolio(md5('t-closer-a@example.com')::uuid, md5('t-closer-b@example.com')::uuid)$$,
  'P0001',
  'contact_email_conflict',
  'a portfolio with a contact email already owned by the target fails'
);

update public.contacts set email = 'b1@example.com' where id = '00000000-0000-4000-8000-0000000000b1';

select is(
  (select row(contacts, deals, leads)::text from public.reassign_portfolio(md5('t-closer-a@example.com')::uuid, md5('t-closer-b@example.com')::uuid)),
  '(2,1,1)',
  'reassign_portfolio reports the moved contacts, open deals and open leads'
);

select is(
  (select count(*) from public.contacts where owner_id = md5('t-closer-b@example.com')::uuid),
  3::bigint,
  'every contact of the source now belongs to the target'
);

select is(
  (select owner_id from public.deals where id = '00000000-0000-4000-8000-0000000000d2'),
  md5('t-closer-a@example.com')::uuid,
  'a closed deal keeps its original owner'
);

select is(
  (select assigned_to from public.leads where id = '00000000-0000-4000-8000-0000000000e2'),
  md5('t-closer-a@example.com')::uuid,
  'a converted lead keeps its original assignee'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'contacts' and action = 'update' and after ->> 'owner_id' = md5('t-closer-b@example.com')::uuid::text),
  2::bigint,
  'every contact owner change is audited'
);

select tests.login_as('t-admin@example.com');

select lives_ok($$select public.log_totp_reset(md5('t-closer-b@example.com')::uuid)$$, 'the admin logs a TOTP reset');

select is(
  (select count(*) from public.admin_audit_log('profiles', md5('t-closer-b@example.com')::uuid) where after ->> 'totp_reset' = 'true' and actor_name = 'Admin'),
  1::bigint,
  'the reset appears in the audit log with the actor name'
);

select throws_ok($$select public.log_totp_reset(gen_random_uuid())$$, 'P0001', 'user_not_found', 'a reset for an unknown user fails');

select is(
  (select count(*) from public.admin_audit_log(null, null, 1)),
  1::bigint,
  'the audit log honours the limit'
);

select is(
  (select bool_and(table_name = 'leads') and count(*) > 0 from public.admin_audit_log('leads')),
  true,
  'the audit log filters by table'
);

reset role;
insert into public.invitations (email, role, token_hash, invited_by)
values ('x@example.com', 'client', 'secret-hash-value', md5('t-admin@example.com')::uuid);
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.admin_audit_log('invitations') where after ? 'token_hash'),
  0::bigint,
  'the audit log never exposes token hashes'
);

select is(
  (public.admin_counters() ->> 'invitations_pending')::int,
  1,
  'admin_counters counts pending invitations'
);

select * from finish();

rollback;
