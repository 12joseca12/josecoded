-- Task 1.8e (plan v3.4; DATOS v1.4 §14.1, §14.7 migration 1). New enum values live alone in this migration (P6): Postgres
-- does not let a value added to an enum be used in the transaction that adds it, and every Supabase migration is one
-- transaction. The later migrations (and their SQL-language function bodies) can therefore refer to them.
-- DATOS lists the contact_source and interaction_kind values under migration 2; they move here for the same reason.

alter type public.staff_role add value if not exists 'closer';

-- Imported CSV contacts (DATOS §14.1).
alter type public.contact_source add value if not exists 'import_csv';

-- Timeline of a contact (DATOS §14.1): portal invite, client stories, commissions and quotes.
alter type public.interaction_kind add value if not exists 'client_invited';
alter type public.interaction_kind add value if not exists 'story_proposed';
alter type public.interaction_kind add value if not exists 'story_decided';
alter type public.interaction_kind add value if not exists 'commission';

-- Security review 1.8e: what a closer writes by hand is marked as his own (interactions and drafts), never as Jose or the AI.
alter type public.interaction_actor add value if not exists 'closer';
alter type public.draft_author add value if not exists 'closer';
