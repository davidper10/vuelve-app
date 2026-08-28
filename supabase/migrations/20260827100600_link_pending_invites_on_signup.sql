-- Cuando alguien invitado por email (trip_members.invited_email) se registra,
-- reclama automáticamente su fila de trip_members vinculando user_id. Sin
-- esto, invitar por email solo guardaba un registro inerte: nadie obtenía
-- acceso real al viaje al crear su cuenta.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  update public.trip_members
  set user_id = new.id
  where invited_email = new.email and user_id is null;

  return new;
end;
$$;
