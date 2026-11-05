insert into public.invitations (id, email, role, parent_closer_id, closer_rate, parent_rate, closer_recurring_rate, parent_recurring_rate, payout_cadence, token_hash, invited_by, note, expires_at)
values
  ('50000000-0000-4000-8000-000000000001', 'invitada-closer@example.com', 'closer', '10000000-0000-4000-8000-000000000002', 10, 5, 5, 2, 'biweekly', encode(sha256('seed-token-pending'::bytea), 'hex'), '10000000-0000-4000-8000-000000000001', 'Prueba: invitacion pendiente', now() + interval '5 days'),
  ('50000000-0000-4000-8000-000000000002', 'invitado-freelance@example.com', 'freelance', null, null, null, null, null, null, encode(sha256('seed-token-expired'::bytea), 'hex'), '10000000-0000-4000-8000-000000000001', null, now() - interval '2 days');

insert into public.invitations (id, email, role, token_hash, invited_by, revoked_at)
values
  ('50000000-0000-4000-8000-000000000003', 'invitado-anulado@example.com', 'client', encode(sha256('seed-token-revoked'::bytea), 'hex'), '10000000-0000-4000-8000-000000000001', now() - interval '1 day');
