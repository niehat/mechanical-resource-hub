-- =====================================================================
-- 02_rls_policies.sql  |  Row Level Security
-- Public visitors: read-only.  Administrator: full write access.
-- Safe to run more than once.
-- =====================================================================

alter table public.semesters      enable row level security;
alter table public.teachers       enable row level security;
alter table public.subjects       enable row level security;
alter table public.resources      enable row level security;
alter table public.admin_profiles enable row level security;

-- Defense in depth: anonymous visitors never get write privileges.
revoke insert, update, delete, truncate on
  public.semesters, public.teachers, public.subjects, public.resources, public.admin_profiles
  from anon;
-- Nobody can change admin_profiles through the API (only via the SQL Editor).
revoke insert, update, delete, truncate on public.admin_profiles from authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['semesters', 'teachers', 'subjects', 'resources'] loop
    execute format('drop policy if exists "Public can read %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can insert %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can delete %1$s" on public.%1$I', t);

    execute format('create policy "Public can read %1$s" on public.%1$I
                      for select to anon, authenticated using (true)', t);
    execute format('create policy "Admin can insert %1$s" on public.%1$I
                      for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "Admin can update %1$s" on public.%1$I
                      for update to authenticated
                      using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "Admin can delete %1$s" on public.%1$I
                      for delete to authenticated using (public.is_admin())', t);
  end loop;
end
$$;

-- A signed-in user may only see their own admin_profiles row (used by the app
-- to decide whether to show the dashboard). No insert/update/delete policies.
drop policy if exists "Users can read own admin profile" on public.admin_profiles;
create policy "Users can read own admin profile" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());
