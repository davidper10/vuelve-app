-- Permite iniciar sesión con un nombre de usuario además de con email.
-- La columna es opcional (los usuarios ya existentes no tienen uno) y
-- única sin distinguir mayúsculas/minúsculas. email_for_username es
-- SECURITY DEFINER y solo devuelve el email de una coincidencia exacta,
-- sin exponer el resto de profiles/auth.users — se puede llamar sin
-- sesión (login pre-auth), por eso el grant a anon.
alter table public.profiles add column username text;
create unique index profiles_username_lower_idx on public.profiles (lower(username)) where username is not null;

create or replace function public.email_for_username(username_input text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(username_input)
  limit 1;
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;
