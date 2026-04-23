-- Trigger: only larsenevans@proton.me can ever hold the admin role
create or replace function public.enforce_single_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if NEW.role = 'admin'::public.app_role then
    select email into target_email from auth.users where id = NEW.user_id;
    if target_email is null or lower(target_email) <> 'larsenevans@proton.me' then
      raise exception 'Admin role is reserved for the founder account.'
        using errcode = '42501';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_single_admin_ins on public.user_roles;
drop trigger if exists trg_enforce_single_admin_upd on public.user_roles;

create trigger trg_enforce_single_admin_ins
before insert on public.user_roles
for each row execute function public.enforce_single_admin();

create trigger trg_enforce_single_admin_upd
before update on public.user_roles
for each row execute function public.enforce_single_admin();