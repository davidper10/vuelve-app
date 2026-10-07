-- `trip_members.invited_email` guardaba emails de personas sin cuenta, pero
-- ningún flujo de la app lo escribe (0 filas). Se elimina por minimización de
-- datos. Antes hay que quitar su único uso: la función que corre al registrarse
-- un usuario, que enlazaba invitaciones pendientes por email.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'username'
  );

  return new;
end;
$$;

alter table public.trip_members drop column invited_email;
