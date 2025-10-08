import { createSupabaseServerClient } from '@/lib/supabase/server';
import OrgCalendarView from './OrgCalendarView';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgCalendarPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  
  // Get calendar events for this org only
  const now = Date.now();
  const hundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now + 460 * 24 * 60 * 60 * 1000);
  
  const from = hundredDaysAgo.toISOString();
  const to = futureDate.toISOString();

  const { data: events } = await supabase
    .from('calendar_events')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      event_status,
      campaign_id,
      course_id,
      courses:course_id(name, timezone),
      campaigns:campaign_id(
        id,
        name,
        description,
        scheduled_at,
        status,
        template_id,
        rcs_templates:template_id(name)
      )
    `)
    .eq('org_id', params.orgId)
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time', { ascending: true });

  const eventsData = (events ?? []) as any[];

  // Enrich events with campaign and course data
  const enrichedEvents = eventsData.map((e) => {
    const campaign = e.campaigns;
    const course = e.courses;
    const template = campaign?.rcs_templates;

    return {
      id: e.id,
      title: e.title || campaign?.name || 'Untitled Event',
      start: e.start_time,
      end: e.end_time ?? e.start_time,
      description: e.description || campaign?.description || null,
      campaignId: e.campaign_id ?? '',
      courseId: e.course_id ?? '',
      courseName: course?.name ?? 'N/A',
      templateName: template?.name ?? 'N/A',
      scheduledAt: campaign?.scheduled_at ?? e.start_time,
      timezone: course?.timezone ?? 'UTC',
      status: e.event_status,
      campaignStatus: campaign?.status ?? 'unknown',
    };
  });

  return <OrgCalendarView events={enrichedEvents} />;
}
