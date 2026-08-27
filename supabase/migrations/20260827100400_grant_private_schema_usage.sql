-- El esquema `private` contiene las funciones de ayuda (is_trip_owner,
-- is_trip_member, can_view_trip, can_add_to_trip) que usan las políticas
-- RLS de trips, trip_members, trip_shares, memories, moments,
-- diary_entries y storage.objects. Sin USAGE/EXECUTE, cualquier política
-- que las invoque falla con "permission denied for schema private",
-- que Postgres reporta como violación de RLS (42501).
grant usage on schema private to authenticated, anon;
grant execute on all functions in schema private to authenticated, anon;
alter default privileges in schema private grant execute on functions to authenticated, anon;
