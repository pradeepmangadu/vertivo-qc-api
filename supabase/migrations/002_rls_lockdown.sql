-- The browser never talks to Supabase directly; only the API (service role) does.
-- RLS is ON with NO policies, so the anon/authenticated roles can read nothing even if a key leaks.
alter table public.profiles           enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_items    enable row level security;
alter table public.deliveries         enable row level security;
alter table public.inspection_records enable row level security;
alter table public.audit_log          enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
