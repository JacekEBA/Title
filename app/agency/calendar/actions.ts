'use server';

import { createSupabaseActionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type CreatePromoInput = {
  org_id: string;
  course_id: string;
  template_id: string;
  name: string;
  description: string | null;
  scheduled_at: string;
  timezone: string;
};

export async function createPromoAction(input: CreatePromoInput) {
  // Validate required fields
  if (!input.org_id) {
    throw new Error('Organization is required.');
  }
  if (!input.course_id) {
    throw new Error('Course is required.');
  }
  if (!input.template_id) {
    throw new Error('Template is required.');
  }
  if (!input.name?.trim()) {
    throw new Error('Campaign name is required.');
  }
  if (!input.scheduled_at) {
    throw new Error('Scheduled time is required.');
  }
  if (!input.timezone) {
    throw new Error('Timezone is required.');
  }

  // Validate ISO timestamp
  const scheduledDate = new Date(input.scheduled_at);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled time format.');
  }

  const supabase = createSupabaseActionClient();

  try {
    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        org_id: input.org_id,
        course_id: input.course_id,
        template_id: input.template_id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        audience_kind: 'all_contacts',
        scheduled_at: input.scheduled_at,
        timezone: input.timezone,
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      throw new Error(
        campaignError.message || 'Failed to create campaign'
      );
    }

    // Create calendar event
    const { error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        org_id: input.org_id,
        course_id: input.course_id,
        event_type: 'campaign_send',
        campaign_id: campaign.id,
        title: input.name.trim(),
        description: input.description?.trim() || null,
        start_time: input.scheduled_at,
        end_time: input.scheduled_at,
        event_status: 'scheduled',
      });

    if (eventError) {
      console.error('Calendar event creation error:', eventError);
      // Attempt to clean up campaign
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      throw new Error(
        eventError.message || 'Failed to create calendar event'
      );
    }

    // Create send job
    const { error: jobError } = await supabase.from('send_jobs').insert({
      campaign_id: campaign.id,
      run_at: input.scheduled_at,
      status: 'pending',
    });

    if (jobError) {
      console.error('Send job creation error:', jobError);
      // Attempt to clean up
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      await supabase
        .from('calendar_events')
        .delete()
        .eq('campaign_id', campaign.id);
      throw new Error(jobError.message || 'Failed to schedule send job');
    }

    // Revalidate the calendar page
    revalidatePath('/agency/calendar');

    return { success: true, campaign_id: campaign.id };
  } catch (error) {
    console.error('Create promo action error:', error);
    throw error;
  }
}
