begin;

\ir support/helpers.sql

select plan(36);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer@example.com', 'closer', 'Closer');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

reset role;
select tests.logout();

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba', p_email => 'p@example.com', p_consent => true, p_ip_hash => md5('anon'))$$,
  '42501',
  null,
  'anon cannot execute submit_lead'
);

select throws_ok(
  $$insert into public.leads (source, full_name, email, consent_at) values ('form', 'Prueba', 'p@example.com', now())$$,
  '42501',
  null,
  'anon cannot insert into leads'
);

reset role;
select tests.login_as('t-closer@example.com');

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba', p_email => 'p@example.com', p_consent => true, p_ip_hash => md5('closer'))$$,
  '42501',
  null,
  'authenticated cannot execute submit_lead'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone) values ('manual', 'Prueba', '600000000')$$,
  '42501',
  null,
  'closer cannot insert leads'
);

select throws_ok($$select * from private.form_quota$$, '42501', null, 'authenticated cannot read form_quota');

reset role;
select tests.login_service();

select lives_ok(
  $$select public.submit_lead(
    p_source => 'form', p_via => 'hiring', p_full_name => 'Prueba Uno', p_email => 'uno@example.com',
    p_phone => '600000001', p_organization => 'Org', p_message => 'Hola', p_offer_url => 'https://example.com/oferta',
    p_company => 'Empresa', p_page_path => '/es/contacto', p_locale => 'es', p_consent => true, p_ip_hash => md5('ip-first')
  )$$,
  'service_role submits a hiring lead'
);

select lives_ok(
  $$select public.submit_lead(
    p_source => 'form', p_via => 'pack', p_pack_id => gen_random_uuid(), p_full_name => 'Prueba Pack',
    p_email => 'pack@example.com', p_has_domain => true, p_has_store_accounts => false,
    p_consent => true, p_ip_hash => md5('ip-pack')
  )$$,
  'service_role submits a pack lead'
);

select lives_ok(
  $$select public.submit_lead(
    p_source => 'form', p_via => 'freelance', p_full_name => 'Prueba Freelance', p_email => 'free@example.com',
    p_wanted_by => current_date + 30, p_consent => true, p_ip_hash => md5('ip-free')
  )$$,
  'service_role submits a freelance lead'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba Cuota', p_email => ('q' || g || '@example.com')::citext, p_consent => true, p_ip_hash => md5('ip-quota'))
    from generate_series(1, 5) g$$,
  'five submissions from the same ip pass'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba Cuota', p_email => 'q6@example.com', p_consent => true, p_ip_hash => md5('ip-quota'))$$,
  'P0001',
  'form_quota_exceeded',
  'sixth submission from the same ip is rejected'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba Otra IP', p_email => 'o@example.com', p_consent => true, p_ip_hash => md5('ip-other'))$$,
  'another ip is not affected'
);

reset role;
update private.form_quota set day = day - 1 where ip_hash = md5('ip-quota');
reset role;
select tests.login_service();

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Prueba Cuota', p_email => 'q7@example.com', p_consent => true, p_ip_hash => md5('ip-quota'))$$,
  'the next day the same ip passes again'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Sin consentimiento', p_email => 'n@example.com', p_consent => false, p_ip_hash => md5('ip-noconsent'))$$,
  'P0001',
  'consent_required',
  'consent is required'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'nexo', p_full_name => 'Otra fuente', p_email => 'n@example.com', p_consent => true, p_ip_hash => md5('ip-source'))$$,
  'P0001',
  'invalid_source',
  'only the form source is accepted'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'X', p_email => 'x@example.com', p_has_domain => true, p_consent => true, p_ip_hash => md5('ip-v1'))$$,
  '23514',
  null,
  'pack fields are rejected on a hiring lead'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'X', p_email => 'x@example.com', p_message => repeat('x', 4001), p_consent => true, p_ip_hash => md5('ip-v2'))$$,
  '23514',
  null,
  'message longer than 4000 characters is rejected'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'X', p_phone => '600000000', p_consent => true, p_ip_hash => md5('ip-v3'))$$,
  '23514',
  null,
  'a form lead requires an email'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'X', p_email => 'x@example.com', p_offer_url => 'javascript:alert(1)', p_consent => true, p_ip_hash => md5('ip-v4'))$$,
  '23514',
  null,
  'offer_url must be http or https'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'X', p_email => 'not-an-email', p_consent => true, p_ip_hash => md5('ip-v5'))$$,
  '23514',
  null,
  'email must contain an at sign'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_pack_id => gen_random_uuid(), p_full_name => 'X', p_email => 'x@example.com', p_consent => true, p_ip_hash => md5('ip-v6'))$$,
  '23514',
  null,
  'pack_id requires the pack via'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Mismo correo', p_email => 'Same@Example.com', p_consent => true, p_ip_hash => md5('ip-mail-' || g))
    from generate_series(1, 3) g$$,
  'three submissions with the same email pass'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Mismo correo', p_email => 'same@example.com', p_consent => true, p_ip_hash => md5('ip-mail-4'))$$,
  'P0001',
  'form_email_quota_exceeded',
  'fourth submission with the same email is rejected regardless of case or ip'
);

reset role;
insert into private.form_quota (ip_hash, day, count) values ('__global__', (now() at time zone 'utc')::date, 200)
on conflict (ip_hash, day) do update set count = 200;
select tests.login_service();

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Global', p_email => 'global@example.com', p_consent => true, p_ip_hash => md5('ip-global'))$$,
  'P0001',
  'form_global_quota_exceeded',
  'global daily cap rejects submissions after 200'
);

reset role;
update private.form_quota set day = day - 1 where ip_hash = '__global__';
select tests.login_service();

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Global', p_email => 'global2@example.com', p_consent => true, p_ip_hash => md5('ip-global'))$$,
  'global cap resets the next day'
);

select throws_ok(
  $$select private.submit_lead(p_source => 'form', p_full_name => 'X', p_email => 'x@example.com', p_consent => true, p_ip_hash => md5('ip-direct'))$$,
  '42501',
  null,
  'service_role cannot reach private.submit_lead directly'
);

reset role;

select is(
  (select count(*) from private.form_quota where ip_hash = md5('ip-noconsent')),
  0::bigint,
  'a rejected consent does not consume quota'
);

select results_eq(
  $$select source::text, status::text, (consent_at is not null), locale::text, via::text from public.leads where email = 'uno@example.com'$$,
  $$values ('form', 'new', true, 'es', 'hiring')$$,
  'submitted lead is stored as new with consent'
);

reset role;
select set_config('tests.leads_total', (select count(*)::text from public.leads), true);
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.leads),
  current_setting('tests.leads_total')::bigint,
  'admin sees every lead'
);

select lives_ok(
  $$insert into public.leads (source, full_name, phone) values ('manual', 'Prueba Manual', '600000002')$$,
  'admin inserts a manual lead without consent'
);

select throws_ok(
  $$insert into public.leads (source, full_name, email) values ('form', 'Sin consentimiento', 'c@example.com')$$,
  '23514',
  null,
  'a form lead needs consent_at'
);

select throws_ok($$update public.leads set message = 'x'$$, '42501', null, 'leads are not updatable from the client');
select throws_ok($$delete from public.leads$$, '42501', null, 'nobody deletes leads');

reset role;
select tests.login_as('t-closer@example.com');

select is((select count(*) from public.leads), 0::bigint, 'closer sees no leads until M04 policies');

reset role;
select tests.login_as('t-freelance@example.com');

select is((select count(*) from public.leads), 0::bigint, 'freelance sees no leads');

reset role;
select tests.login_as('t-client@example.com');

select is((select count(*) from public.leads), 0::bigint, 'client sees no leads');

reset role;
update public.leads set updated_at = '2000-01-01' where email = 'uno@example.com';
update public.leads set message = 'Editado' where email = 'uno@example.com';

select is(
  (select updated_at from public.leads where email = 'uno@example.com'),
  now(),
  'updated_at is refreshed by the trigger'
);

select * from finish();

rollback;
