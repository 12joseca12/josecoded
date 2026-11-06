begin;

\ir support/helpers.sql

select plan(8);

select tests.clean();
select tests.create_user('s-admin@example.com', 'admin', 'Admin');
select tests.create_user('s-closer@example.com', 'closer', 'Closer');
select tests.create_user('s-client@example.com', 'client', 'Client');

insert into public.projects (id, name, client_id) values
  ('00000000-0000-4000-8000-0000000000b1', 'Project One', md5('s-client@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000b2', 'Project Two', null);

insert into public.stories (project_id, author_id, title, as_a, i_want, so_that, status, estimate_hours, estimate_amount) values
  ('00000000-0000-4000-8000-0000000000b1', md5('s-client@example.com')::uuid, 'Proposed one', 'a', 'b', 'c', 'proposed', null, null),
  ('00000000-0000-4000-8000-0000000000b1', md5('s-client@example.com')::uuid, 'Proposed two', 'a', 'b', 'c', 'proposed', null, null),
  ('00000000-0000-4000-8000-0000000000b2', null, 'Proposed three', 'a', 'b', 'c', 'proposed', null, null),
  ('00000000-0000-4000-8000-0000000000b2', null, 'In review', 'a', 'b', 'c', 'in_review', 4, 200),
  ('00000000-0000-4000-8000-0000000000b2', null, 'Rejected', 'a', 'b', 'c', 'rejected', null, null);

reset role;
select tests.login_as('s-closer@example.com');

select throws_ok($$select public.admin_counters()$$, '42501', 'forbidden', 'a closer cannot read the admin counters');

reset role;
select tests.login_as('s-client@example.com');

select throws_ok($$select public.admin_counters()$$, '42501', 'forbidden', 'a client cannot read the admin counters');

reset role;
select tests.login_as('s-admin@example.com');

select is(
  (public.admin_counters() ->> 'stories_to_decide')::int,
  3,
  'stories_to_decide counts only the proposed stories'
);

select ok(
  public.admin_counters() ?& array[
    'leads_new', 'leads_waiting_admin', 'invitations_pending', 'users_active',
    'accrued_pending_count', 'accrued_pending_amount', 'payments_overdue',
    'proformas_unpaid', 'payouts_draft', 'jobs_failed', 'unread_threads', 'stories_to_decide'
  ],
  'admin_counters keeps every earlier key'
);

reset role;
update public.stories set status = 'in_review', estimate_hours = 2, estimate_amount = 100 where title = 'Proposed one';
select tests.login_as('s-admin@example.com');

select is(
  (public.admin_counters() ->> 'stories_to_decide')::int,
  2,
  'a story leaves the counter once it is in review'
);

reset role;
delete from public.stories;
select tests.login_as('s-admin@example.com');

select is((public.admin_counters() ->> 'stories_to_decide')::int, 0, 'no stories means zero');

reset role;
select tests.login_aal1('s-admin@example.com');

select throws_ok($$select public.admin_counters()$$, '42501', 'forbidden', 'an admin without aal2 is refused');

reset role;
select ok(
  has_function_privilege('authenticated', 'public.admin_counters()', 'execute')
    and not has_function_privilege('anon', 'public.admin_counters()', 'execute'),
  'only authenticated executes admin_counters'
);

select * from finish();
rollback;
