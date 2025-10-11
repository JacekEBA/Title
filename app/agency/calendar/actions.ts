'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseActionClient } from '@/lib/supabase/server';

export async function createPromoAction(formData: FormData) {
  const supabase = createSupabaseActionClient();

  // Verify authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Verify user is owner or agency_staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'owner' && profile.role !== 'agency_staff')) {
    throw new Error('Unauthorized: Only agency users can create campaigns');
  }

  // Parse form data
  const input = {
    org_id: formData.get('org_id') as string,
    course_id: formData.get('course_id') as string,
    template_id: formData.get('template_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
    scheduled_at: formData.get('scheduled_at') as string,
    timezone: formData.get('timezone') as string,
    send_window_start: (formData.get('send_window_start') as string) || null,
    send_window_end: (formData.get('send_window_end') as string) || null,
    drip_enabled: formData.get('drip_enabled') === 'true',
    drip_batch_size: parseInt(formData.get('drip_batch_size') as string || '10'),
    drip_interval_minutes: parseInt(formData.get('drip_interval_minutes') as string || '5'),
  };

  if (!input.org_id || !input.course_id || !input.template_id || !input.name || !input.scheduled_at) {
    throw new Error('Missing required fields');
  }

  // Validate send window
  if ((input.send_window_start && !input.send_window_end) || (!input.send_window_start && input.send_window_end)) {
    throw new Error('Both start and end times must be set for send window, or leave both blank');
  }

  // Validate drip settings
  if (input.drip_enabled) {
    if (input.drip_batch_size < 1 || input.drip_batch_size > 1000) {
      throw new Error('Batch size must be between 1 and 1000');
    }
    if (input.drip_interval_minutes < 1 || input.drip_interval_minutes > 1440) {
      throw new Error('Interval must be between 1 and 1440 minutes');
    }
  }

  // Parse and validate the scheduled date
  const scheduledDate = new Date(input.scheduled_at);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled date');
  }

  // Verify course exists and belongs to org
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('org_id, timezone')
    .eq('id', input.course_id)
    .single();

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

  // Verify template exists and belongs to org
  const { data: template, error: templateError } = await supabase
    .from('rcs_templates')
    .select('org_id')
    .eq('id', input.template_id)
    .single();

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
    // Update course send window if provided
    if (input.send_window_start && input.send_window_end) {
      await supabase
        .from('courses')
        .update({
          send_window_start: input.send_window_start,
          send_window_end: input.send_window_end,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.course_id);
    }

    // Create campaign with drip settings
    const campaignData = {
      org_id: input.org_id,
      course_id: input.course_id,
      template_id: input.template_id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      audience_kind: 'all_contacts' as const,
      scheduled_at: scheduledAt,
      timezone,
      drip_enabled: input.drip_enabled,
      drip_batch_size: input.drip_enabled ? input.drip_batch_size : null,
      drip_interval_minutes: input.drip_enabled ? input.drip_interval_minutes : null,
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

    const { error: eventError } = await supabase
      .from('calendar_events')
      .insert([eventData]);

    if (eventError) {
      console.error('Calendar event creation error:', eventError);
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

    const { error: jobError } = await supabase
      .from('send_jobs')
      .insert([jobData]);

    if (jobError) {
      console.error('Send job creation error:', jobError);
      // Attempt to cleanup
      await supabase.from('calendar_events').delete().eq('campaign_id', (campaign as { id: string }).id);
      await supabase.from('campaigns').delete().eq('id', (campaign as { id: string }).id);
      throw new Error(jobError.message || 'Failed to create send job');
    }

    revalidatePath('/agency/calendar');
    return { success: true, campaignId: (campaign as { id: string }).id };
  } catch (error) {
    console.error('Error in createPromoAction:', error);
    throw error;
  }
}

export async function updateEventAction(data: {
  eventId: string;
  campaignId: string;
  name: string;
  description: string | null;
  scheduledAt: string;
  timezone: string;
  orgId: string;
  courseId: string;
  templateId: string;
  sendWindowStart?: string | null;
  sendWindowEnd?: string | null;
  dripEnabled?: boolean;
  dripBatchSize?: number;
  dripIntervalMinutes?: number;
}) {
  const supabase = createSupabaseActionClient();

  // Verify authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Verify user is owner or agency_staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'owner' && profile.role !== 'agency_staff')) {
    throw new Error('Unauthorized: Only agency users can update campaigns');
  }

  // Validate send window
  if ((data.sendWindowStart && !data.sendWindowEnd) || (!data.sendWindowStart && data.sendWindowEnd)) {
    throw new Error('Both start and end times must be set for send window, or leave both blank');
  }

  try {
    // Update course send window if provided
    if (data.sendWindowStart && data.sendWindowEnd) {
      await supabase
        .from('courses')
        .update({
          send_window_start: data.sendWindowStart,
          send_window_end: data.sendWindowEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.courseId);
    }

    // Update campaign
    const campaignUpdate: any = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      scheduled_at: data.scheduledAt,
      timezone: data.timezone,
      org_id: data.orgId,
      course_id: data.courseId,
      template_id: data.templateId,
      updated_at: new Date().toISOString(),
    };

    // Add drip settings if provided
    if (data.dripEnabled !== undefined) {
      campaignUpdate.drip_enabled = data.dripEnabled;
      if (data.dripEnabled) {
        campaignUpdate.drip_batch_size = data.dripBatchSize || 10;
        campaignUpdate.drip_interval_minutes = data.dripIntervalMinutes || 5;
      }
    }

    const { error: campaignError } = await supabase
      .from('campaigns')
      .update(campaignUpdate)
      .eq('id', data.campaignId);

    if (campaignError) {
      throw new Error('Failed to update campaign');
    }

    // Update calendar event
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        title: data.name.trim(),
        description: data.description?.trim() || null,
        start_time: data.scheduledAt,
        end_time: data.scheduledAt,
        org_id: data.orgId,
        course_id: data.courseId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.eventId);

    if (eventError) {
      throw new Error('Failed to update calendar event');
    }

    // Update send job
    const { error: jobError } = await supabase
      .from('send_jobs')
      .update({
        run_at: data.scheduledAt,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', data.campaignId)
      .eq('status', 'pending');

    if (jobError) {
      console.warn('Failed to update send job:', jobError);
    }

    revalidatePath('/agency/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error in updateEventAction:', error);
    throw error;
  }
}

export async function cancelEventAction(eventId: string) {
  const supabase = createSupabaseActionClient();

  // Verify authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Verify user is owner or agency_staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'owner' && profile.role !== 'agency_staff')) {
    throw new Error('Unauthorized: Only agency users can cancel campaigns');
  }

  try {
    // Get the event to find the campaign
    const { data: event } = await supabase
      .from('calendar_events')
      .select('campaign_id')
      .eq('id', eventId)
      .single();

    if (!event?.campaign_id) {
      throw new Error('Event or campaign not found');
    }

    // Update campaign status
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', event.campaign_id);

    if (campaignError) {
      throw new Error('Failed to cancel campaign');
    }

    // Update calendar event
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({ event_status: 'cancelled' })
      .eq('id', eventId);

    if (eventError) {
      throw new Error('Failed to update calendar event');
    }

    // Cancel pending send jobs
    const { error: jobError } = await supabase
      .from('send_jobs')
      .update({ status: 'cancelled' })
      .eq('campaign_id', event.campaign_id)
      .eq('status', 'pending');

    if (jobError) {
      console.warn('Failed to cancel send jobs:', jobError);
    }

    revalidatePath('/agency/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error in cancelEventAction:', error);
    throw error;
  }
}
