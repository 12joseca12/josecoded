begin;

\ir support/helpers.sql

select plan(13);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-closer-a@example.com')::uuid, 'Contacto A', 'a@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', md5('t-sub-a@example.com')::uuid, 'Contacto S', 's@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'new', 'freelance');

reset role;
select tests.login_as('t-closer-a@example.com');

select results_eq(
  $$select c.full_name, d.stage::text from public.contacts c join public.deals d on d.contact_id = c.id order by c.full_name$$,
  $$values ('Contacto A', 'proposal'), ('Contacto S', 'new')$$,
  'parent closer lists own and subcloser contacts with their deals'
);

select results_eq(
  $$update public.deals set stage = 'meeting' where id = '00000000-0000-4000-8000-0000000000d2' returning stage::text$$,
  $$values ('meeting')$$,
  'parent closer moves the stage of a subcloser deal'
);

select results_eq(
  $$update public.deals set stage = 'lost', lost_reason = 'precio' where id = '00000000-0000-4000-8000-0000000000d1' returning lost_reason$$,
  $$values ('precio')$$,
  'closer loses own deal with a reason'
);

select results_eq(
  $$update public.deals set stage = 'new', lost_reason = null where id = '00000000-0000-4000-8000-0000000000d1' returning lost_reason$$,
  $$values (null::text)$$,
  'reopening a lost deal clears the reason'
);

select results_eq(
  $$with moved as (
    update public.deals set stage = 'contacted'
    where id = '00000000-0000-4000-8000-0000000000d1' and updated_at = '1999-01-01'
    returning id
  ) select count(*)::int from moved$$,
  $$values (0)$$,
  'a stale updated_at matches no row'
);

select lives_ok(
  $$insert into public.activities (contact_id, author_id, kind, body) values ('00000000-0000-4000-8000-0000000000a2', private.uid(), 'note', 'del padre')$$,
  'parent closer logs an activity on a subcloser contact'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select throws_ok(
  $$insert into public.activities (contact_id, author_id, kind, body) values ('00000000-0000-4000-8000-0000000000a1', private.uid(), 'note', 'ajena')$$,
  '42501',
  null,
  'subcloser cannot log an activity on a parent contact'
);

select throws_ok(
  $$update public.contacts set owner_id = md5('t-closer-a@example.com')::uuid where id = '00000000-0000-4000-8000-0000000000a2'$$,
  '42501',
  'owner_change_admin_only',
  'subcloser cannot reassign even a contact it owns'
);

select results_eq(
  $$select full_name from public.contacts$$,
  $$values ('Contacto S')$$,
  'subcloser only lists own contacts'
);

select results_eq(
  $$with moved as (
    update public.deals set stage = 'contacted' where id = '00000000-0000-4000-8000-0000000000d1' returning id
  ) select count(*)::int from moved$$,
  $$values (0)$$,
  'subcloser cannot move a parent deal'
);

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*)::int from public.contacts), 2, 'admin lists every contact');

select lives_ok(
  $$insert into public.contacts (owner_id, full_name) values (private.uid(), 'Contacto del admin')$$,
  'admin creates a contact owned by self'
);

select lives_ok(
  $$update public.contacts set owner_id = md5('t-sub-a@example.com')::uuid where id = '00000000-0000-4000-8000-0000000000a1'$$,
  'admin reassigns a contact'
);

select * from finish();
rollback;
