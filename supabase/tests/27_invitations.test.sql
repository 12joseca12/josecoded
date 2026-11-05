begin;

\ir support/helpers.sql

select plan(43);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-client@example.com', 'client', 'Client');

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  (md5('new-closer@example.com')::uuid, 'authenticated', 'authenticated', 'new-closer@example.com', now(), now(), now()),
  (md5('new-sub@example.com')::uuid, 'authenticated', 'authenticated', 'new-sub@example.com', now(), now(), now()),
  (md5('other@example.com')::uuid, 'authenticated', 'authenticated', 'other@example.com', now(), now(), now()),
  (md5('late@example.com')::uuid, 'authenticated', 'authenticated', 'late@example.com', now(), now(), now());

create temp table tokens (label text primary key, id uuid, token text);
grant all on tokens to authenticated, service_role;

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select * from public.invite_user('x@example.com', 'freelance')$$,
  '42501',
  'forbidden',
  'a closer cannot invite'
);

select is((select count(*) from public.invitations), 0::bigint, 'a closer reads no invitations');

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select * from public.invite_user('x@example.com', 'freelance')$$,
  '42501',
  'forbidden',
  'an admin without aal2 cannot invite'
);

reset role;
select tests.login_as('t-admin@example.com');

insert into tokens
select 'closer', r.invitation_id, r.token
from public.invite_user(
  'New-Closer@Example.com', 'closer', null, 10, null, 5, null, 'biweekly', null, 'Primera', md5('new-closer@example.com')::uuid
) r;

select is((select length(token) from tokens where label = 'closer'), 64, 'the token has 64 hex characters');

select is(
  (select count(*) from public.invitations where token_hash = (select token from tokens where label = 'closer')),
  0::bigint,
  'the token itself is never stored'
);

select is(
  (select i.token_hash = encode(sha256(convert_to((select token from tokens where label = 'closer'), 'UTF8')), 'hex') from public.invitations i),
  true,
  'the stored value is the sha256 of the token'
);

select is(
  (select row(email::text, role::text, closer_rate, closer_recurring_rate, payout_cadence::text)::text from public.invitations),
  '(new-closer@example.com,closer,10.00,5.00,biweekly)',
  'the invitation keeps role, rates and cadence'
);

reset role;

select is(
  (select count(*) from private.outbox where template = 'invitation' and recipient = 'new-closer@example.com'),
  1::bigint,
  'inviting queues one invitation email'
);

select is(
  (select payload ->> 'path' = '/invitacion/' || (select token from tokens where label = 'closer') from private.outbox where template = 'invitation'),
  true,
  'the email payload carries the invitation path'
);

select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select * from public.invite_user('new-closer@example.com', 'closer')$$,
  'P0001',
  'email_already_invited',
  'a second open invitation for the same email fails'
);

select throws_ok(
  $$select * from public.invite_user('t-closer-a@example.com', 'closer')$$,
  'P0001',
  'email_already_member',
  'inviting an existing member fails'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', null, 10, null, 10)$$,
  'P0001',
  'rates_recurring_not_lower',
  'a recurring rate equal to the project rate fails'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', null, 10, null, 12)$$,
  'P0001',
  'rates_recurring_not_lower',
  'a recurring rate above the project rate fails'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', null, 120)$$,
  'P0001',
  'rate_out_of_range',
  'a rate above 100 fails'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'freelance', null, 10)$$,
  'P0001',
  'rates_only_for_closers',
  'rates on a freelance invitation fail'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'admin')$$,
  'P0001',
  'invalid_role',
  'nobody is invited as admin'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', md5('t-sub-a@example.com')::uuid, 10, 5)$$,
  'P0001',
  'invalid_parent_closer',
  'a subcloser cannot be a parent'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', null, 10, 5)$$,
  'P0001',
  'parent_rate_needs_parent',
  'a parent rate without a parent fails'
);

select throws_ok(
  $$select * from public.invite_user('rates@example.com', 'closer', null, null, null, null, null, null, null, null, md5('other@example.com')::uuid)$$,
  'P0001',
  'auth_user_mismatch',
  'an auth user with another email fails'
);

insert into tokens
select 'sub', r.invitation_id, r.token
from public.invite_user(
  'new-sub@example.com', 'closer', md5('t-closer-a@example.com')::uuid, 10, 5, 4, 2, null, null, null, md5('new-sub@example.com')::uuid
) r;

select is((select count(*) from public.invitations), 2::bigint, 'the admin lists both invitations');

reset role;
select tests.login_service();

select is(
  (select r.status from public.read_invitation((select token from tokens where label = 'closer')) r),
  'pending',
  'read_invitation reports a pending invitation'
);

select is(
  (select count(*) from public.read_invitation('not-a-token')),
  0::bigint,
  'read_invitation returns nothing for an unknown token'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select * from public.read_invitation('x')$$,
  '42501',
  null,
  'authenticated cannot call read_invitation'
);

reset role;
select tests.login_as('other@example.com');

select throws_ok(
  format($$select public.accept_invitation(%L, 'Intruder')$$, (select token from tokens where label = 'closer')),
  'P0001',
  'invitation_email_mismatch',
  'a different email cannot accept the invitation'
);

select throws_ok(
  $$select public.accept_invitation('nope', 'Intruder')$$,
  'P0001',
  'invitation_not_found',
  'an unknown token cannot be accepted'
);

reset role;
select tests.login_as('new-closer@example.com', 'aal1');

select is(
  public.accept_invitation((select token from tokens where label = 'closer'), '  New Closer  ', 'en'),
  'closer'::public.user_role,
  'the invited email accepts at aal1 and gets its role'
);

reset role;

select is(
  (select row(role::text, full_name, locale::text, closer_rate, closer_recurring_rate, payout_cadence::text, invited_by = md5('t-admin@example.com')::uuid)::text from public.profiles where id = md5('new-closer@example.com')::uuid),
  '(closer,"New Closer",en,10.00,5.00,biweekly,t)',
  'accept_invitation creates the profile with the invited rates'
);

select is(
  (select count(*) from public.invitations where accepted_at is not null),
  1::bigint,
  'the invitation is marked as accepted'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'invitation_accepted'),
  1::bigint,
  'the admin is notified of the acceptance'
);

select tests.login_as('new-closer@example.com', 'aal1');

select throws_ok(
  format($$select public.accept_invitation(%L, 'Again')$$, (select token from tokens where label = 'closer')),
  'P0001',
  'invitation_used',
  'an accepted invitation cannot be used twice'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  format($$select public.renew_invitation(%L)$$, (select id from tokens where label = 'closer')),
  'P0001',
  'invitation_used',
  'an accepted invitation cannot be renewed'
);

select throws_ok(
  format($$select public.revoke_invitation(%L)$$, (select id from tokens where label = 'closer')),
  'P0001',
  'invitation_used',
  'an accepted invitation cannot be revoked'
);

select lives_ok(
  format($$select public.revoke_invitation(%L)$$, (select id from tokens where label = 'sub')),
  'the admin revokes a pending invitation'
);

reset role;
select tests.login_as('new-sub@example.com', 'aal1');

select throws_ok(
  format($$select public.accept_invitation(%L, 'Sub')$$, (select token from tokens where label = 'sub')),
  'P0001',
  'invitation_revoked',
  'a revoked invitation cannot be accepted'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  format($$select public.renew_invitation(%L)$$, (select id from tokens where label = 'sub')),
  'P0001',
  'invitation_revoked',
  'a revoked invitation cannot be renewed'
);

insert into tokens
select 'late', r.invitation_id, r.token
from public.invite_user('late@example.com', 'freelance', null, null, null, null, null, null, null, null, md5('late@example.com')::uuid) r;

reset role;
update public.invitations set expires_at = now() - interval '1 minute' where email = 'late@example.com';
select tests.login_as('late@example.com', 'aal1');

select throws_ok(
  format($$select public.accept_invitation(%L, 'Late')$$, (select token from tokens where label = 'late')),
  'P0001',
  'invitation_expired',
  'an expired invitation cannot be accepted'
);

reset role;
select tests.login_as('t-admin@example.com');

create temp table renewed (id uuid, token text);
grant all on renewed to authenticated;
insert into renewed select * from public.renew_invitation((select id from tokens where label = 'late'));

select isnt(
  (select token from renewed),
  (select token from tokens where label = 'late'),
  'renewing issues a new token'
);

reset role;
select tests.login_as('late@example.com', 'aal1');

select throws_ok(
  format($$select public.accept_invitation(%L, 'Late')$$, (select token from tokens where label = 'late')),
  'P0001',
  'invitation_not_found',
  'the old token stops working after a renewal'
);

select is(
  public.accept_invitation((select token from renewed), 'Late', 'es'),
  'freelance'::public.user_role,
  'the renewed token is accepted'
);

reset role;
select tests.login_as('t-admin@example.com');

insert into tokens
select 'again', r.invitation_id, r.token
from public.invite_user('again@example.com', 'client') r;

reset role;
update public.invitations set expires_at = now() - interval '1 second' where email = 'again@example.com';
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select * from public.invite_user('again@example.com', 'client')$$,
  'an expired open invitation is superseded by a new one'
);

select is(
  (select count(*) from public.invitations where email = 'again@example.com' and revoked_at is not null),
  1::bigint,
  'the superseded invitation is revoked'
);

reset role;

select throws_ok(
  $$update public.profiles set closer_recurring_rate = 10 where id = md5('t-closer-a@example.com')::uuid$$,
  '23514',
  null,
  'profiles reject a recurring rate that is not below the project rate'
);

select throws_ok(
  $$update public.profiles set payout_cadence = 'weekly' where id = md5('t-client@example.com')::uuid$$,
  '23514',
  null,
  'profiles reject a payout cadence on a non-closer'
);

select * from finish();

rollback;
