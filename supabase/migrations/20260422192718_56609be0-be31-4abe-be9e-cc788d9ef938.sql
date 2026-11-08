create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where id = 'cf5111a5-bd85-42e3-b038-8c4db1e59ab7'
on conflict (user_id, role) do nothing;