-- trip_members solo permitía insertar filas al propietario del viaje, lo
-- que impedía que alguien se auto-uniera como colaborador al abrir un
-- enlace de invitación (aunque can_view_trip ya le dejaba VER el viaje
-- vía trip_shares). Se amplía para permitir insertarse a sí mismo
-- (nunca a otra persona) cuando el viaje tiene un enlace activo.
alter policy "trip_members: insert if owner" on public.trip_members
with check (
  private.is_trip_owner(trip_id)
  or (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trip_shares ts
      where ts.trip_id = trip_members.trip_id and ts.share_mode in ('link', 'nfc')
    )
  )
);
