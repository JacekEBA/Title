// @ts-nocheck
import type { Metadata } from 'next';
import CalendarWithEdit from './CalendarWithEdit';
import { getAccessibleOrgs, getCalendarEventsForOwner } from '@/lib/agency';
import { getCurrentProfile } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createPromoAction, updateEventAction, cancelEventAction } from './actions';

export const metadata: Metadata = {
  title: 'Calendar',
};

export default async function CalendarPage() {
  // Get events
  const now = Date.now();
  const hundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now + 460 * 24 * 60 * 60 * 1000);
  
  const from = hundredDaysAgo.toISOString();
  const to = futureDate.toISOString();

  const eventsRaw = await getCalendarEventsForOwner({ from, to });

  const profile = await getCurrentProfile();
  const hasGlobalAccess = profile?.role === 'owner' || profile?.role === 'agency_staff';

  // Get organizations
  const organizations = await getAccessibleOrgs();
  const orgOptions = organizations.map((o) => ({
    id: o.id as string,
    name: o.name as string,
  }));
  const orgIds = orgOptions.map((o) => o.id);

  const supabase = createSupabaseServerClient();

  // Fetch courses, templates, and campaign details
  const courseOptionsByOrg: Record<string, any[]> = {};
  const templateOptionsByOrg: Record<string, any[]> = {};
  const orgMap: Record<string, string> = {};
  const courseMap: Record<string, any> = {};
  const templateMap: Record<string, string> = {};
  const campaignMap: Record<string, any> = {};

  organizations.forEach(org => {
    orgMap[org.id] = org.name as string;
  });

  let courses: any[] = [];
  let templates: any[] = [];
  let campaigns: any[] = [];

  if (hasGlobalAccess) {
    const [{ data: allCourses }, { data: allTemplates }, { data: allCampaigns }] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, org_id, timezone, send_window_start, send_window_end')
        .order('name', { ascending: true }),
      supabase
        .from('rcs_templates')
        .select('id, name, org_id')
        .order('name', { ascending: true }),
      supabase
        .from('campaigns')
        .select('id, org_id, course_id, template_id, name, description, scheduled_at, status, drip_enabled, drip_batch_size, drip_interval_minutes')
    ]);

    courses = allCourses ?? [];
    templates = allTemplates ?? [];
    campaigns = allCampaigns ?? [];
  } else if (orgIds.length > 0) {
    const [{ data: filteredCourses }, { data: filteredTemplates }, { data: filteredCampaigns }] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, org_id, timezone, send_window_start, send_window_end')
        .in('org_id', orgIds)
        .order('name', { ascending: true }),
      supabase
        .from('rcs_templates')
        .select('id, name, org_id')
        .in('org_id', orgIds)
        .order('name', { ascending: true }),
      supabase
        .from('campaigns')
        .select('id, org_id, course_id, template_id, name, description, scheduled_at, status, drip_enabled, drip_batch_size, drip_interval_minutes')
        .in('org_id', orgIds)
    ]);

    courses = filteredCourses ?? [];
    templates = filteredTemplates ?? [];
    campaigns = filteredCampaigns ?? [];
  }

  // Build maps
  for (const course of courses) {
    if (!course?.org_id || !course?.id || !course?.name) continue;
    courseMap[course.id] = course;
    if (!courseOptionsByOrg[course.org_id]) {
      courseOptionsByOrg[course.org_id] = [];
    }
    courseOptionsByOrg[course.org_id].push({
      id: course.id,
      name: course.name,
      timezone: course.timezone ?? 'UTC',
      send_window_start: course.send_window_start ?? null,
      send_window_end: course.send_window_end ?? null,
    });
  }

  for (const template of templates) {
    if (!template?.org_id || !template?.id || !template?.name) continue;
    templateMap[template.id] = template.name;
    if (!templateOptionsByOrg[template.org_id]) {
      templateOptionsByOrg[template.org_id] = [];
    }
    templateOptionsByOrg[template.org_id].push({
      id: template.id,
      name: template.name,
    });
  }

  for (const campaign of campaigns) {
    if (!campaign?.id) continue;
    campaignMap[campaign.id] = campaign;
  }

  // Enrich events with details
  const enrichedEvents = eventsRaw.map((e) => {
    const campaign = e.campaign_id ? campaignMap[e.campaign_id] : null;
    
    // Get course to extract timezone and send window
    const course = e.course_id ? courseMap[e.course_id] : null;
    
    return {
      id: e.id,
      title: e.title ?? 'Promo',
      start: e.start_time,
      end: e.end_time ?? e.start_time,
      description: e.description,
      orgId: e.org_id,
      courseId: e.course_id ?? '',
      campaignId: e.campaign_id ?? '',
      templateId: campaign?.template_id ?? '',
      status: e.event_status,
      orgName: orgMap[e.org_id] ?? 'Unknown',
      courseName: course?.name ?? 'Unknown',
      templateName: campaign?.template_id ? (templateMap[campaign.template_id] ?? 'Unknown') : 'N/A',
      scheduledAt: campaign?.scheduled_at ?? e.start_time,
      timezone: course?.timezone ?? 'UTC',
      campaignStatus: campaign?.status ?? 'unknown',
      sendWindowStart: course?.send_window_start ?? null,
      sendWindowEnd: course?.send_window_end ?? null,
      dripEnabled: campaign?.drip_enabled ?? false,
      dripBatchSize: campaign?.drip_batch_size ?? 10,
      dripIntervalMinutes: campaign?.drip_interval_minutes ?? 5,
    };
  });

  return (
    <CalendarWithEdit
      events={enrichedEvents}
      orgOptions={orgOptions}
      courseOptionsByOrg={courseOptionsByOrg}
      templateOptionsByOrg={templateOptionsByOrg}
      createPromoAction={createPromoAction}
      updateEventAction={updateEventAction}
      cancelEventAction={cancelEventAction}
    />
  );
}
