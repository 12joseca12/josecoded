begin;

\ir support/helpers.sql

select plan(62);

select tests.clean();
select tests.create_user('f-admin@example.com', 'admin', 'Admin');
select tests.create_user('f-closer@example.com', 'closer', 'Closer');
select tests.create_user('f-free@example.com', 'freelance', 'Freelance One');
select tests.create_user('f-free2@example.com', 'freelance', 'Freelance Two');
select tests.create_user('f-client@example.com', 'client', 'Client');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000c1', 'Hourly Project', md5('f-client@example.com')::uuid, md5('f-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000c2', 'No Freelance Project', md5('f-client@example.com')::uuid, null),
  ('00000000-0000-4000-8000-0000000000c3', 'Fixed Project', md5('f-client@example.com')::uuid, md5('f-free@example.com')::uuid);

reset role;
select tests.login_as('f-closer@example.com');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'hourly', null, 35)$$, '42501', 'forbidden', 'a closer cannot set a fee');
select throws_ok($$select public.approve_fee_items(array[gen_random_uuid()])$$, '42501', 'forbidden', 'a closer cannot approve items');

reset role;
select tests.login_as('f-client@example.com');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 1, 'x')$$, '42501', 'forbidden', 'a client cannot submit hours');

reset role;
select tests.login_aal1('f-admin@example.com');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'hourly', null, 35)$$, '42501', 'forbidden', 'an admin without aal2 cannot set a fee');

reset role;
select tests.login_as('f-admin@example.com');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c2', 'hourly', null, 35)$$, 'P0001', 'project_has_no_freelance', 'a project without freelance has no fee');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'hourly')$$, 'P0001', 'invalid_fee', 'hourly needs a rate');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'fixed')$$, 'P0001', 'invalid_fee', 'fixed needs an amount');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'milestones', 100)$$, 'P0001', 'invalid_fee', 'milestones take no amount');
select lives_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'hourly', null, 35, 20, 'note')$$, 'the admin sets an hourly fee');
select is((select count(*)::int from public.freelance_fees), 1, 'one fee exists');
reset role;
select is((select count(*)::int from private.audit_log where table_name = 'freelance_fees' and action = 'insert'), 1, 'the fee insert is audited');
reset role;
select tests.login_as('f-admin@example.com');

reset role;
select tests.login_as('f-free@example.com');
select lives_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 5, 'Setup', ((now() at time zone 'Europe/Madrid')::date))$$, 'the freelance submits hours');
select is((select amount from public.freelance_fee_items where label = 'Setup'), 175.00::numeric, 'the amount is computed from hours and rate');
select is((select status::text from public.freelance_fee_items where label = 'Setup'), 'pending', 'a submitted entry is pending');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 16, 'Too much')$$, 'P0001', 'hours_cap_exceeded', 'the cap is enforced');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 1, 'Future', ((now() at time zone 'Europe/Madrid')::date) + 1)$$, 'P0001', 'future_date', 'a future date fails');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 0, 'Zero')$$, 'P0001', 'invalid_hours', 'zero hours fail');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 2.55, 'Decimals')$$, 'P0001', 'invalid_hours', 'more than one decimal fails');
select throws_ok($$select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c2', 1, 'Other')$$, 'P0001', 'fee_not_found', 'a project that is not mine has no fee');
select throws_ok($$insert into public.freelance_fee_items (fee_id, label, hours, amount) select id, 'Direct', 1, 1 from public.freelance_fees$$, '42501', null, 'items cannot be written directly');

reset role;
select throws_ok($$insert into public.freelance_fee_items (fee_id, label, hours, amount) select id, 'Manual', 1, 1 from public.freelance_fees$$, 'P0001', 'amount_is_computed', 'the amount cannot be fixed by hand');
select is((select count(*)::int from public.notifications where event = 'fee_submitted' and user_id = md5('f-admin@example.com')::uuid), 1, 'the admin is notified of the hours');
select is((select title from public.notifications where event = 'fee_submitted'), 'Hourly Project', 'the notification names the project');

reset role;
select tests.login_as('f-admin@example.com');
select throws_ok($$select public.add_fee_item((select id from public.freelance_fees), 'Hito', 100)$$, 'P0001', 'fee_mode_mismatch', 'items cannot be added to an hourly fee');
select is(public.approve_fee_items(array[(select id from public.freelance_fee_items where label = 'Setup')]), 1, 'the admin approves the entry');
select is((select status::text from public.freelance_fee_items where label = 'Setup'), 'approved', 'the entry is approved');
select isnt((select approved_at from public.freelance_fee_items where label = 'Setup'), null, 'approval is dated');
select throws_ok($$select public.approve_fee_items(array[(select id from public.freelance_fee_items where label = 'Setup')])$$, 'P0001', 'item_not_approvable', 'an approved entry cannot be approved again');
select throws_ok($$select public.approve_fee_items('{}')$$, 'P0001', 'invalid_selection', 'an empty selection fails');
select throws_ok($$select public.delete_fee_item((select id from public.freelance_fee_items where label = 'Setup'))$$, 'P0001', 'item_not_pending', 'an approved entry cannot be deleted');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'milestones')$$, 'P0001', 'fee_has_items', 'the mode cannot change with items');
select throws_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c1', 'hourly', null, 35, 4)$$, 'P0001', 'hours_cap_exceeded', 'the cap cannot go below the hours used');
reset role;
select is((select count(*)::int from private.audit_log where table_name = 'freelance_fee_items' and action = 'update'), 1, 'the status change is audited');
select is((select count(*)::int from public.notifications where event = 'fee_decided' and user_id = md5('f-free@example.com')::uuid), 1, 'the freelance is told about the decision');

reset role;
select tests.login_as('f-free@example.com');
select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 3, 'Rework', ((now() at time zone 'Europe/Madrid')::date));
reset role;
select tests.login_as('f-free2@example.com');
select throws_ok($$select public.delete_fee_item((select id from public.freelance_fee_items where label = 'Rework'))$$, 'P0001', 'item_not_found', 'another freelance cannot delete my entry');
select is((select count(*)::int from public.freelance_fee_items), 0, 'another freelance sees no items');
select is((select count(*)::int from public.freelance_fee_summary), 0, 'another freelance sees no fees');

reset role;
select tests.login_as('f-admin@example.com');
select throws_ok($$select public.reject_fee_item((select id from public.freelance_fee_items where label = 'Rework'), '  ')$$, 'P0001', 'reason_required', 'a rejection needs a reason');
select lives_ok($$select public.reject_fee_item((select id from public.freelance_fee_items where label = 'Rework'), 'Duplicated hours')$$, 'the admin rejects an entry');
select is((select rejected_reason from public.freelance_fee_items where label = 'Rework'), 'Duplicated hours', 'the reason is stored');

reset role;
select tests.login_as('f-free@example.com');
select public.submit_fee_hours('00000000-0000-4000-8000-0000000000c1', 2, 'Oops', ((now() at time zone 'Europe/Madrid')::date));
select lives_ok($$select public.delete_fee_item((select id from public.freelance_fee_items where label = 'Oops'))$$, 'the freelance deletes a pending entry');
select is(
  (select approved_unpaid_amount || '/' || hours_approved from public.freelance_fee_summary where project_name = 'Hourly Project'),
  '175.00/5.0', 'the summary adds up approved hours'
);

reset role;
select tests.login_as('f-admin@example.com');
select lives_ok($$select public.set_freelance_fee('00000000-0000-4000-8000-0000000000c3', 'fixed', 900)$$, 'the admin sets a fixed fee');
select lives_ok($$select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000c3'), 'First', 600)$$, 'a partial fits');
select throws_ok($$select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000c3'), 'Second', 400)$$, 'P0001', 'fee_amount_exceeded', 'partials cannot exceed the total');
select lives_ok($$select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000c3'), 'Second', 300)$$, 'the rest fits');

reset role;
select tests.login_as('f-free@example.com');
select lives_ok($$select public.mark_item_delivered((select id from public.freelance_fee_items where label = 'Second'))$$, 'the freelance delivers a milestone');
select throws_ok($$select public.mark_item_delivered((select id from public.freelance_fee_items where label = 'Second'))$$, 'P0001', 'item_not_pending', 'only pending items can be delivered');
select throws_ok($$select public.delete_fee_item((select id from public.freelance_fee_items where label = 'First'))$$, '42501', 'forbidden', 'the freelance cannot delete milestones');

reset role;
select is((select count(*)::int from public.notifications where event = 'fee_submitted'), 4, 'every submission and delivery notifies the admin');

reset role;
select tests.login_as('f-admin@example.com');
select is(public.approve_fee_items(array(select id from public.freelance_fee_items where label in ('First', 'Second'))), 2, 'pending and delivered items are approved together');
select is((select count(*)::int from public.freelance_fee_summary), 2, 'the admin sees every fee');
select lives_ok($$select public.set_project_freelance('00000000-0000-4000-8000-0000000000c3', md5('f-free2@example.com')::uuid)$$, 'the freelance of a project changes');
select throws_ok($$select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000c3'), 'Late', 10)$$, 'P0001', 'fee_closed', 'a closed fee takes no new items');

reset role;
select tests.login_as('f-free@example.com');
select is((select closed_at is not null from public.freelance_fee_summary where project_name = 'Fixed Project'), true, 'the closed fee stays visible with the project name');

reset role;
select tests.login_as('f-client@example.com');
select is((select count(*)::int from public.freelance_fees) + (select count(*)::int from public.freelance_fee_items) + (select count(*)::int from public.freelance_fee_summary), 0, 'a client reads no fee data');

reset role;
select tests.login_as('f-closer@example.com');
select is((select count(*)::int from public.freelance_fees) + (select count(*)::int from public.freelance_fee_summary), 0, 'a closer reads no fee data');

reset role;
select tests.login_as('f-admin@example.com');
select public.upsert_task('00000000-0000-4000-8000-0000000000c1', 'Mine', 'build', p_assignee_id => md5('f-free@example.com')::uuid);
select public.upsert_task('00000000-0000-4000-8000-0000000000c1', 'Theirs', 'build', p_assignee_id => md5('f-client@example.com')::uuid);

reset role;
select tests.login_as('f-free@example.com');
select lives_ok($$select public.set_my_task_status((select id from public.project_tasks where title = 'Mine'), 'doing')$$, 'the assignee moves a task');
select is((select status::text from public.project_tasks where title = 'Mine'), 'doing', 'the task is doing');
select throws_ok($$select public.set_my_task_status((select id from public.project_tasks where title = 'Theirs'), 'done')$$, '42501', 'forbidden', 'a task that is not mine cannot move');
select lives_ok($$select public.complete_my_task((select id from public.project_tasks where title = 'Mine'))$$, 'complete_my_task delegates');
select is((select status::text from public.project_tasks where title = 'Mine'), 'done', 'the task is done');

select * from finish();

rollback;

