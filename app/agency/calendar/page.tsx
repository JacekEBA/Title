import type { Metadata } from 'next';
import Calendar from '@/components/Calendar';
import AddPromoModal from './AddPromoModal';
import { getAccessibleOrgs, getCalendarEventsForOwner } from '@/lib/agency';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createPromoAction } from './actions';

export const metadata: Metadata = {
  title: 'Calendar',
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

type CourseOption = {
  id: string;
  name: string;
  timezone: string;
};

type TemplateOption = {
  id: string;
  name: string;
};

export default async function CalendarPage() {
  // Get events for the last 100 days and next 460 days
  const now = Date.now();
  const hundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now + 460 * 24 * 60 * 60 * 1000);
  
  const from = hundredDaysAgo.toISOString();
  const to = futureDate.toISOString();

  const eventsRaw = await getCalendarEventsForOwner({ from, to });
  const events: CalendarEvent[] = eventsRaw.map((e) => ({
    id: e.id,
    title: e.title ?? 'Promo',
    start: e.start_time,
    end: e.end_time ?? e.start_time,
  }));

  // Get organizations
  const organizations = await getAccessibleOrgs();
  const orgOptions = organizations.map((o) => ({
    id: o.id as string,
    name: o.name as string,
  }));
  const orgIds = orgOptions.map((o) => o.id);

  const supabase = createSupabaseServerClient();

  // Fetch courses and templates
  const courseOptionsByOrg: Record<string, CourseOption[]> = {};
  const templateOptionsByOrg: Record<string, TemplateOption[]> = {};

  if (orgIds.length > 0) {
    const [{ data: courses }, { data: templates }] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, org_id, timezone')
        .in('org_id', orgIds)
        .order('name', { ascending: true }),
      supabase
        .from('rcs_templates')
        .select('id, name, org_id')
        .in('org_id', orgIds)
        .order('name', { ascending: true }),
    ]);

    // Group courses by org
    for (const course of courses ?? []) {
      if (!course?.org_id || !course?.id || !course?.name) continue;
      if (!courseOptionsByOrg[course.org_id]) {
        courseOptionsByOrg[course.org_id] = [];
      }
      courseOptionsByOrg[course.org_id].push({
        id: course.id,
        name: course.name,
        timezone: course.timezone ?? 'UTC',
      });
    }

    // Group templates by org
    for (const template of templates ?? []) {
      if (!template?.org_id || !template?.id || !template?.name) continue;
      if (!templateOptionsByOrg[template.org_id]) {
        templateOptionsByOrg[template.org_id] = [];
      }
      templateOptionsByOrg[template.org_id].push({
        id: template.id,
        name: template.name,
      });
    }
  }

  const createPromo = async (formData: FormData) => {
    'use server';

    const getString = (key: string): string => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };

    const scheduledAtRaw = getString('scheduled_at');
    const scheduledAtIso = (() => {
      if (!scheduledAtRaw) return '';
      const parsed = new Date(scheduledAtRaw);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    })();

    const description = formData.get('description');
    const descriptionValue =
      typeof description === 'string' && description.trim().length > 0
        ? description.trim()
        : null;

    await createPromoAction({
      org_id: getString('org_id'),
      course_id: getString('course_id'),
      template_id: getString('template_id'),
      name: getString('name'),
      description: descriptionValue,
      scheduled_at: scheduledAtIso,
      timezone: getString('timezone'),
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <AddPromoModal
          orgOptions={orgOptions}
          courseOptionsByOrg={courseOptionsByOrg}
          templateOptionsByOrg={templateOptionsByOrg}
          action={createPromo}
        />
      </div>
      
      <div className="card">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No events scheduled yet. Click "Add RCS Promo" to get started.
          </p>
        ) : (
          <Calendar events={events} />
        )}
      </div>
    </div>
  );
}
