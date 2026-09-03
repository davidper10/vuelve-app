-- Guarda el username elegido al registrarse (pasado en options.data),
-- igual que ya se hacía con full_name/avatar_url. Se hace en el trigger,
-- no con un UPDATE desde el cliente tras el signUp, porque la sesión
-- puede no estar disponible todavía si la confirmación por email está
-- activa.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'username'
  );

  update public.trip_members
  set user_id = new.id
  where invited_email = new.email and user_id is null;

  return new;
end;
$$;
