create index if not exists idx_members_employee_id
  on public.members(employee_id)
  where employee_id is not null;
