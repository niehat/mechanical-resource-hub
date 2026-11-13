-- =====================================================================
-- 03_storage.sql  |  Storage bucket "academic-resources" and its policies
-- Safe to run more than once.
-- File size limit below is 20 MB (20971520 bytes). Change it here AND in
-- the VITE_MAX_PDF_MB environment variable if you want a different limit.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-resources', 'academic-resources', true, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read academic resources" on storage.objects;
drop policy if exists "Admin can upload academic resources" on storage.objects;
drop policy if exists "Admin can update academic resources" on storage.objects;
drop policy if exists "Admin can delete academic resources" on storage.objects;

create policy "Public can read academic resources" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'academic-resources');

create policy "Admin can upload academic resources" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'academic-resources' and public.is_admin());

create policy "Admin can update academic resources" on storage.objects
  for update to authenticated
  using (bucket_id = 'academic-resources' and public.is_admin())
  with check (bucket_id = 'academic-resources' and public.is_admin());

create policy "Admin can delete academic resources" on storage.objects
  for delete to authenticated
  using (bucket_id = 'academic-resources' and public.is_admin());
