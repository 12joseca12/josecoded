-- Task 1.8 (DT §6.2). Documentation only: no schema change.
-- The change lives in supabase/functions/notify/index.ts: new events `lead.created` and `system.ping_failed`.
-- Deploying the Edge Function (`supabase functions deploy notify`) needs Jose's OK.
do $$ begin null; end $$;
