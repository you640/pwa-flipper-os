insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where u.email = 'larsenevans@proton.me'
on conflict (user_id, role) do nothing;