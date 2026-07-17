create or replace function private.user_is_barbershop_owner(target_barbershop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.members
      where members.barbershop_id = target_barbershop_id
        and members.user_id = (select auth.uid())
        and members.role = 'owner'
        and members.active = true
    );
$$;

revoke all on function private.user_is_barbershop_owner(uuid) from public;
revoke all on function private.user_is_barbershop_owner(uuid) from anon;
revoke all on function private.user_is_barbershop_owner(uuid) from authenticated;

drop policy if exists "members_manage_owner" on public.members;

create policy "members_insert_owner"
on public.members for insert
to authenticated
with check ((select private.user_is_barbershop_owner(barbershop_id)));

create policy "members_update_owner"
on public.members for update
to authenticated
using ((select private.user_is_barbershop_owner(barbershop_id)))
with check ((select private.user_is_barbershop_owner(barbershop_id)));

create policy "members_delete_owner"
on public.members for delete
to authenticated
using ((select private.user_is_barbershop_owner(barbershop_id)));

drop policy if exists "members_select_same_barbershop" on public.members;
create policy "members_select_same_barbershop"
on public.members for select
to authenticated
using ((select private.user_has_barbershop_access(barbershop_id)));
