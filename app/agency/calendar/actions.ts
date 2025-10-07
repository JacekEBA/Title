// Add these functions to your existing actions.ts file

export async function updateEventTimeAction(eventId: string, newScheduledAt: string) {
  'use server';
  
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

    // Update campaign scheduled_at
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ scheduled_at: newScheduledAt })
      .eq('id', event.campaign_id);

    if (campaignError) {
      throw new Error('Failed to update campaign');
    }

    // Update calendar event times
    const { error: eventError } = await supabase
      .from('calendar_events')
      .update({
        start_time: newScheduledAt,
        end_time: newScheduledAt,
      })
      .eq('id', eventId);

    if (eventError) {
      throw new Error('Failed to update calendar event');
    }

    // Update send job run_at
    const { error: jobError } = await supabase
      .from('send_jobs')
      .update({ run_at: newScheduledAt })
      .eq('campaign_id', event.campaign_id)
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
  'use server';
  
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
