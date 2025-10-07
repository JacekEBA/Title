// @ts-nocheck
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

function parseCreatePromoInput(input: CreatePromoInput | FormData): CreatePromoInput {
  if (input instanceof FormData) {
    return {
      org_id: String(input.get('org_id') ?? ''),
      course_id: String(input.get('course_id') ?? ''),
      template_id: String(input.get('template_id') ?? ''),
      name: String(input.get('name') ?? ''),
      description: input.get('description')
        ? String(input.get('description'))
        : null,
      scheduled_at: String(input.get('scheduled_at') ?? ''),
      timezone: String(input.get('timezone') ?? ''),
    };
  }

  return input;
}

export async function createPromoAction(rawInput: CreatePromoInput | FormData) {
  const input = parseCreatePromoInput(rawInput);

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

  // Validate ISO timestamp
  const scheduledDate = new Date(input.scheduled_at);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled time format.');
  }

  const supabase = createSupabaseActionClient();

  const [{ data: course, error: courseError }, { data: template, error: templateError }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id, org_id, timezone')
        .eq('id', input.course_id)
        .maybeSingle(),
      supabase
        .from('rcs_templates')
        .select('id, org_id')
        .eq('id', input.template_id)
        .maybeSingle(),
    ]);

  if (courseError) {
    console.error('Error loading course for promo:', courseError);
    throw new Error('Could not load course details.');
  }
  if (!course) {
    throw new Error('Course not found.');
  }
  if (course.org_id !== input.org_id) {
    throw new Error('Selected course does not belong to the chosen organization.');
  }

  if (templateError) {
    console.error('Error loading template for promo:', templateError);
    throw new Error('Could not load template details.');
  }
  if (!template) {
    throw new Error('Template not found.');
  }
  if (template.org_id !== input.org_id) {
    throw new Error('Selected template does not belong to the chosen organization.');
  }

  const timezone = (course.timezone ?? '').trim() || (input.timezone ?? '').trim() || 'UTC';
  const scheduledAt = scheduledDate.toISOString();

  try {
    // Create campaign
    const campaignData = {
      org_id: input.org_id,
      course_id: input.course_id,
      template_id: input.template_id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      audience_kind: 'all_contacts' as const,
      scheduled_at: scheduledAt,
      timezone,
    };

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

    if (!campaign) {
      throw new Error('Failed to create campaign - no data returned');
    }

    // Create calendar event
    const eventData = {
      org_id: input.org_id,
      course_id: input.course_id,
      event_type: 'campaign_send' as const,
      campaign_id: (campaign as { id: string }).id,
      title: input.name.trim(),
      description: input.description?.trim() || null,
      start_time: scheduledAt,
      end_time: scheduledAt,
    };

    // @ts-ignore
    const { error: eventError } = await supabase
      .from('calendar_events')
      // @ts-ignore
      .insert([eventData]);

    if (eventError) {
      console.error('Calendar event creation error:', eventError);
      // @ts-ignore
      await supabase.from('campaigns').delete().eq('id', (campaign as { id: string }).id);
      throw new Error(
        eventError.message || 'Failed to create calendar event'
      );
    }

    // Create send job
    const jobData = {
      campaign_id: (campaign as { id: string }).id,
      run_at: scheduledAt,
    };

    // @ts-ignore
    const { error: jobError } = await supabase
      .from('send_jobs')
      // @ts-ignore
      .insert([jobData]);

    if (jobError) {
      console.error('Send job creation error:', jobError);
      // Attempt to clean up
      await supabase.from('campaigns').delete().eq('id', (campaign as { id: string }).id);
      await supabase
        .from('calendar_events')
        .delete()
        .eq('campaign_id', campaign.id);
      throw new Error(jobError.message || 'Failed to schedule send job');
    }

    // Revalidate the calendar page
    revalidatePath('/agency/calendar');

    return { success: true, campaign_id: (campaign as { id: string }).id };
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

  const scheduledDate = new Date(input.scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled time format.');
  }

  const [{ data: course, error: courseError }, { data: template, error: templateError }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id, org_id, timezone')
        .eq('id', input.courseId)
        .maybeSingle(),
      supabase
        .from('rcs_templates')
        .select('id, org_id')
        .eq('id', input.templateId)
        .maybeSingle(),
    ]);

  if (courseError) {
    console.error('Failed to load course for update:', courseError);
    throw new Error('Could not load course details.');
  }
  if (!course) {
    throw new Error('Course not found.');
  }
  if (course.org_id !== input.orgId) {
    throw new Error('Selected course does not belong to the chosen organization.');
  }

  if (templateError) {
    console.error('Failed to load template for update:', templateError);
    throw new Error('Could not load template details.');
  }
  if (!template) {
    throw new Error('Template not found.');
  }
  if (template.org_id !== input.orgId) {
    throw new Error('Selected template does not belong to the chosen organization.');
  }

  const timezone = (course.timezone ?? '').trim() || (input.timezone ?? '').trim() || 'UTC';
  const scheduledAt = scheduledDate.toISOString();

  try {
    // @ts-ignore
    const { error: campaignError } = await supabase
      .from('campaigns')
      // @ts-ignore
      .update({
        name: input.name,
        description: input.description,
        scheduled_at: scheduledAt,
        timezone,
        org_id: input.orgId,
        course_id: input.courseId,
        template_id: input.templateId,
      })
      .eq('id', input.campaignId);

    if (campaignError) {
      throw new Error('Failed to update campaign');
    }

    // @ts-ignore
    const { error: eventError } = await supabase
      .from('calendar_events')
      // @ts-ignore
      .update({
        title: input.name,
        description: input.description,
        start_time: scheduledAt,
        end_time: scheduledAt,
        org_id: input.orgId,
        course_id: input.courseId,
      })
      .eq('id', input.eventId);

    if (eventError) {
      throw new Error('Failed to update calendar event');
    }

    // @ts-ignore
    const { error: jobError } = await supabase
      .from('send_jobs')
      // @ts-ignore
      .update({ run_at: scheduledAt })
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

    // @ts-ignore
    const { error: campaignError } = await supabase
      .from('campaigns')
      // @ts-ignore
      .update({ status: 'cancelled' })
      .eq('id', event.campaign_id);

    if (campaignError) {
      throw new Error('Failed to cancel campaign');
    }

    // @ts-ignore
    const { error: eventError } = await supabase
      .from('calendar_events')
      // @ts-ignore
      .update({ event_status: 'cancelled' })
      .eq('id', eventId);

    if (eventError) {
      throw new Error('Failed to cancel calendar event');
    }

    // @ts-ignore
    const { error: jobError } = await supabase
      .from('send_jobs')
      // @ts-ignore
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
