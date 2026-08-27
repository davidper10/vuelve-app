-- 1) Envuelve auth.uid() en (select ...) para que el planner lo evalúe una vez, no por fila.

alter policy "profiles: select own" on public.profiles using (id = (select auth.uid()));
alter policy "profiles: update own" on public.profiles using (id = (select auth.uid()));

alter policy "trips: insert own" on public.trips with check (owner_id = (select auth.uid()));
alter policy "trips: update own" on public.trips using (owner_id = (select auth.uid()));
alter policy "trips: delete own" on public.trips using (owner_id = (select auth.uid()));

alter policy "memories: update own or owner" on public.memories using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));
alter policy "memories: delete own or owner" on public.memories using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));

alter policy "moments: update own or owner" on public.moments using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));
alter policy "moments: delete own or owner" on public.moments using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));

alter policy "diary: update own or owner" on public.diary_entries using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));
alter policy "diary: delete own or owner" on public.diary_entries using (created_by = (select auth.uid()) or private.is_trip_owner(trip_id));

-- 2) Divide las políticas "for all" que duplicaban el SELECT ya cubierto por otra política
--    (mejor rendimiento: una sola política permisiva por acción/rol).

drop policy "trip_members: manage if owner" on public.trip_members;
create policy "trip_members: insert if owner" on public.trip_members for insert with check (private.is_trip_owner(trip_id));
create policy "trip_members: update if owner" on public.trip_members for update using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));
create policy "trip_members: delete if owner" on public.trip_members for delete using (private.is_trip_owner(trip_id));

drop policy "trip_shares: manage if owner" on public.trip_shares;
create policy "trip_shares: insert if owner" on public.trip_shares for insert with check (private.is_trip_owner(trip_id));
create policy "trip_shares: update if owner" on public.trip_shares for update using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));
create policy "trip_shares: delete if owner" on public.trip_shares for delete using (private.is_trip_owner(trip_id));

drop policy "moment_memories: manage if can add to parent moment" on public.moment_memories;
create policy "moment_memories: insert if can add to parent moment" on public.moment_memories for insert with check (
  exists (select 1 from public.moments m where m.id = moment_id and private.can_add_to_trip(m.trip_id))
);
create policy "moment_memories: delete if can add to parent moment" on public.moment_memories for delete using (
  exists (select 1 from public.moments m where m.id = moment_id and private.can_add_to_trip(m.trip_id))
);

drop policy "nfc: owner full access" on public.nfc_tags;
create policy "nfc: insert own" on public.nfc_tags for insert with check (owner_id = (select auth.uid()));
create policy "nfc: update own" on public.nfc_tags for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "nfc: delete own" on public.nfc_tags for delete using (owner_id = (select auth.uid()));
-- el dueño también debe poder ver sus propios tags inactivos, no solo los activos
alter policy "nfc: public read active tags by slug" on public.nfc_tags using (status = 'active' or owner_id = (select auth.uid()));

-- 3) Índices que faltaban para las foreign keys usadas en joins/policies.
create index diary_entries_created_by_idx on public.diary_entries (created_by);
create index memories_created_by_idx on public.memories (created_by);
create index moment_memories_memory_id_idx on public.moment_memories (memory_id);
create index moments_created_by_idx on public.moments (created_by);
create index nfc_tags_moment_id_idx on public.nfc_tags (moment_id);
create index nfc_tags_trip_id_idx on public.nfc_tags (trip_id);
