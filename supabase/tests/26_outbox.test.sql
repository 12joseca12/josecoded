begin;

\ir support/helpers.sql

select plan(41);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');

reset role;
select tests.login_service();

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'Hiring Lead', p_email => 'hiring@example.com', p_consent => true, p_ip_hash => md5('o1'))$$,
  'a hiring form lead is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'freelance', p_full_name => 'Freelance Lead', p_email => 'freelance-lead@example.com', p_consent => true, p_ip_hash => md5('o2'))$$,
  'a freelance form lead is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'Project Lead', p_email => 'project-lead@example.com', p_consent => true, p_ip_hash => md5('o3'))$$,
  'a project form lead is accepted'
);

reset role;

select is(
  (select count(*) from private.outbox where template = 'lead_new' and recipient = 'hola@josecoded.com'),
  1::bigint,
  'a hiring lead queues one email to hola@'
);

select is(
  (select count(*) from private.outbox where template = 'lead_new' and recipient = 'freelance@josecoded.com'),
  1::bigint,
  'a freelance lead queues one email to freelance@'
);

select is(
  (select count(*) from private.outbox where template = 'lead_new' and recipient = 'proyectos@josecoded.com'),
  1::bigint,
  'a project lead queues one email to proyectos@'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'lead_new'),
  3::bigint,
  'the admin gets a bell notification per unassigned lead'
);

select is(
  (select count(*) from private.outbox where template = 'notification' and recipient = 't-admin@example.com'),
  3::bigint,
  'the admin also gets the email channel by default'
);

select is(
  (select href from public.notifications where user_id = md5('t-admin@example.com')::uuid order by created_at, id limit 1) ~ '^/admin/interesados/[0-9a-f-]{36}$',
  true,
  'the notification links to the lead'
);

insert into public.leads (source, full_name, phone, message, assigned_to, assigned_at, assigned_by)
values (
  'whatsapp', 'Assigned Lead', '600000009', 'hola',
  md5('t-closer-a@example.com')::uuid, now(), md5('t-admin@example.com')::uuid
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-closer-a@example.com')::uuid and event = 'lead_claimed'),
  1::bigint,
  'an assigned lead notifies the assignee with lead_claimed'
);

select is(
  (select count(*) from private.outbox where template = 'lead_new' and payload ->> 'source' = 'whatsapp'),
  0::bigint,
  'a lead that is not from a public channel does not email an inbox'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'lead_new'),
  4::bigint,
  'the admin is also told about an assigned lead'
);

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select public.set_notification_pref('lead_new', 'email', false)$$,
  'a staff member can switch off a channel'
);

select lives_ok(
  $$select public.set_notification_pref('lead_new', 'bell', false)$$,
  'a second channel for the same event updates the same row'
);

select is(
  (select row(telegram, email, bell)::text from public.notification_prefs where user_id = md5('t-admin@example.com')::uuid and event = 'lead_new'),
  '(t,f,f)',
  'the preferences keep one row per event with each channel flag'
);

select throws_ok(
  $$select public.set_notification_pref('not_an_event', 'email', true)$$,
  '22P02',
  null,
  'an unknown event is rejected'
);

select throws_ok(
  $$select public.set_notification_pref('lead_new', 'sms', true)$$,
  'P0001',
  'invalid_channel',
  'an unknown channel is rejected'
);

reset role;
select tests.login_service();
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'Muted Lead', p_email => 'muted@example.com', p_consent => true, p_ip_hash => md5('o4'))$$,
  'a lead after muting the admin channels is accepted'
);
reset role;

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'lead_new'),
  4::bigint,
  'a muted bell channel creates no notification'
);

select is(
  (select count(*) from private.outbox where template = 'notification' and recipient = 't-admin@example.com'),
  4::bigint,
  'a muted email channel queues no email'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select count(*) from public.notifications),
  1::bigint,
  'a closer reads only their own notifications'
);

select is(
  (select count(*) from public.notification_prefs),
  0::bigint,
  'a closer does not read the admin preferences'
);

select throws_ok(
  $$select count(*) from private.outbox$$,
  '42501',
  null,
  'authenticated cannot read the outbox'
);

select is(
  public.mark_notifications_read(array(select id from public.notifications)),
  1,
  'a closer marks their notification as read'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  public.mark_notifications_read(array(select id from public.notifications)),
  0,
  'marking reads on notifications of others changes nothing'
);

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select public.telegram_link_code()$$,
  '42501',
  'forbidden',
  'a client cannot generate a Telegram code'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select public.telegram_link_code()$$,
  '42501',
  'forbidden',
  'staff without aal2 cannot generate a Telegram code'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.send_test_notification('telegram')$$,
  'P0001',
  'telegram_not_linked',
  'a test over Telegram needs a linked chat'
);

select lives_ok(
  $$select public.send_test_notification('email')$$,
  'a staff member queues a test email'
);

create temp table code_holder (code text);
grant all on code_holder to authenticated, service_role;
insert into code_holder select public.telegram_link_code();

select is(
  (select code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{6}$' from code_holder),
  true,
  'the Telegram code has six characters from the unambiguous alphabet'
);

reset role;
select tests.login_service();

select is(
  (select count(*) from public.outbox_claim(50) where template = 'test' and recipient = 't-closer-a@example.com'),
  1::bigint,
  'the service claims the test email'
);

select throws_ok(
  $$select public.telegram_confirm_link('ZZZZZZ', 42)$$,
  'P0001',
  'code_invalid_or_expired',
  'an unknown code does not link'
);

select is(
  public.telegram_confirm_link((select code from code_holder), 4242),
  md5('t-closer-a@example.com')::uuid,
  'a valid code links the chat to its owner'
);

select throws_ok(
  $$select public.telegram_confirm_link((select code from code_holder), 4242)$$,
  'P0001',
  'code_invalid_or_expired',
  'a code works only once'
);

reset role;

update private.telegram_codes set expires_at = now() - interval '1 minute';
reset role;
select tests.login_as('t-closer-b@example.com');
insert into code_holder select public.telegram_link_code();
reset role;
update private.telegram_codes set expires_at = now() - interval '1 second';
reset role;
select tests.login_service();

select throws_ok(
  $$select public.telegram_confirm_link((select code from code_holder order by code limit 1 offset 1), 99)$$,
  'P0001',
  'code_invalid_or_expired',
  'an expired code does not link'
);

reset role;
update private.outbox set status = 'queued', locked_at = null, attempts = 0;
select tests.login_service();

create temp table claimed (id bigint);
grant all on claimed to service_role;
insert into claimed select id from public.outbox_claim(2);

select is((select count(*) from claimed), 2::bigint, 'outbox_claim hands out the requested amount');

select is(
  (select count(*) from public.outbox_claim(100) c where c.id in (select id from claimed)),
  0::bigint,
  'outbox_claim never hands out the same item twice'
);

select lives_ok(
  $$select public.outbox_mark((select min(id) from claimed), false, 'smtp down')$$,
  'a failed delivery is recorded'
);

reset role;

select is(
  (select row(status::text, attempts)::text from private.outbox where id = (select min(id) from claimed)),
  '(queued,1)',
  'a failed delivery goes back to the queue with one attempt'
);

select tests.login_service();

select throws_ok(
  $$select public.outbox_mark((select min(id) from claimed), true)$$,
  'P0001',
  'outbox_item_not_sending',
  'an item that is not being sent cannot be marked'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select * from public.outbox_claim(1)$$,
  '42501',
  null,
  'authenticated cannot claim outbox items'
);

select * from finish();

rollback;
