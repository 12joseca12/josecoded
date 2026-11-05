begin;

\ir support/helpers.sql

select plan(14);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

create temp table clock as
select
  now() - interval '2 hours' as overdue,
  (
    (date_trunc('day', now() at time zone 'Europe/Madrid') + interval '1 day')
    at time zone 'Europe/Madrid'
  ) - interval '1 second' as later_today,
  (
    (date_trunc('day', now() at time zone 'Europe/Madrid') + interval '1 day')
    at time zone 'Europe/Madrid'
  ) + interval '12 hours' as tomorrow;

insert into public.contacts (id, owner_id, full_name, email, import_id, next_action, next_action_at, archived_at)
select v.id, md5(v.owner)::uuid, v.name, v.email, gen_random_uuid(), 'Llamar', v.at, v.archived
from clock, lateral (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 't-closer-a@example.com', 'A overdue', 'a1@example.com', clock.overdue, null::timestamptz),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 't-closer-a@example.com', 'A today', 'a2@example.com', clock.later_today, null),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 't-closer-a@example.com', 'A won', 'a3@example.com', null, null),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 't-closer-a@example.com', 'A archived', 'a4@example.com', clock.overdue, now()),
  ('00000000-0000-4000-8000-0000000000a5'::uuid, 't-closer-a@example.com', 'A tomorrow', 'a5@example.com', clock.tomorrow, null),
  ('00000000-0000-4000-8000-0000000000e1'::uuid, 't-sub-a@example.com', 'Sub overdue', 's1@example.com', clock.overdue, null),
  ('00000000-0000-4000-8000-0000000000f1'::uuid, 't-closer-b@example.com', 'B overdue', 'b1@example.com', clock.overdue, null)
) as v(id, owner, name, email, at, archived);

insert into public.deals (contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000a1', 'new', 'hiring'),
  ('00000000-0000-4000-8000-0000000000a2', 'contacted', 'freelance'),
  ('00000000-0000-4000-8000-0000000000a4', 'new', 'hiring'),
  ('00000000-0000-4000-8000-0000000000e1', 'meeting', 'hiring'),
  ('00000000-0000-4000-8000-0000000000f1', 'proposal', 'project');

insert into public.deals (contact_id, stage, via, won_amount, won_at) values
  ('00000000-0000-4000-8000-0000000000a3', 'won', 'project', 1000, now());

insert into public.leads (source, full_name, phone) values
  ('manual', 'Libre Uno', '600000001'),
  ('manual', 'Libre Dos', '600000002');

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select * from public.crm_counters()$$,
  '42501',
  'forbidden',
  'a client cannot read the counters'
);

reset role;
select tests.login_as('t-freelance@example.com');

select throws_ok(
  $$select * from public.crm_counters()$$,
  '42501',
  'forbidden',
  'a freelance cannot read the counters'
);

reset role;
select tests.login_aal1('t-closer-a@example.com');

select throws_ok(
  $$select * from public.crm_counters()$$,
  '42501',
  'forbidden',
  'a closer without aal2 cannot read the counters'
);

reset role;
select tests.logout();

select throws_ok(
  $$select * from public.crm_counters()$$,
  '42501',
  null,
  'anon cannot execute the counters'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select row(inbox_new, actions_overdue, actions_today, deals_new, deals_contacted, deals_meeting, deals_proposal)::text from public.crm_counters()),
  row(2, 2, 1, 1, 1, 1, 0)::text,
  'a closer counts her own and her subcloser portfolio, the inbox, and skips archived, won and tomorrow'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select is(
  (select row(inbox_new, actions_overdue, actions_today, deals_new, deals_contacted, deals_meeting, deals_proposal)::text from public.crm_counters()),
  row(2, 1, 0, 0, 0, 1, 0)::text,
  'a subcloser counts only her own portfolio'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  (select row(inbox_new, actions_overdue, actions_today, deals_new, deals_contacted, deals_meeting, deals_proposal)::text from public.crm_counters()),
  row(2, 1, 0, 0, 0, 0, 1)::text,
  'another closer never counts a portfolio that is not hers'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select row(inbox_new, actions_overdue, actions_today, deals_new, deals_contacted, deals_meeting, deals_proposal)::text from public.crm_counters()),
  row(2, 3, 1, 1, 1, 1, 1)::text,
  'the admin counts every active portfolio'
);

select is(
  (select count(*) from public.crm_counters()),
  1::bigint,
  'the counters come back as a single row'
);

reset role;

select is(
  (select p.prosecdef from pg_proc p where p.oid = 'public.crm_counters()'::regprocedure),
  false,
  'crm_counters runs as the caller so row level security scopes it'
);

select is(
  (select p.provolatile::text from pg_proc p where p.oid = 'public.crm_counters()'::regprocedure),
  's',
  'crm_counters is stable'
);

select ok(
  not has_function_privilege('anon', 'public.crm_counters()', 'execute')
  and has_function_privilege('authenticated', 'public.crm_counters()', 'execute'),
  'only authenticated can execute crm_counters'
);

select tests.login_as('t-closer-a@example.com');
update public.contacts set next_action_at = now() + interval '1 second' where id = '00000000-0000-4000-8000-0000000000a1';

select is(
  (select actions_overdue from public.crm_counters()),
  1,
  'moving a step into the future takes it out of the overdue count'
);

reset role;
select tests.login_as('t-closer-a@example.com');
update public.contacts set archived_at = now() where id = '00000000-0000-4000-8000-0000000000e1';

select is(
  (select row(actions_overdue, deals_meeting)::text from public.crm_counters()),
  row(0, 0)::text,
  'archiving a subcloser contact removes its step and its deal from the counters'
);

select * from finish();
rollback;
