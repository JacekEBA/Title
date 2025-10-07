import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getAccessibleOrgs() {
  const supabase = createSupabaseServerClient();
  
  // Check if user has global owner role in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .single();

  // If user has owner or agency_staff role globally, they can see ALL organizations
  if (profile?.role === 'owner' || profile?.role === 'agency_staff') {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  }

  // Otherwise, only show orgs they're a member of
  const { data, error } = await supabase
    .from('org_memberships')
    .select('role, organizations:org_id(id, name, slug)')
    .in('role', ['owner', 'agency_staff', 'client_admin', 'client_viewer']);
  
  if (error) throw error;
  
  const orgs = (data ?? [])
    .map((r) => r.organizations)
    .filter(Boolean);
  
  // De-dupe by id
  const byId = new Map<string, any>();
  for (const o of orgs) if (o) byId.set(o.id, o);
  return Array.from(byId.values());
}

/**
 * Load daily totals (sent/delivered/read/replied/clicked/bookings) across ALL orgs
 * the user can see, by summing campaign_daily_metrics joined to campaigns.
 *
 * Falls back to [] if RLS on metrics is not yet in place.
 */
export async function getAgencyDaily({ from, to }: { from: string; to: string }) {
  const supabase = createSupabaseServerClient();
  
  // campaign_daily_metrics has FK to campaigns(id). We join to campaigns to filter by orgs
  // the user can see via RLS on campaigns.
  const { data, error } = await supabase
    .from('campaign_daily_metrics')
    .select('date, sent, delivered, read, clicked, replied, bookings, campaigns!inner(org_id)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });
  
  if (error) return [];
  
  // Aggregate by date in JS
  const agg: Record<
    string,
    { sent: number; delivered: number; read: number; clicked: number; replied: number; bookings: number }
  > = {};
  
  for (const r of data as any[]) {
    const d = r.date;
    const a = agg[d] ?? { sent: 0, delivered: 0, read: 0, clicked: 0, replied: 0, bookings: 0 };
    a.sent += r.sent || 0;
    a.delivered += r.delivered || 0;
    a.read += r.read || 0;
    a.clicked += r.clicked || 0;
    a.replied += r.replied || 0;
    a.bookings += r.bookings || 0;
    agg[d] = a;
  }
  
  return Object.entries(agg)
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .map(([date, vals]) => ({ date, ...vals }));
}

export async function getCalendarEventsForOwner({ from, to }: { from: string; to: string }) {
  const supabase = createSupabaseServerClient();
  
  // Check if user has global owner/agency_staff role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .single();

  let query = supabase
    .from('calendar_events')
    .select('id, title, description, start_time, end_time, org_id, course_id, campaign_id, event_status')
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time', { ascending: true });

  // If not owner/agency_staff, filter by accessible orgs
  if (profile?.role !== 'owner' && profile?.role !== 'agency_staff') {
    const orgs = await getAccessibleOrgs();
    const orgIds = orgs.map(o => o.id);
    
    if (orgIds.length === 0) {
      return [];
    }
    
    query = query.in('org_id', orgIds);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
  
}
