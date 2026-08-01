-- Row-Level Security policies for donblog
-- Run this in Supabase SQL Editor once. Safe to re-run (idempotent).

-- ============================================================
-- comments: accessed by the browser with the anon key.
--   read  : anyone
--   write : authenticated users, only as themselves
--   delete: authenticated users, only their own rows
-- ============================================================
alter table public.comments enable row level security;

drop policy if exists "comments_select_all"  on public.comments;
drop policy if exists "comments_insert_own"  on public.comments;
drop policy if exists "comments_delete_own"  on public.comments;

create policy "comments_select_all" on public.comments
  for select
  using (true);

create policy "comments_insert_own" on public.comments
  for insert
  with check (auth.uid() = user_id);

create policy "comments_delete_own" on public.comments
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- templates: accessed only from server API routes via the
-- service-role key, which bypasses RLS. Deny all anon/auth
-- access; no policies needed.
-- ============================================================
alter table public.templates enable row level security;

drop policy if exists "templates_all" on public.templates;

-- ============================================================
-- trading_candles: DEPRECATED — chart cache moved to local files
-- (logs/trading/candles/). Table may be dropped in Supabase.
-- ============================================================
-- alter table public.trading_candles enable row level security;
-- drop policy if exists "trading_candles_all" on public.trading_candles;
