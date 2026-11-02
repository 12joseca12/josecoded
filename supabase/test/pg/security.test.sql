-- Regression tests of the 1.8e security review (exploits found by the review, now expected to FAIL): inbound leads never
-- land in a closer's portfolio, leads / quotes / interactions / drafts written by a closer, client invitations bound to the
-- contact email, Telegram codes, hidden catalogue items and site content. Runs after the other files on the same throwaway
-- database (closers.test.sql defines the fixtures: carla a5 with contacts 210/211, lead 311 open, client 410; dani a6
-- switched off; ana a2 client 401 of pack P2; bob a3 without client). Every block runs in its own transaction and rolls back.
\o /dev/null
\set jose '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal2","email":"jose@test"}'
\set jose1 '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal1","email":"jose@test"}'
\set ana '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated","aal":"aal1","email":"ana@test"}'
\set bob '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated","aal":"aal1","email":"bob@test"}'
\set carla '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated","aal":"aal2","email":"carla@test"}'
\set carla1 '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated","aal":"aal1","email":"carla@test"}'
\set dani '{"sub":"00000000-0000-4000-8000-0000000000a6","role":"authenticated","aal":"aal2","email":"dani@test"}'
\set service '{"role":"service_role"}'

create schema if not exists t;
grant usage on schema t to anon, authenticated, service_role;
create or replace function t.ok(c boolean, what text) returns void language plpgsql as $$
begin
  if c is not true then raise exception 'FAIL %', what; end if;
  raise notice 'PASS %', what;
end $$;
create or replace function t.n(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  return n;
end $$;
create or replace function t.err(q text) returns text language plpgsql as $$
begin
  execute q;
  return null;
exception when others then
  return sqlstate || ' ' || sqlerrm;
end $$;
create or replace function t.affected(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;
create or replace function t.val(q text) returns text language plpgsql as $$
declare v text;
begin
  execute q into v;
  return v;
end $$;
create or replace function t.snapshot() returns jsonb language plpgsql as $$
declare r jsonb;
begin
  select public.pricing_catalog_snapshot() into r;  -- own statement: sees what earlier calls of the same query wrote
  return r;
end $$;
grant execute on all functions in schema t to anon, authenticated, service_role;

\o

-- ================================================================ A1: web leads never land in a closer's portfolio
-- (the original exploit: carla creates a contact with a victim's email, then the inbound form attaches to it)
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
insert into public.crm_contacts (kind, status, display_name, email, source, owner_id)
values ('lead', 'new', 'x', 'victima@empresa.test', 'manual', '00000000-0000-4000-8000-0000000000a5');
reset role;
set local role service_role;
set local request.jwt.claims = :'service';
create temp table r1 as
  select * from public.create_lead('{"source":"web_form","email":"victima@empresa.test","message":"secreto","pack_code":"P1","idempotency_key":"sec:1"}'::jsonb);
grant select on r1 to public;
reset role;
select t.ok((select c.owner_id is null and c.id <> (select id from public.crm_contacts where email = 'victima@empresa.test' and owner_id is not null)
               from r1 join public.crm_contacts c on c.id = r1.contact_id),
            'A1 inbound lead lands in a new contact of Jose, not in the closer''s contact with the same email');
select t.ok((select count(*) from private.outbox where event = 'lead.owner_collision'
              and payload ->> 'lead_id' = (select lead_id::text from r1)
              and payload ->> 'existing_owner_id' = '00000000-0000-4000-8000-0000000000a5') = 1
            and (select count(*) from public.crm_interactions where contact_id = (select contact_id from r1) and kind = 'note' and actor = 'system') = 1,
            'A1 the collision is queued for Jose (lead.owner_collision) and noted in the timeline of the new contact');
select t.ok((select payload ? 'owner_id' and payload -> 'owner_id' = 'null'::jsonb from private.outbox
              where event = 'lead.created' and payload ->> 'id' = (select lead_id::text from r1)),
            'A1 lead.created carries owner_id (null: the contact is Jose''s)');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n($$select 1 from public.leads where message = 'secreto'$$) = 0
            and t.n($$select 1 from public.crm_contacts where id = (select contact_id from r1)$$) = 0,
            'A1 the closer reads neither the inbound message nor the new contact');
rollback;

-- A1: the same email twice goes to the same contact of Jose; a contact of Jose with the email is reused without a collision
begin;
set local role service_role;
set local request.jwt.claims = :'service';
create temp table r2 as select * from public.create_lead('{"source":"web_form","email":"nueva@empresa.test","pack_code":"P1"}'::jsonb);
create temp table r3 as select * from public.create_lead('{"source":"web_form","email":"nueva@empresa.test","pack_code":"P1"}'::jsonb);
reset role;
select t.ok((select contact_id from r2) = (select contact_id from r3) and (select lead_id from r2) <> (select lead_id from r3)
            and (select count(*) from private.outbox where event = 'lead.owner_collision') = 0,
            'A1 two inbound leads with the same email share one contact of Jose and raise no collision');
insert into public.crm_contacts (id, kind, status, display_name, email, source)
values ('00000000-0000-4000-8000-000000000a11', 'lead', 'new', 'De Jose', 'dejose@empresa.test', 'manual');
insert into public.crm_contacts (kind, status, display_name, email, source, owner_id)
values ('lead', 'new', 'Del closer', 'dejose@empresa.test', 'manual', '00000000-0000-4000-8000-0000000000a5');
set local role service_role;
set local request.jwt.claims = :'service';
create temp table r5 as select * from public.create_lead('{"source":"web_form","email":"dejose@empresa.test"}'::jsonb);
reset role;
select t.ok((select contact_id from r5) = '00000000-0000-4000-8000-000000000a11'
            and (select count(*) from private.outbox where event = 'lead.owner_collision') = 0,
            'A1 an existing contact of Jose is reused even when a closer has the same email');
rollback;

-- A1: a signed-in user's id is never linked to a closer's contact (the portal would open to the wrong account)
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
insert into public.crm_contacts (id, kind, status, display_name, email, source, owner_id)
values ('00000000-0000-4000-8000-000000000a12', 'lead', 'new', 'x', 'ana@test', 'manual', '00000000-0000-4000-8000-0000000000a5');
reset role;
set local role service_role;
set local request.jwt.claims = :'service';
create temp table r4 as
  select * from public.create_lead('{"source":"web_form","email":"ana@test","user_id":"00000000-0000-4000-8000-0000000000a2"}'::jsonb);
reset role;
select t.ok((select user_id from public.crm_contacts where id = '00000000-0000-4000-8000-000000000a12') is null
            and (select contact_id from r4) <> '00000000-0000-4000-8000-000000000a12',
            'A1 the user_id of a lead is never attached to a closer-owned contact');
rollback;

-- A1: commission only for the lead the owner closer opened, or when Jose asks for it
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table own_lead as
  with ins as (insert into public.leads (contact_id, source, pack_code) values ('00000000-0000-4000-8000-000000000211', 'manual', 'P1') returning id, created_by)
  select * from ins;
grant select on own_lead to public;
select t.ok((select created_by from own_lead) = '00000000-0000-4000-8000-0000000000a5',
            'A1 a lead inserted by a closer is stamped created_by = the closer');
set local request.jwt.claims = :'jose';
select t.ok(t.err(format($q$select public.admin_close_lead_paid(%L, 500, now(), false)$q$, (select id from own_lead))) is null
            and t.n(format($q$select 1 from public.closer_commissions where lead_id = %L and amount = 50$q$, (select id from own_lead))) = 1,
            'A1 closing a lead the closer opened creates his commission without asking (10 % of 500)');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000311', 1000, now(), false)$q$) is null
            and t.n($q$select 1 from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'$q$) = 0,
            'A1 closing a web lead (created_by null) on a closer''s contact creates no commission by default');
rollback;
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000311', 1000, now(), false, p_commission => true)$q$) is null
            and t.val($q$select amount::text from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'$q$) = '100.00',
            'A1 p_commission => true creates the commission of a web lead (10 % of 1000)');
rollback;
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table own_lead2 as
  with ins as (insert into public.leads (contact_id, source, pack_code) values ('00000000-0000-4000-8000-000000000211', 'manual', 'P1') returning id)
  select * from ins;
grant select on own_lead2 to public;
set local request.jwt.claims = :'jose';
select t.ok(t.err(format($q$select public.admin_close_lead_paid(%L, 500, now(), false, p_commission => false)$q$, (select id from own_lead2))) is null
            and t.n(format($q$select 1 from public.closer_commissions where lead_id = %L$q$, (select id from own_lead2))) = 0,
            'A1 p_commission => false skips the commission even for the closer''s own lead');
rollback;

-- A1: daily quota of contacts created by a closer (insert and CSV import)
begin;
insert into private.quota_counters (key, count, expires_at)
values ('closer_contacts:00000000-0000-4000-8000-0000000000a5', 500, now() + interval '1 day')
on conflict (key) do update set count = 500, expires_at = now() + interval '1 day';
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$insert into public.crm_contacts (kind, status, display_name, email, source, owner_id) values ('lead','new','q','q1@q.test','manual','00000000-0000-4000-8000-0000000000a5')$q$) like '54000 %'
            and t.err($q$select public.crm_import_contacts_csv('[{"display_name":"Q","email":"q2@q.test"}]'::jsonb, 'q.csv', 'quota-1')$q$) like '54000 %',
            'A1 a closer over the daily quota cannot create contacts, by insert or by CSV');
set local request.jwt.claims = :'dani';
select t.ok(t.err($q$select private.closer_contact_quota_hit()$q$) is null, 'A1 the quota counts the caller only (dani is not affected by carla''s counter)');
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$insert into public.crm_contacts (kind, status, display_name, email, source) values ('lead','new','q','q3@q.test','manual')$q$) is null,
            'A1 the admin is exempt from the contact quota');
rollback;

-- ================================================================ M1: leads written by a closer
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table forged as
  with ins as (
    insert into public.leads (contact_id, status, source, amount, paid_at, user_id, affiliate_code, idempotency_key)
    values ('00000000-0000-4000-8000-000000000211', 'won', 'manual', 99999, now(), '00000000-0000-4000-8000-0000000000a2', 'nope', 'forged:1')
    returning id, status, amount, paid_at, user_id, affiliate_code, idempotency_key)
  select * from ins;
select t.ok((select status = 'open' and amount is null and paid_at is null and user_id is null and affiliate_code is null and idempotency_key is null from forged),
            'M1 a lead inserted by a closer is always open, without amount, paid_at, user_id, affiliate or idempotency key');
select t.ok(t.err($$update public.leads set status = 'open' where idempotency_key = 'seed:carla-won'$$) like '42501 %'
            and t.err($$update public.leads set status = 'lost' where idempotency_key = 'seed:carla-won'$$) like '42501 %',
            'M1 a closer cannot reopen or change a won lead');
select t.ok(t.err(format($q$update public.leads set status = 'lost' where id = %L$q$, (select id from forged))) is null
            and t.err(format($q$update public.leads set status = 'open' where id = %L$q$, (select id from forged))) like '42501 %',
            'M1 a closer can mark his open lead lost but never reopen it');
select t.ok(t.err(format($q$update public.leads set created_by = null where id = %L$q$, (select id from forged))) is null
            and (select created_by from public.leads where id = (select id from forged)) = '00000000-0000-4000-8000-0000000000a5',
            'M1 created_by does not change by update');
rollback;

-- ================================================================ M2: the quote state machine is the RPCs'
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table q1 as select public.quote_create('00000000-0000-4000-8000-000000000211', 'Presupuesto', null) as id;
grant select on q1 to public;
select t.ok(t.err(format($q$update public.custom_quotes set status = 'accepted' where id = %L$q$, (select id from q1))) like '42501 %'
            and t.err(format($q$update public.custom_quotes set status = 'draft' where id = %L$q$, (select id from q1))) like '42501 %'
            and t.err(format($q$update public.custom_quotes set lead_id = '00000000-0000-4000-8000-000000000301' where id = %L$q$, (select id from q1))) like '42501 %',
            'M2 a closer cannot set status or lead_id of a quote by UPDATE');
select t.ok(t.err($q$insert into public.custom_quotes (contact_id, title, status) values ('00000000-0000-4000-8000-000000000211', 'x', 'accepted')$q$) like '42501 %'
            and t.err($q$insert into public.custom_quotes (contact_id, title, lead_id) values ('00000000-0000-4000-8000-000000000211', 'x', '00000000-0000-4000-8000-000000000301')$q$) like '42501 %',
            'M2 a closer cannot insert a quote with status or a lead of another contact');
select t.ok(t.err(format($q$update public.custom_quotes set title = 'Nuevo titulo' where id = %L$q$, (select id from q1))) is null
            and t.err(format($q$select public.quote_add_item(%L, 'seo_basic', 1)$q$, (select id from q1))) is null
            and t.err(format($q$select public.quote_mark_sent(%L)$q$, (select id from q1))) is null
            and t.val(format($q$select status::text from public.custom_quotes where id = %L$q$, (select id from q1))) = 'sent',
            'M2 title edits and the RPC transitions (add item, mark sent) still work for the closer');
select t.ok(t.val(format($q$select actor::text from public.crm_interactions where payload ->> 'quote_id' = %L and kind = 'message_sent'$q$, (select id from q1))) = 'closer',
            'M2 the quote events a closer causes are signed «closer»');
set local request.jwt.claims = :'jose';
select t.ok(t.err(format($q$select public.quote_decide(%L, 'accepted')$q$, (select id from q1))) is null
            and t.val(format($q$select status::text from public.custom_quotes where id = %L$q$, (select id from q1))) = 'accepted',
            'M2 the admin decides the quote through quote_decide');
rollback;
-- defence in depth: even with a status grant the trigger refuses the change from the API role
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
create temp table q2 as select public.quote_create('00000000-0000-4000-8000-000000000211', 'T', null) as id;
reset role;
grant update (status) on public.custom_quotes to authenticated;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err(format($q$update public.custom_quotes set status = 'accepted' where id = %L$q$, (select id from q2))) like '42501 %',
            'M2 the status guard trigger refuses a status change by authenticated even with a column grant');
rollback;

-- ================================================================ M3: client invitations are bound to the contact email
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'carla-alt@evil.test')$q$) = '42501 email_must_match_contact'
            and t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'carla@test')$q$) = '42501 email_must_match_contact',
            'M3 a closer cannot invite an address other than the contact''s (not his own, not a staff one)');
select t.ok(t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', null)$q$) is null,
            'M3 a closer invites his client without typing an address');
reset role;
select t.ok((select payload ->> 'email' from private.outbox where event = 'client.invited' order by id desc limit 1) = 'cliente-carla@example.test',
            'M3 without an address the invitation goes to the email of the contact');
rollback;
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'carla@test')$q$) = '22023 email_is_staff'
            and t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'jose@test')$q$) = '22023 email_is_staff',
            'M3 not even the admin invites an address that belongs to a staff member');
select t.ok(t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'otra-direccion@example.test')$q$) is null,
            'M3 the admin can invite a different address (a client who changed his email)');
reset role;
select t.ok((select invite_email::text from public.clients where id = '00000000-0000-4000-8000-000000000410') = 'otra-direccion@example.test',
            'M3 the different address is the one stored for the invitation');
rollback;

-- ================================================================ B1: a closer cannot create a contact already won
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$insert into public.crm_contacts (kind,status,display_name,email,source,owner_id) values ('lead','won','y','y@y.test','manual','00000000-0000-4000-8000-0000000000a5')$q$) like '42501 %'
            and t.err($q$insert into public.crm_contacts (kind,status,display_name,email,source,owner_id) values ('client','active_client','y','y2@y.test','manual','00000000-0000-4000-8000-0000000000a5')$q$) like '42501 %'
            and t.err($q$insert into public.crm_contacts (kind,status,display_name,email,source,owner_id) values ('lead','new','y','y3@y.test','manual','00000000-0000-4000-8000-0000000000a5')$q$) is null,
            'B1 a closer cannot insert a contact as won or active_client (a new one is fine)');
rollback;

-- ================================================================ B2: interactions and drafts of a closer are his own
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, direction, actor, body) values ('00000000-0000-4000-8000-000000000211','lead_won','internal','jose','fake')$q$) like '42501 %'
            and t.err($q$insert into public.crm_interactions (contact_id, kind, direction, actor) values ('00000000-0000-4000-8000-000000000211','commission','internal','system')$q$) like '42501 %',
            'B2 a closer cannot log lead_won, commission or other bookkeeping kinds');
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, direction, actor, body) values ('00000000-0000-4000-8000-000000000211','note','internal','jose','nota')$q$) is null
            and t.val($q$select actor::text from public.crm_interactions where body = 'nota'$q$) = 'closer',
            'B2 an interaction a closer writes is signed «closer» whatever actor he sends');
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id) values ('00000000-0000-4000-8000-000000000211','note','internal','jose','00000000-0000-4000-8000-000000000310')$q$) = '22023 lead_not_of_contact',
            'B2 the lead of an interaction must belong to the same contact');
create temp table d1 as
  with ins as (insert into public.crm_message_drafts (contact_id, channel, body, generated_by) values ('00000000-0000-4000-8000-000000000211','email','hola','ai') returning id, generated_by)
  select * from ins;
select t.ok((select generated_by::text from d1) = 'closer'
            and t.err(format($q$insert into public.crm_interactions (contact_id, kind, direction, actor, draft_id) values ('00000000-0000-4000-8000-000000000211','message_sent','out','jose',%L)$q$, (select id from d1))) is null,
            'B2 a draft written by a closer is his (generated_by closer) and can be linked to an interaction of its contact');
reset role;
insert into public.crm_message_drafts (id, contact_id, channel, body, generated_by)
values ('00000000-0000-4000-8000-000000000a21', '00000000-0000-4000-8000-000000000212', 'email', 'otro', 'jose');
insert into public.crm_interactions (id, contact_id, kind, direction, actor, body)
values ('00000000-0000-4000-8000-000000000a22', '00000000-0000-4000-8000-000000000211', 'note', 'internal', 'system', 'del sistema');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, direction, actor, draft_id) values ('00000000-0000-4000-8000-000000000211','note','internal','jose','00000000-0000-4000-8000-000000000a21')$q$) = '22023 draft_not_of_contact',
            'B2 the draft of an interaction must belong to the same contact');
select t.ok(t.err($q$update public.crm_interactions set body = 'reescrito' where id = '00000000-0000-4000-8000-000000000a22'$q$) like '42501 %',
            'B2 a closer cannot rewrite an interaction of the system');
select t.ok(t.err($q$select public.crm_request_close('00000000-0000-4000-8000-000000000311')$q$) is null
            and t.val($q$select actor::text from public.crm_interactions where body = 'cierre solicitado'$q$) = 'closer',
            'B2 crm_request_close logs the closer, not Jose');
rollback;

-- ================================================================ B3: Telegram codes come from staff_telegram_begin only
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$insert into public.staff_telegram_codes values ('00000000-0000-4000-8000-0000000000a5','AAAAAAAA','2099-01-01')$q$) like '42501 %',
            'B3 a closer cannot insert a Telegram code (no insert grant)');
set local request.jwt.claims = :'dani';
select t.ok(t.err($q$insert into public.staff_telegram_codes values ('00000000-0000-4000-8000-0000000000a6','BBBBBBBB','2099-01-01')$q$) like '42501 %',
            'B3 a switched-off closer cannot insert a Telegram code either');
set local request.jwt.claims = :'carla';
select t.ok(length(public.staff_telegram_begin()) = 8, 'B3 staff_telegram_begin still issues the code');
reset role;
select t.ok(t.err($q$insert into public.staff_telegram_codes values ('00000000-0000-4000-8000-0000000000a6','CCCCCCCC', now() + interval '1 day')$q$) like '22023 %'
            and t.err($q$update public.staff_telegram_codes set expires_at = now() + interval '2 days' where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) like '22023 %'
            and t.err($q$insert into public.staff_telegram_codes values ('00000000-0000-4000-8000-0000000000a6','DDDDDDDD', now() + interval '10 minutes')$q$) is null,
            'B3 a code never lives more than 15 minutes (trigger, for any writer)');
rollback;

-- ================================================================ B4: hidden catalogue items are for staff and their buyers
begin;
select t.ok(t.val($q$select count(*) from public.packs where not visible$q$) = '1', 'B4 fixture: one hidden pack exists');
update public.extras set visible = false where code = 'seo_basic';
insert into public.pack_options (pack_code, code, price, pricing_version, visible) values ('P2', 'pro', 1, 'x', false);
update public.clients set pack_option = 'pro' where id = '00000000-0000-4000-8000-000000000401';
update public.packs set visible = false where code = 'P2';
set local role authenticated;
set local request.jwt.claims = :'bob';
select t.ok(t.n($$select 1 from public.packs where not visible$$) = 0 and t.n($$select 1 from public.packs where code = 'P2'$$) = 0
            and t.n($$select 1 from public.extras where code = 'seo_basic'$$) = 0 and t.n($$select 1 from public.pack_options where code = 'pro'$$) = 0,
            'B4 a user without that pack reads no hidden pack, option or extra');
set local request.jwt.claims = :'ana';
select t.ok(t.n($$select 1 from public.packs where code = 'P2'$$) = 1 and t.n($$select 1 from public.extras where code = 'seo_basic'$$) = 1
            and t.n($$select 1 from public.pack_options where code = 'pro'$$) = 1,
            'B4 the client keeps reading her own hidden pack, option and extra');
set local request.jwt.claims = :'carla';
select t.ok(t.n($$select 1 from public.packs where code = 'P2'$$) = 1 and t.n($$select 1 from public.extras where code = 'seo_basic'$$) = 1
            and t.n($$select 1 from public.pack_options where code = 'pro'$$) = 1,
            'B4 staff read the hidden catalogue');
set local request.jwt.claims = :'dani';
select t.ok(t.n($$select 1 from public.packs where code = 'P2'$$) = 0, 'B4 a switched-off closer reads no hidden item');
rollback;

-- ================================================================ B5: site content
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.content_save_draft('blog_post', 'Bad Key!', 'es', '{"title":"t","body_md":"b"}'::jsonb)$q$) like '23514 %'
            and t.err($q$select public.content_save_draft('blog_post', '../../etc/passwd', 'es', '{"title":"t","body_md":"b"}'::jsonb)$q$) like '23514 %'
            and t.err($q$select public.content_save_draft('blog_post', 'mi-post-1', 'es', '{"title":"t","body_md":"b"}'::jsonb)$q$) is null,
            'B5 a blog key must be a slug (no spaces, dots or slashes)');
select t.ok(t.err($q$select public.content_save_draft('faq', 'big', 'es', jsonb_build_object('question', 'q', 'answer', repeat('x', 300000)))$q$) like '23514 %'
            and t.err($q$insert into public.site_content_entries (kind, key, locale, draft) values ('faq', 'big2', 'es', jsonb_build_object('question', 'q', 'answer', repeat('x', 300000)))$q$) like '23514 %',
            'B5 a draft over 200 KB is refused, by RPC and by direct insert');
select t.ok(t.err($q$insert into public.site_content_entries (kind, key, locale, draft, published) values ('faq', 'direct', 'es', '{"question":"q","answer":"a"}'::jsonb, '{"question":"q","answer":"a"}'::jsonb)$q$) like '42501 %'
            and t.err($q$insert into public.site_content_entries (kind, key, locale, draft) values ('faq', 'direct', 'es', '{"question":"q","answer":"a"}'::jsonb)$q$) is null,
            'B5 a direct insert cannot carry a published value (only the draft)');
select t.ok(t.err($q$update public.site_content_entries set published = '{"question":"hack","answer":"hack"}'::jsonb where key = 'direct'$q$) like '42501 %'
            and t.err($q$update public.site_content_entries set published_version = 99 where key = 'direct'$q$) like '42501 %'
            and t.err($q$update public.site_content_entries set draft = '{"question":"q2","answer":"a2"}'::jsonb where key = 'direct'$q$) is null,
            'B5 the admin cannot write published or its version directly, only the draft');
select t.ok(t.err($q$select public.content_publish()$q$) is null, 'B5 content_publish still publishes the drafts');
select t.ok((select published ->> 'question' from public.site_content_entries where key = 'direct') = 'q2'
            and (select published_version from public.site_content_entries where key = 'direct') = 1,
            'B5 content_publish is the only way to a published value');
rollback;
