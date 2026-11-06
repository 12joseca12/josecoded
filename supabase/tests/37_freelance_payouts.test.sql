begin;

\ir support/helpers.sql

select plan(25);

select tests.clean();
select tests.create_user('y-admin@example.com', 'admin', 'Admin');
select tests.create_user('y-closer@example.com', 'closer', 'Closer');
select tests.create_user('y-free@example.com', 'freelance', 'Freelance One');
select tests.create_user('y-free2@example.com', 'freelance', 'Freelance Two');
select tests.create_user('y-client@example.com', 'client', 'Client');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000a1', 'Hourly Project', md5('y-client@example.com')::uuid, md5('y-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000a2', 'Milestone Project', md5('y-client@example.com')::uuid, md5('y-free@example.com')::uuid);

reset role;
select tests.login_as('y-admin@example.com');
select public.set_freelance_fee('00000000-0000-4000-8000-0000000000a1', 'hourly', null, 35);
select public.set_freelance_fee('00000000-0000-4000-8000-0000000000a2', 'milestones');
select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000a2'), 'M1', 300);
select public.add_fee_item((select id from public.freelance_fees where project_id = '00000000-0000-4000-8000-0000000000a2'), 'M2', 200);

reset role;
select tests.login_as('y-free@example.com');
select public.submit_fee_hours('00000000-0000-4000-8000-0000000000a1', 4, 'A');
select public.submit_fee_hours('00000000-0000-4000-8000-0000000000a1', 2, 'B');
select public.mark_item_delivered((select id from public.freelance_fee_items where label = 'M1'));

reset role;
select tests.login_as('y-admin@example.com');
select public.approve_fee_items(array[(select id from public.freelance_fee_items where label = 'A')]);

select is((public.admin_counters() ->> 'fee_items_pending')::int, 2, 'the admin counts the entries waiting for approval');
select is((public.admin_counters() ->> 'fees_approved_unpaid_amount')::numeric, 140.00, 'the admin counts approved unpaid fees');
select is((public.admin_counters() ->> 'stories_to_decide')::int, 0, 'earlier counters are kept');

select throws_ok($$select public.build_payout(md5('y-client@example.com')::uuid, ((now() at time zone 'Europe/Madrid')::date) - 7, ((now() at time zone 'Europe/Madrid')::date))$$, 'P0001', 'invalid_beneficiary', 'a client cannot be paid');
select throws_ok($$select public.build_payout(md5('y-free2@example.com')::uuid, ((now() at time zone 'Europe/Madrid')::date) - 7, ((now() at time zone 'Europe/Madrid')::date))$$, 'P0001', 'no_lines_in_period', 'a freelance without items has nothing to pay');
select lives_ok($$select public.build_payout(md5('y-free@example.com')::uuid, ((now() at time zone 'Europe/Madrid')::date) - 7, ((now() at time zone 'Europe/Madrid')::date))$$, 'the admin builds a payout for the freelance');
select is((select kind::text || '/' || total from public.payouts), 'freelance/140.00', 'only approved items are collected and the kind is freelance');
select is((select count(*)::int from public.freelance_fee_items where payout_id is not null), 1, 'one item is attached');
select is((select status::text from public.freelance_fee_items where label = 'B'), 'pending', 'pending items stay out');
select throws_ok($$select public.build_payout(md5('y-free@example.com')::uuid, ((now() at time zone 'Europe/Madrid')::date) - 7, ((now() at time zone 'Europe/Madrid')::date))$$, 'P0001', 'no_lines_in_period', 'attached items are not collected twice');

reset role;
select tests.login_as('y-free@example.com');
select is((select count(*)::int from public.payouts), 0, 'the freelance does not see the draft');

reset role;
select tests.login_as('y-admin@example.com');
select public.set_payout_status((select id from public.payouts), 'issued');

reset role;
select tests.login_as('y-free@example.com');
select is((select count(*)::int from public.payouts), 1, 'the freelance sees the issued payout');
select is((public.freelance_counters() ->> 'fees_owed_amount')::numeric, 140.00, 'owed matches the approved item');
select is((public.freelance_counters() ->> 'fees_pending_amount')::numeric, 570.00, 'pending counts pending and delivered items');
select is((public.freelance_counters() ->> 'items_to_deliver')::int, 1, 'one milestone is left to deliver');
select is((public.freelance_counters() ->> 'projects_active')::int, 2, 'both projects are active');

reset role;
select tests.login_as('y-free2@example.com');
select is((select count(*)::int from public.payouts), 0, 'another freelance does not see it');

reset role;
select tests.login_as('y-admin@example.com');
select public.set_payout_status((select id from public.payouts), 'paid', ((now() at time zone 'Europe/Madrid')::date), 'Transfer 1');

select is((select status::text from public.freelance_fee_items where label = 'A'), 'paid', 'paying the payout marks the items paid');

reset role;
select is(
  (select href from public.notifications where event = 'payout_paid' and user_id = md5('y-free@example.com')::uuid),
  '/freelance/pagos', 'the paid notification points to the freelance payments'
);

select tests.login_as('y-free@example.com');
select is((public.freelance_counters() ->> 'fees_paid_amount')::numeric, 140.00, 'paid is counted');
select is((public.freelance_counters() ->> 'fees_paid_year_amount')::numeric, 140.00, 'paid this year is counted');
select is((public.freelance_counters() ->> 'last_paid_at')::date, ((now() at time zone 'Europe/Madrid')::date), 'the last payment date is exposed');

reset role;
select tests.login_as('y-admin@example.com');
select public.approve_fee_items(array[(select id from public.freelance_fee_items where label = 'B')]);
select public.build_payout(md5('y-free@example.com')::uuid, ((now() at time zone 'Europe/Madrid')::date) - 7, ((now() at time zone 'Europe/Madrid')::date));
select public.delete_payout_draft((select id from public.payouts where status = 'draft'));
select is((select payout_id from public.freelance_fee_items where label = 'B'), null, 'deleting the draft frees the items');

reset role;
select tests.login_as('y-closer@example.com');
select throws_ok($$select public.freelance_counters()$$, '42501', 'forbidden', 'a closer has no freelance counters');

reset role;
select tests.login_as('y-client@example.com');
select throws_ok($$select public.freelance_counters()$$, '42501', 'forbidden', 'a client has no freelance counters');

select * from finish();

rollback;
