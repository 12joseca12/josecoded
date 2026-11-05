begin;

\ir support/helpers.sql

select plan(8);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-client@example.com', 'client', 'Client');

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select * from public.telegram_link_status()$$,
  '42501',
  'forbidden',
  'a client cannot read the Telegram link status'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select * from public.telegram_link_status()$$,
  '42501',
  'forbidden',
  'staff without aal2 cannot read the Telegram link status'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select row(linked_at, pending_code, pending_expires_at)::text from public.telegram_link_status()),
  row(null, null, null)::text,
  'a member with nothing linked and no code sees an empty status'
);

create temp table code_holder (code text);
grant all on code_holder to authenticated, service_role;
insert into code_holder select public.telegram_link_code();

select is(
  (select pending_code from public.telegram_link_status()),
  (select code from code_holder),
  'the pending code comes back to its owner'
);

select ok(
  (select pending_expires_at > now() and pending_expires_at <= now() + interval '15 minutes' from public.telegram_link_status()),
  'the pending code expires within fifteen minutes'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select pending_code from public.telegram_link_status()),
  null,
  'another member never sees someone else''s code'
);

reset role;
select tests.login_service();
select public.telegram_confirm_link((select code from code_holder), 777001);

reset role;
select tests.login_as('t-closer-a@example.com');

select ok(
  (select linked_at is not null and pending_code is null from public.telegram_link_status()),
  'after linking the status shows the date and no code'
);

select public.telegram_unlink();

select is(
  (select linked_at from public.telegram_link_status()),
  null,
  'after unlinking the status is empty again'
);

select * from finish();
rollback;
