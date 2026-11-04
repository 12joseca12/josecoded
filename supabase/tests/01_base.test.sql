begin;

\ir support/helpers.sql

select plan(34);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

reset role;
select tests.logout();

select throws_ok($$select * from public.profiles$$, '42501', null, 'anon cannot read profiles');
select throws_ok($$select private.is_admin()$$, '42501', null, 'anon cannot call private functions');
select throws_ok($$select public.update_my_profile('X')$$, '42501', null, 'anon cannot call update_my_profile');

reset role;
select tests.login_as('t-closer-a@example.com');

select results_eq(
  $$select full_name from public.profiles order by full_name$$,
  $$values ('Closer A'), ('Sub A')$$,
  'closer sees own row and subclosers only'
);

select results_eq(
  $$select full_name, role::text from public.team_profiles order by full_name$$,
  $$values ('Closer A', 'closer'), ('Sub A', 'closer')$$,
  'team_profiles exposes name and role of own team'
);

select results_eq(
  $$select closer_rate, parent_rate from public.profiles where id = md5('t-sub-a@example.com')::uuid$$,
  $$values (10.00::numeric, 5.00::numeric)$$,
  'parent closer reads the rates of the subcloser (decision 7.10)'
);

select is(
  (select count(*) from public.profiles where full_name in ('Closer B', 'Admin', 'Client', 'Freelance')),
  0::bigint,
  'closer does not see other closers, clients, freelancers or admin'
);

select lives_ok($$select public.update_my_profile('Closer Renamed', 'en')$$, 'update_my_profile succeeds');

select results_eq(
  $$select full_name, locale::text from public.profiles where id = private.uid()$$,
  $$values ('Closer Renamed', 'en')$$,
  'update_my_profile changed name and locale'
);

select lives_ok(
  $$update public.profiles set role = 'admin', closer_rate = 99 where id = private.uid()$$,
  'direct update of own row is filtered, not an error'
);

select results_eq(
  $$select role::text, closer_rate from public.profiles where id = private.uid()$$,
  $$values ('closer', 10.00::numeric)$$,
  'role and rate unchanged after direct update'
);

select throws_ok(
  $$update public.profiles set id = gen_random_uuid() where id = private.uid()$$,
  '42501',
  null,
  'id column is not updatable by authenticated'
);

select throws_ok(
  $$select public.update_my_profile('   ')$$,
  '23514',
  'invalid_full_name',
  'update_my_profile rejects a blank name'
);

select throws_ok($$select * from private.audit_log$$, '42501', null, 'authenticated cannot read audit_log');

reset role;
select tests.login_as('t-client@example.com', 'aal1');

select is((select count(*) from public.profiles), 1::bigint, 'client sees only own profile even with aal1');

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.profiles), 6::bigint, 'admin sees every profile');

select lives_ok(
  $$update public.profiles set closer_rate = 12 where full_name = 'Closer B'$$,
  'admin updates a rate'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select is((select count(*) from public.profiles), 1::bigint, 'admin with aal1 sees only own row');

reset role;
select tests.login_as('t-admin@example.com');

select is((select private.is_staff()), true, 'is_staff true for admin with aal2');

reset role;
select tests.login_aal1('t-admin@example.com');

select is((select private.is_admin()), false, 'is_admin false for admin with aal1');

reset role;
select tests.login_as('t-closer-a@example.com');

select is((select private.is_staff()), true, 'is_staff true for closer with aal2');

reset role;
select tests.login_aal1('t-closer-a@example.com');

select is((select private.is_staff()), false, 'is_staff false for closer with aal1');

reset role;
select tests.login_as('t-client@example.com');

select is((select private.is_staff()), false, 'is_staff false for client even with aal2');

reset role;
select tests.login_as('t-freelance@example.com');

select is((select private.is_staff()), true, 'is_staff true for freelance with aal2');

reset role;

select is(
  (select count(*) from private.audit_log
   where table_name = 'profiles' and action = 'update' and actor_id = md5('t-admin@example.com')::uuid),
  1::bigint,
  'admin rate change was audited with the actor'
);

update public.profiles set is_active = false where full_name = 'Closer B';
reset role;
select tests.login_as('t-closer-b@example.com');
select is((select private.role()::text), null, 'deactivated profile has no role');

reset role;

select throws_ok(
  $$select tests.create_user('t-subsub@example.com', 'closer', 'Sub of Sub', 't-sub-a@example.com')$$,
  '23514',
  'invalid_parent_closer',
  'a subcloser cannot be a parent'
);

select throws_ok(
  $$select tests.create_user('t-bad-parent@example.com', 'closer', 'Bad Parent', 't-freelance@example.com')$$,
  '23514',
  'invalid_parent_closer',
  'parent must be a closer'
);

select throws_ok(
  $$update public.profiles set parent_closer_id = md5('t-closer-b@example.com')::uuid where id = md5('t-closer-a@example.com')::uuid$$,
  '23514',
  'closer_with_subclosers_cannot_have_parent',
  'a closer with subclosers cannot get a parent'
);

select throws_ok(
  $$update public.profiles set role = 'freelance', closer_rate = null where id = md5('t-closer-a@example.com')::uuid$$,
  '23514',
  'closer_has_subclosers',
  'a closer with subclosers cannot change role'
);

select throws_ok(
  $$update public.profiles set closer_rate = 5 where full_name = 'Freelance'$$,
  '23514',
  null,
  'rates are only for closers'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$update public.profiles set is_active = false where id = md5('t-admin@example.com')::uuid$$,
  '23514',
  'last_admin_required',
  'the only admin cannot deactivate self'
);

select throws_ok(
  $$update public.profiles set role = 'closer' where id = md5('t-admin@example.com')::uuid$$,
  '23514',
  'last_admin_required',
  'the only admin cannot demote self'
);

reset role;

select throws_ok(
  $$update public.profiles set role = 'admin' where id = md5('t-client@example.com')::uuid$$,
  '23505',
  null,
  'a second admin cannot exist'
);

select * from finish();

rollback;
