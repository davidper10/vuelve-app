create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);
create index devices_user_id_idx on public.devices (user_id);
alter table public.devices enable row level security;
create policy "devices: select own" on public.devices for select using (user_id = (select auth.uid()));
create policy "devices: insert own" on public.devices for insert with check (user_id = (select auth.uid()));
create policy "devices: update own" on public.devices for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "devices: delete own" on public.devices for delete using (user_id = (select auth.uid()));
create trigger devices_set_updated_at before update on public.devices for each row execute procedure public.set_updated_at();

-- Preferencias de notificaciones push que hay que comprobar en el
-- servidor (Edge Function) antes de enviar -- a diferencia de "recuerdos"
-- y "diario" (Fase 1), que son locales y nunca se consultan server-side.
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  colaborativos boolean not null default true,
  nfc boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy "notification_preferences: select own" on public.notification_preferences for select using (user_id = (select auth.uid()));
create policy "notification_preferences: insert own" on public.notification_preferences for insert with check (user_id = (select auth.uid()));
create policy "notification_preferences: update own" on public.notification_preferences for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create trigger notification_preferences_set_updated_at before update on public.notification_preferences for each row execute procedure public.set_updated_at();
