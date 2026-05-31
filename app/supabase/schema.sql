-- StageOps future Supabase schema notes.
-- Apply after reviewing project-specific auth claims and organization membership model.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'operator')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  total_quantity integer not null check (total_quantity >= 0),
  status text not null,
  operational_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now(),
  retention_expires_at timestamptz not null default (now() + interval '180 days')
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.equipment enable row level security;
alter table public.security_audit_logs enable row level security;

create policy "members can view their organizations"
  on public.organizations
  for select
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = organizations.id
        and member.user_id = auth.uid()
    )
  );

create policy "members can view organization equipment"
  on public.equipment
  for select
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = equipment.organization_id
        and member.user_id = auth.uid()
    )
  );

create policy "managers can manage organization equipment"
  on public.equipment
  for all
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = equipment.organization_id
        and member.user_id = auth.uid()
        and member.role in ('admin', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = equipment.organization_id
        and member.user_id = auth.uid()
        and member.role in ('admin', 'manager')
    )
  );

create policy "admins can view organization security audit logs"
  on public.security_audit_logs
  for select
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = security_audit_logs.organization_id
        and member.user_id = auth.uid()
        and member.role = 'admin'
    )
  );

-- Audit logs should be inserted by a trusted server-side function or Edge Function.
-- Do not allow client-side inserts that could forge user, IP, or organization context.
