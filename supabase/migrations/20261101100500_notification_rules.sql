-- Task 1.8e (plan v3.4; DATOS v1.4 §14.2, §14.4, §14.6, §14.7 migration 6). Who is told about each outbox event: rules the
-- admin edits, resolved by the gateway through notification_recipients(). The seeded rules are production
-- configuration (hence in the migration, not in the seed), and the two new scheduled jobs.

create type public.notification_recipient as enum ('admin', 'owner', 'staff_user', 'client');
create type public.notification_channel as enum ('telegram', 'email');

create table public.notification_rules (
  id                uuid primary key default gen_random_uuid(),
  event             text not null check (btrim(event) <> ''),
  recipient         public.notification_recipient not null,
  recipient_user_id uuid references public.staff_members (user_id) on delete cascade,
  channel           public.notification_channel not null,
  enabled           boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint notification_rules_user check ((recipient = 'staff_user') = (recipient_user_id is not null))
);
alter table public.notification_rules enable row level security;
create unique index uq_notification_rules on public.notification_rules
  (event, recipient, coalesce(recipient_user_id, '00000000-0000-0000-0000-000000000000'::uuid), channel);
create index idx_notification_rules_event on public.notification_rules (event) where enabled;
create index idx_notification_rules_user on public.notification_rules (recipient_user_id);
create trigger notification_rules_set_updated_at before update on public.notification_rules
  for each row execute function private.set_updated_at();
-- The admin reads and writes everything; a closer reads the rules that reach him (so he can see what he is told).
create policy notification_rules_select on public.notification_rules for select to authenticated
  using ((select private.is_admin())
         or ((select private.is_closer()) and (recipient = 'owner' or recipient_user_id = (select auth.uid()))));
create policy notification_rules_insert on public.notification_rules for insert to authenticated with check ((select private.is_admin()));
create policy notification_rules_update on public.notification_rules for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy notification_rules_delete on public.notification_rules for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.notification_rules to authenticated;

-- DATOS §14.6 plus the events that already existed (the gateway used a fixed list for them) and comment.client.
-- «client» is the addressee outside the staff (the invitee, the client of the payload): the gateway resolves the address.
insert into public.notification_rules (event, recipient, channel) values
  ('lead.created',                 'admin',  'telegram'),
  ('lead.created',                 'owner',  'telegram'),
  ('lead.close_requested',         'admin',  'telegram'),
  ('crm.import_done',              'owner',  'telegram'),
  ('crm.import_conflicts',         'admin',  'telegram'),
  ('crm.import_conflict_resolved', 'owner',  'telegram'),
  ('quote.sent',                   'admin',  'telegram'),
  ('staff.invited',                'client', 'email'),
  ('staff.claimed',                'admin',  'telegram'),
  ('client.invited',               'client', 'email'),
  ('story.proposed',               'admin',  'telegram'),
  ('story.proposed',               'owner',  'telegram'),
  ('story.decided',                'client', 'email'),
  ('commission.created',           'owner',  'telegram'),
  ('commission.created',           'admin',  'telegram'),
  ('commission.approved',          'owner',  'telegram'),
  ('commission.paid',              'owner',  'telegram'),
  ('commission.rejected',          'owner',  'telegram'),
  ('content.deployed',             'admin',  'telegram'),
  ('content.deploy_failed',        'admin',  'telegram'),
  ('comment.client',               'admin',  'telegram'),
  ('comment.client',               'owner',  'telegram'),
  ('comment.pending',              'admin',  'telegram'),
  ('asset.uploaded',               'admin',  'telegram'),
  ('upgrade.requested',            'admin',  'telegram'),
  ('chat.visitor_message',         'admin',  'telegram')
on conflict do nothing;

insert into private.scheduled_jobs (name, cron, tz) values
  ('content.poll_deploy',   '*/5 * * * *', null),
  ('telegram.poll_updates', '*/5 * * * *', null)
on conflict (name) do nothing;

-- Gateway only (service role): the channels and addresses for an event. admin = every active admin, owner = the owner of
-- the contact (p_owner_id), staff_user = the indicated person; a null address means «the gateway resolves it» (client).
-- Telegram address = telegram_chat_id (rows without one are skipped); email address = the account email.
create or replace function public.notification_recipients(p_event text, p_owner_id uuid)
returns table (channel public.notification_channel, address text)
language sql stable security definer set search_path = '' as $$
  select distinct t.channel, t.address
    from (
      select r.channel, false as external,
             case r.channel when 'telegram' then s.telegram_chat_id else u.email::text end as address
        from public.notification_rules r
        join public.staff_members s
          on s.disabled_at is null
         and ((r.recipient = 'admin' and s.role = 'admin')
              or (r.recipient = 'owner' and p_owner_id is not null and s.user_id = p_owner_id)
              or (r.recipient = 'staff_user' and s.user_id = r.recipient_user_id))
        left join auth.users u on u.id = s.user_id
       where r.event = p_event and r.enabled and r.recipient <> 'client'
      union all
      select r.channel, true, null::text
        from public.notification_rules r
       where r.event = p_event and r.enabled and r.recipient = 'client'
    ) t
   where t.external or t.address is not null
$$;
revoke all on function public.notification_recipients(text, uuid) from public, anon, authenticated;
grant execute on function public.notification_recipients(text, uuid) to service_role;
