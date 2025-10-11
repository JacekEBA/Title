import { createSupabaseServerClient } from './supabase/server';

type OrganizationSummary = { id: string; name: string; slug?: string | null };
type MembershipRecord = {
  role?: string;
  organizations?: OrganizationSummary | null;
};

type CourseRow = { id: string };

export async function fetchOwnerOrgs() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_memberships')
    .select('organizations:org_id(id, name, slug), role')
    .in('role', ['owner', 'agency_staff']);
  if (error) throw error;
  return ((data as MembershipRecord[]) ?? [])
    .map((d) => d.organizations)
    .filter((org): org is OrganizationSummary => Boolean(org));
}

export async function fetchCalendar(params: {
  orgIds?: string[];
  courseIds?: string[];
  from?: string;
  to?: string;
}) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('calendar_events').select('*');
  if (params.orgIds?.length) query = query.in('org_id', params.orgIds);
  if (params.courseIds?.length) query = query.in('course_id', params.courseIds);
  if (params.from) query = query.gte('start_time', params.from);
  if (params.to) query = query.lte('start_time', params.to);
  const { data, error } = await query.order('start_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrgDashboard(orgId: string) {
  const supabase = createSupabaseServerClient();
  const orgDaily = await supabase
    .from('org_daily_metrics')
    .select('date, delivered_like, replies, reads, clicks')
    .eq('org_id', orgId)
    .order('date', { ascending: true });
  if (orgDaily.error) throw orgDaily.error;

  const courseIds = await supabase
    .from('courses')
    .select('id')
    .eq('org_id', orgId);
  if (courseIds.error) throw courseIds.error;
  const ids = ((courseIds.data as CourseRow[] | null) ?? []).map((c) => c.id);

  let gbpData: any[] = [];
  if (ids.length) {
    const gbp = await supabase
      .from('gbp_daily_metrics')
      .select('course_id, date, ranking, views')
      .in('course_id', ids);
    if (gbp.error) throw gbp.error;
    gbpData = gbp.data ?? [];
  }

  return { orgDaily: orgDaily.data ?? [], gbp: gbpData };
}
