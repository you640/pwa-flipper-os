create table public.portfolio_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid references public.portfolio(id) on delete cascade,
  inputs jsonb not null,
  ai_report jsonb not null,
  model text not null default 'google/gemini-2.5-pro',
  created_at timestamptz not null default now()
);

alter table public.portfolio_audits enable row level security;

create policy "Users view own audits" on public.portfolio_audits
  for select to authenticated using (auth.uid() = user_id);

create policy "Users insert own audits" on public.portfolio_audits
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete own audits" on public.portfolio_audits
  for delete to authenticated using (auth.uid() = user_id);

create policy "Admins view all audits" on public.portfolio_audits
  for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));

create index idx_portfolio_audits_user on public.portfolio_audits(user_id, created_at desc);
create index idx_portfolio_audits_portfolio on public.portfolio_audits(portfolio_id);