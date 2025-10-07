import '../../../styles/globals.css';
import { revalidatePath } from 'next/cache';
import AddPromoModal from '../../../components/AddPromoModal';
import Calendar from '../../../components/Calendar';
import { fetchCalendar, fetchOwnerOrgs } from '../../../lib/queries';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { z } from 'zod';

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const orgs = await fetchOwnerOrgs();
  const orgIds = orgs.map((org) => org.id);
  const events = await fetchCalendar({ orgIds });

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, org_id')
    .in('org_id', orgIds);
  const { data: templates } = await supabase
    .from('rcs_templates')
    .select('id, name')
    .in('org_id', orgIds);

  const courseOptionsByOrg: Record<string, { id: string; name: string }[]> = {};
  (courses ?? []).forEach((course) => {
    if (!courseOptionsByOrg[course.org_id]) {
      courseOptionsByOrg[course.org_id] = [];
    }
    courseOptionsByOrg[course.org_id].push({ id: course.id, name: course.name });
  });

  async function createPromoAction(formData: FormData) {
    'use server';
    const supa = createSupabaseServerClient();
    const raw = Object.fromEntries(formData.entries());
    const schema = z.object({
      org_id: z.string().uuid(),
      course_id: z.string().uuid().optional().or(z.literal('')),
      template_id: z.string().uuid(),
      name: z.string().min(2),
      description: z.string().optional(),
      audience_kind: z.enum(['all_contacts', 'contact_list', 'smart_list']),
      audience_ref: z.string().uuid().optional().or(z.literal('')),
      scheduled_at: z.string(),
      timezone: z.string(),
      max_sends_per_minute: z.string().optional(),
    });
    const parsed = schema.parse(raw);

    const campaign = await supa
      .from('campaigns')
      .insert({
        org_id: parsed.org_id,
        course_id: parsed.course_id && parsed.course_id !== '' ? parsed.course_id : null,
        template_id: parsed.template_id,
        name: parsed.name,
        description:
          parsed.description && parsed.description.length > 0 ? parsed.description : null,
        audience_kind: parsed.audience_kind,
        audience_ref:
          parsed.audience_ref && parsed.audience_ref !== '' ? parsed.audience_ref : null,
        scheduled_at: parsed.scheduled_at,
        timezone: parsed.timezone,
        status: 'scheduled',
        max_sends_per_minute:
          parsed.max_sends_per_minute && parsed.max_sends_per_minute.length > 0
            ? Number(parsed.max_sends_per_minute)
            : null,
      })
      .select('id, org_id, course_id, name, scheduled_at')
      .single();
    if (campaign.error) throw campaign.error;

    await supa.from('calendar_events').insert({
      org_id: campaign.data.org_id,
      course_id: campaign.data.course_id,
      event_type: 'campaign_send',
      campaign_id: campaign.data.id,
      title: campaign.data.name,
      start_time: campaign.data.scheduled_at,
      end_time: campaign.data.scheduled_at,
      event_status: 'scheduled',
    });

    await supa.from('send_jobs').insert({
      campaign_id: campaign.data.id,
      run_at: campaign.data.scheduled_at,
      status: 'pending',
    });

    revalidatePath('/agency/calendar');
  }

  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn btn-primary">Calendar</a>
        <a className="btn" href="/agency/clients">
          Clients
        </a>
        <a className="btn" href="/agency/analytics">
          Analytics
        </a>
        <a className="btn" href="/agency/inbox">
          Inbox
        </a>
        <a className="btn" href="/agency/settings">
          Settings
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2>Agency Calendar</h2>
        <AddPromoModal
          orgOptions={orgs}
          courseOptionsByOrg={courseOptionsByOrg}
          templateOptions={templates ?? []}
          action={createPromoAction}
        />
      </div>

      <Calendar
        events={(events ?? []).map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start_time,
          end: event.end_time || event.start_time,
        }))}
      />
    </div>
  );
}
