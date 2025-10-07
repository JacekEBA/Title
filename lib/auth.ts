import { createSupabaseServerClient } from './supabase/server';

export async function getSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ?? null;
}

/**
 * Decide where the user should land after auth.
 *
 * owner or agency_staff -> /agency
 *
 * exactly one org -> /org/[orgId]
 *
 * otherwise -> /dashboard?pickOrg=1 (org chooser)
 */
export async function landingRedirectPath() {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase.from('profiles').select('role').maybeSingle();
  const { data: mems } = await supabase.from('org_memberships').select('org_id, role');
  const roles = (mems ?? []).map((m) => m.role);

  if (profile?.role === 'owner' || roles.includes('owner') || roles.includes('agency_staff')) {
    return '/agency';
  }
  if ((mems ?? []).length === 1) {
    const membership = mems?.[0];
    if (membership) {
      return `/org/${membership.org_id}`;
    }
  }
  return '/dashboard?pickOrg=1';
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
