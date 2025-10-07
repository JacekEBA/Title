'use server';

import { createSupabaseActionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPromoAction(input: {
  org_id: string;
  course_id: string | null;
  template_id: string;
  name: string;
  description: string | null;
  scheduled_at: string;
  timezone: string;
}) {
  const supabase = createSupabaseActionClient();

  // 1) create campaign
  const { data: c, error: cErr } = await supabase
    .from('campaigns')
    .insert({
      org_id: input.org_id,
      course_id: input.course_id,
      template_id: input.template_id,
      name: input.name,
      description: input.description,
      audience_kind: 'all_contacts',
      scheduled_at: input.scheduled_at,
      timezone: input.timezone,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (cErr) throw cErr;

  // 2) calendar event
  const { error: eErr } = await supabase
    .from('calendar_events')
    .insert({
      org_id: input.org_id,
      course_id: input.course_id,
      event_type: 'campaign_send',
      campaign_id: c.id,
      title: input.name,
      description: input.description,
      start_time: input.scheduled_at,
      end_time: input.scheduled_at,
      event_status: 'scheduled',
    });

  if (eErr) throw eErr;

  // 3) send job
  const { error: jErr } = await supabase
    .from('send_jobs')
    .insert({
      campaign_id: c.id,
      run_at: input.scheduled_at,
      status: 'pending',
    });

  if (jErr) throw jErr;

  revalidatePath('/agency/calendar');
}
