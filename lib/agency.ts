import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AgencyDaily = {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  bookings: number;
};

export type OrgDailyMetric = {
  org_id: string;
  date: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  bookings: number;
};

export async function getOwnerOrgs() {
  const supabase = createSupabaseServerClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from('org_memberships')
    .select('org_id, role');

  if (membershipsError) throw membershipsError;

  const ids = Array.from(new Set((memberships ?? []).map((membership) => membership.org_id)));
  if (ids.length === 0) return [];

  const { data: organizations, error: organizationsError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .in('id', ids);

  if (organizationsError) throw organizationsError;

  return organizations ?? [];
}

export async function getAgencyDaily(): Promise<AgencyDaily[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('agency_daily_metrics')
    .select('date, sent, delivered, read, clicked, replied, bookings')
    .order('date', { ascending: true })
    .limit(60);

  if (error) return [];
  return (data ?? []) as AgencyDaily[];
}

export async function getOrgDailyFor(ids: string[]): Promise<OrgDailyMetric[]> {
  if (!ids.length) return [];

  const supabase = createSupabaseServerClient();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('org_daily_metrics')
    .select('org_id, date, sent, delivered, read, clicked, replied, bookings')
    .in('org_id', ids)
    .gte('date', since);

  if (error) return [];
  return (data ?? []) as OrgDailyMetric[];
}

export async function getCalendarEventsForOwner({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time')
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time', { ascending: true });

  if (error) return [];
  return data ?? [];
}

