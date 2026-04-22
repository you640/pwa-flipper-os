-- 1. Add user_id column with auth.uid() default
alter table public.portfolio    add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.market_intel add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.crm_leads    add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- 2. Backfill existing rows to the admin user so they don't disappear
update public.portfolio    set user_id = 'cf5111a5-bd85-42e3-b038-8c4db1e59ab7' where user_id is null;
update public.market_intel set user_id = 'cf5111a5-bd85-42e3-b038-8c4db1e59ab7' where user_id is null;
update public.crm_leads    set user_id = 'cf5111a5-bd85-42e3-b038-8c4db1e59ab7' where user_id is null;

-- 3. Drop the old permissive policies
drop policy if exists "Anyone can view portfolio"   on public.portfolio;
drop policy if exists "Anyone can insert portfolio" on public.portfolio;
drop policy if exists "Anyone can update portfolio" on public.portfolio;
drop policy if exists "Anyone can delete portfolio" on public.portfolio;

drop policy if exists "Anyone can view market intel"   on public.market_intel;
drop policy if exists "Anyone can insert market intel" on public.market_intel;
drop policy if exists "Anyone can update market intel" on public.market_intel;
drop policy if exists "Anyone can delete market intel" on public.market_intel;

drop policy if exists "Anyone can view crm_leads"   on public.crm_leads;
drop policy if exists "Anyone can insert crm_leads" on public.crm_leads;
drop policy if exists "Anyone can update crm_leads" on public.crm_leads;
drop policy if exists "Anyone can delete crm_leads" on public.crm_leads;

-- 4. PORTFOLIO policies
create policy "Users view own portfolio"   on public.portfolio for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own portfolio" on public.portfolio for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own portfolio" on public.portfolio for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own portfolio" on public.portfolio for delete to authenticated using (auth.uid() = user_id);

create policy "Admins view all portfolio"   on public.portfolio for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update all portfolio" on public.portfolio for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete all portfolio" on public.portfolio for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 5. MARKET_INTEL policies
create policy "Users view own market_intel"   on public.market_intel for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own market_intel" on public.market_intel for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own market_intel" on public.market_intel for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own market_intel" on public.market_intel for delete to authenticated using (auth.uid() = user_id);

create policy "Admins view all market_intel"   on public.market_intel for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update all market_intel" on public.market_intel for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete all market_intel" on public.market_intel for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 6. CRM_LEADS policies
create policy "Users view own crm_leads"   on public.crm_leads for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own crm_leads" on public.crm_leads for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own crm_leads" on public.crm_leads for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own crm_leads" on public.crm_leads for delete to authenticated using (auth.uid() = user_id);

create policy "Admins view all crm_leads"   on public.crm_leads for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update all crm_leads" on public.crm_leads for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete all crm_leads" on public.crm_leads for delete to authenticated using (public.has_role(auth.uid(), 'admin'));