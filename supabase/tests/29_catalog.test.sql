begin;

\ir support/helpers.sql

select plan(43);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');

select is((select count(*) from public.offers), 5::bigint, 'five offers are seeded');
select is((select count(*) from public.extras), 11::bigint, 'eleven extras are seeded');
select is((select count(*) from public.rates), 2::bigint, 'two rates are seeded');
select is((select count(*) from public.maintenance_plans), 3::bigint, 'three maintenance plans are seeded');
select is(
  (
    select count(*)
    from (
      select price from public.offers
      union all select price from public.extras
      union all select price from public.rates
      union all select price_monthly from public.maintenance_plans
    ) as p
    where price is not null
  ),
  0::bigint,
  'every seeded price is null, so the web shows the price as under review'
);
select is(
  (select string_agg(slug, ',' order by sort) from public.offers),
  'web-presencia,web-negocio,web-plataforma,app-primera-version,app-producto',
  'offers keep the slugs and order of the code catalog'
);

select tests.logout();

select throws_ok($$select count(*) from public.offers$$, '42501', null, 'anon cannot read offers');
select throws_ok($$select count(*) from public.extras$$, '42501', null, 'anon cannot read extras');
select throws_ok($$select count(*) from public.rates$$, '42501', null, 'anon cannot read rates');
select throws_ok($$select count(*) from public.maintenance_plans$$, '42501', null, 'anon cannot read maintenance plans');
select throws_ok($$select count(*) from public.price_changes$$, '42501', null, 'anon cannot read price changes');
select throws_ok($$select count(*) from public.public_offers$$, '42501', null, 'anon cannot read the public offers view');
select throws_ok($$select count(*) from public.public_extras$$, '42501', null, 'anon cannot read the public extras view');

reset role;
select tests.login_as('t-closer-a@example.com');

select is((select count(*) from public.offers), 0::bigint, 'a closer sees no offers');
select is((select count(*) from public.price_changes), 0::bigint, 'a closer sees no price changes');
select throws_ok($$select count(*) from public.public_offers$$, '42501', null, 'a closer cannot read the public offers view');

with changed as (
  update public.offers set price = 1 where slug = 'web-presencia' returning 1
)
select is((select count(*) from changed), 0::bigint, 'a closer updates no offer');

select throws_ok(
  $$insert into public.extras (slug, name_es, name_en) values ('closer-extra', 'x', 'x')$$,
  '42501',
  null,
  'a closer cannot insert extras'
);

reset role;
select tests.login_as('t-admin@example.com', 'aal1');

select is((select count(*) from public.offers), 0::bigint, 'an admin without aal2 sees no offers');

with changed as (
  update public.offers set price = 1 where slug = 'web-presencia' returning 1
)
select is((select count(*) from changed), 0::bigint, 'an admin without aal2 updates no offer');

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.offers), 5::bigint, 'an admin with aal2 sees every offer');

select lives_ok(
  $$update public.offers set price = 1200.50 where slug = 'web-presencia'$$,
  'an admin updates an offer price'
);

select results_eq(
  $$select table_name, row_id, field, before, after, changed_by from public.price_changes where row_id = 'web-presencia'$$,
  $$values ('offers', 'web-presencia', 'price', null::text, '1200.50', md5('t-admin@example.com')::uuid)$$,
  'the price change is recorded with before, after and the author'
);

select lives_ok(
  $$update public.offers set weeks_min = 3, weeks_max = 4 where slug = 'web-presencia'$$,
  'an admin updates the weeks of an offer'
);

select is(
  (select count(*) from public.price_changes where row_id = 'web-presencia'),
  1::bigint,
  'changing weeks is not a price change'
);

select lives_ok(
  $$update public.extras set price = 300, visible = false where slug = 'seo'$$,
  'an admin updates an extra price and visibility'
);

select is(
  (select string_agg(field, ',' order by field) from public.price_changes where row_id = 'seo'),
  'price,visible',
  'both fields of the extra are recorded'
);

select lives_ok(
  $$update public.maintenance_plans set price_monthly = 49 where slug = 's'$$,
  'an admin updates a maintenance plan price'
);

select lives_ok(
  $$update public.rates set price = 60 where code = 'hourly'$$,
  'an admin updates a rate'
);

select lives_ok(
  $$insert into public.extras (slug, name_es, name_en, billing, sort) values ('chat-pro', 'Chat', 'Chat', 'monthly', 500)$$,
  'an admin creates an extra'
);

select lives_ok(
  $$insert into public.maintenance_plans (slug, name_es, name_en, sort) values ('xl', 'Plan XL', 'Plan XL', 40)$$,
  'an admin creates a maintenance plan'
);

select throws_ok(
  $$insert into public.extras (slug, name_es, name_en) values ('Bad Slug', 'x', 'x')$$,
  '23514',
  null,
  'an extra slug must be a kebab-case identifier'
);

select throws_ok(
  $$insert into public.offers (slug, platform, name_es, name_en, weeks_min, weeks_max) values ('web-extra', 'web', 'x', 'x', 1, 2)$$,
  '42501',
  null,
  'offers cannot be created from the API'
);

select throws_ok(
  $$insert into public.price_changes (table_name, row_id, field) values ('offers', 'web-negocio', 'price')$$,
  '42501',
  null,
  'price changes cannot be written directly'
);

select throws_ok(
  $$update public.offers set price = -1 where slug = 'web-negocio'$$,
  '23514',
  null,
  'a negative price is rejected'
);

select throws_ok(
  $$update public.offers set weeks_min = 9, weeks_max = 3 where slug = 'web-negocio'$$,
  '23514',
  null,
  'an inverted weeks range is rejected'
);

select throws_ok(
  $$update public.offers set slug = 'web-otro' where slug = 'web-negocio'$$,
  '42501',
  null,
  'the slug of an offer cannot be changed from the API'
);

reset role;
select tests.login_service();

select is((select count(*) from public.public_offers), 5::bigint, 'service role reads the public offers view');
select is(
  (select price from public.public_offers where slug = 'web-presencia'),
  1200.50::numeric,
  'the view exposes the updated price'
);
select is((select count(*) from public.public_extras where slug = 'seo'), 0::bigint, 'a hidden extra is not in the public view');
select is((select count(*) from public.public_extras), 11::bigint, 'the public extras view lists the visible ones, including the new one');

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$update public.offers set archived_at = now() where slug = 'app-producto'$$,
  'an admin archives an offer'
);

reset role;
select tests.login_service();

select is(
  (select count(*) from public.public_offers where slug = 'app-producto'),
  0::bigint,
  'an archived offer disappears from the public view'
);

select * from finish();

rollback;
