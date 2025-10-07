import { createSupabaseServerClient } from './supabase/server';

export async function getSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ?? null;
}

export async function landingRedirectPath() {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .maybeSingle();
  if (profile?.role === 'owner') return '/agency';
  const { data: mems } = await supabase
    .from('org_memberships')
    .select('org_id, role');
  const owners = (mems ?? []).filter(
    (m) => m.role === 'owner' || m.role === 'agency_staff'
  );
  if (owners.length > 0) return '/agency';
  if ((mems ?? []).length === 1) return `/org/${(mems ?? [])[0].org_id}`;
  return '/login?pickOrg=1';
}

export async function requireOrgAccess(orgId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('org_memberships')
    .select('org_id')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error('NO_ORG_ACCESS');
}
