-- =====================================================================
-- create_admin.sql  |  Run ONCE, after creating the admin user in
-- Supabase -> Authentication -> Users -> "Add user".
-- 1) Replace the email below with the exact email of that user.
-- 2) Run it in the SQL Editor.
-- Only one administrator can ever exist (enforced by a unique index).
-- =====================================================================

insert into public.admin_profiles (user_id)
select id from auth.users
where email = 'eng.mdnishatali@gmail.com'
limit 1;

-- Check: this should return one row with your email.
select u.email, a.created_at
from public.admin_profiles a
join auth.users u on u.id = a.user_id;
