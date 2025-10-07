'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseActionClient } from '@/lib/supabase/server';

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
    const campaignData = {
      org_id: input.org_id,
      course_id: input.course_id,
      template_id: input.template_id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      audience_kind: 'all_contacts' as const,
      scheduled_at: input.scheduled_at,
      timezone: input.timezone,
    };

    // @ts-ignore Supabase type inference issue - runtime types are correct
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select('id')
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      throw new Error(
        campaignError.message || 'Failed to create campaign'
      );
    }

    // Create calendar event
    const eventData = {
      org_id: input.org_id,
      course_id: input.course_id,
      event_type: 'campaign_send' as const,
      campaign_id: campaign.id,
      title: input.name.trim(),
      description: input.description?.trim() || null,
      start_time: input.scheduled_at,
      end_time: input.scheduled_at,
    };

    // @ts-expect-error Supabase type inference issue - runtime types are correct
    const { error: eventError } = await supabase
      .from('calendar_events')
      .insert([eventData]);

    if (eventError) {
      console.error('Calendar event creation error:', eventError);
      // Attempt to clean up campaign
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      throw new Error(
        eventError.message || 'Failed to create calendar event'
      );
    }

    // Create send job
    const jobData = {
      campaign_id: campaign.id,
      run_at: input.scheduled_at,
    };

    // @ts-expect-error Supabase type inference issue - runtime types are correct
    const { error: jobError } = await supabase.from('send_jobs').insert([jobData]);

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

type UpdateEventInput = {
  eventId: string;
  campaignId: string;
  name: string;
  description: string | null;
  scheduledAt: string;
  timezone: string;
  orgId: string;
  courseId: string;
  templateId: string;
};

export async function updateEventAction(input: UpdateEventInput) {
  const supabase = createSupabaseActionClient();

  try {
    // Update campaign with all fields
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({
        name: input.name,
        description: input.description,
        scheduled_at: input.scheduledAt,
        timezone: input.timezone,
        org_id: input.orgId,
        course_id: input.courseId,
        template_id: input.templateId,
      })
      .eq('id', input.campaignId);

    if (campaignError) {
      throw new Error('Failed to update campaign');
    }

    // Update calendar event
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        title: input.name,
        description: input.description,
        start_time: input.scheduledAt,
        end_time: input.scheduledAt,
        org_id: input.orgId,
        course_id: input.courseId,
      })
      .eq('id', input.eventId);

    if (eventError) {
      throw new Error('Failed to update calendar event');
    }

    // Update send job run_at
    const { error: jobError } = await supabase
      .from('send_jobs')
      .update({ run_at: input.scheduledAt })
      .eq('campaign_id', input.campaignId)
      .eq('status', 'pending');

    if (jobError) {
      throw new Error('Failed to update send job');
    }

    revalidatePath('/agency/calendar');
    return { success: true };
  } catch (error) {
    console.error('Update event error:', error);
    throw error;
  }
}

export async function cancelEventAction(eventId: string) {
  const supabase = createSupabaseActionClient();

  try {
    // Get the campaign_id from the calendar event
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('campaign_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !event?.campaign_id) {
      throw new Error('Event not found');
    }

    // Update campaign status to cancelled
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', event.campaign_id);

    if (campaignError) {
      throw new Error('Failed to cancel campaign');
    }

    // Update calendar event status
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({ event_status: 'cancelled' })
      .eq('id', eventId);

    if (eventError) {
      throw new Error('Failed to cancel calendar event');
    }

    // Cancel send job
    const { error: jobError } = await supabase
      .from('send_jobs')
      .update({ status: 'failed', last_error: 'Cancelled by user' })
      .eq('campaign_id', event.campaign_id)
      .eq('status', 'pending');

    if (jobError) {
      console.error('Failed to cancel send job:', jobError);
      // Don't throw - the campaign is already cancelled
    }

    revalidatePath('/agency/calendar');
    return { success: true };
  } catch (error) {
    console.error('Cancel event error:', error);
    throw error;
  }
}
