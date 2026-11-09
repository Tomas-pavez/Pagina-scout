-- Actualización (noviembre 2026): permite a los administradores eliminar cuentas pendientes
-- desde Administración > Usuarios. Ejecútalo una vez en Supabase → SQL Editor.
-- Se puede ejecutar más de una vez sin problema.

create or replace function public.delete_user(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden eliminar cuentas';
  end if;
  if target = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta';
  end if;
  if not exists (select 1 from public.profiles where id = target and role = 'pending') then
    raise exception 'Solo se pueden eliminar cuentas pendientes';
  end if;
  delete from auth.users where id = target;  -- el perfil se borra solo (on delete cascade)
end $$;

revoke all on function public.delete_user(uuid) from public, anon;
grant execute on function public.delete_user(uuid) to authenticated;
