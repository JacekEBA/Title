import { NextResponse } from 'next/server';
import {
  createSupabaseAdminClient,
  getSupabaseServiceRoleKey,
} from '@/lib/supabase/server';
import { 
  sendRcsMessage, 
  sendSmsMessage, 
  batchCheckRcsCapability 
} from '@/lib/pinnacle';

export const runtime = 'nodejs';

type SendJob = {
  id: string;
  campaign_id: string;
  attempts: number;
  batch_number?: number;
  processed_contacts?: number;
  total_contacts?: number;
};

type Campaign = {
  id: string;
  org_id: string;
  course_id: string;
  template_id: string;
  audience_kind: string;
  audience_ref: string | null;
  name: string;
  drip_enabled?: boolean;
  drip_batch_size?: number;
  drip_interval_minutes?: number;
  courses?: {
    send_window_start?: string;
    send_window_end?: string;
    timezone?: string;
  };
};

type Contact = {
  id: string;
  phone: string;
};

export async function GET() {
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not configured.');
    return NextResponse.json({ 
      ok: false, 
      reason: 'service role key missing' 
    });
  }

  const admin = createSupabaseAdminClient(serviceRoleKey) as any;
  const nowIso = new Date().toISOString();

  try {
    // Claim pending jobs that are ready to run
    const { data: jobs, error: claimError } = await admin
      .from('send_jobs')
      .update({
        status: 'running',
        locked_at: nowIso,
      })
      .lte('run_at', nowIso)
      .eq('status', 'pending')
      .is('locked_at', null)
      .select('id, campaign_id, attempts, batch_number, processed_contacts, total_contacts')
      .order('run_at', { ascending: true })
      .limit(3);

    if (claimError) {
      console.error('Failed to claim jobs:', claimError);
      return NextResponse.json(
        { error: claimError.message },
        { status: 500 }
      );
    }

    const typedJobs = (jobs as SendJob[]) ?? [];

    // Process each job
    for (const job of typedJobs) {
      try {
        await processSendJob(admin, job);
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        await handleJobError(admin, job, error);
      }
    }

    return NextResponse.json({
      ok: true,
      claimed: typedJobs.length,
    });
  } catch (error) {
    console.error('Send job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function processSendJob(admin: any, job: SendJob): Promise<void> {
  console.log(`Processing job ${job.id}...`);

  // Get campaign details with course info for send window
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select(`
      id, org_id, course_id, template_id, audience_kind, audience_ref, name,
      drip_enabled, drip_batch_size, drip_interval_minutes,
      courses (send_window_start, send_window_end, timezone)
    `)
    .eq('id', job.campaign_id)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  const typedCampaign = campaign as Campaign;

  // Check if we're within send window
  const now = new Date();
  const course = typedCampaign.courses;
  
  if (course?.send_window_start && course?.send_window_end) {
    const timezone = course.timezone || 'America/New_York';
    
    // Get current time in course timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const localTime = formatter.format(now);
    const [currentHour, currentMinute] = localTime.split(':').map(Number);

    // Parse send window times
    const [startHour, startMinute] = course.send_window_start.split(':').map(Number);
    const [endHour, endMinute] = course.send_window_end.split(':').map(Number);

    // Convert to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      console.log(`Outside send window (${course.send_window_start}-${course.send_window_end}). Rescheduling...`);
      
      // Calculate next available send time
      const nextRun = new Date(now);
      nextRun.setHours(startHour, startMinute, 0, 0);
      
      // If the calculated time is in the past, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      await admin
        .from('send_jobs')
        .update({
          status: 'pending',
          run_at: nextRun.toISOString(),
          locked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`Rescheduled for ${nextRun.toISOString()}`);
      return;
    }
  }

  // Get template
  const { data: template, error: templateError } = await admin
    .from('rcs_templates')
    .select('code, fallback_sms_enabled, fallback_text')
    .eq('id', typedCampaign.template_id)
    .single();

  if (templateError) {
    throw templateError;
  }

  const rcsPayload = template?.code ?? {};
  const hasFallback = template?.fallback_sms_enabled ?? false;
  const fallbackText = template?.fallback_text ?? '';

  // Get all contacts for this campaign
  const allContacts = await getContactsForCampaign(admin, typedCampaign);

  if (allContacts.length === 0) {
    console.log(`No contacts found for campaign ${typedCampaign.id}`);
    await admin
      .from('send_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    return;
  }

  // DRIP CAMPAIGN LOGIC
  const isDripEnabled = typedCampaign.drip_enabled ?? false;
  const batchSize = typedCampaign.drip_batch_size ?? allContacts.length;
  const intervalMinutes = typedCampaign.drip_interval_minutes ?? 0;

  const batchNumber = job.batch_number ?? 0;
  const processedContacts = job.processed_contacts ?? 0;
  const totalContacts = job.total_contacts || allContacts.length;

  // Update total contacts on first batch
  if (batchNumber === 0 && !job.total_contacts) {
    await admin
      .from('send_jobs')
      .update({ total_contacts: allContacts.length })
      .eq('id', job.id);
  }

  // Determine which contacts to process in this batch
  let contactsToProcess: Contact[];
  
  if (!isDripEnabled) {
    // Send all at once
    contactsToProcess = allContacts;
    console.log(`Processing all ${allContacts.length} contacts at once`);
  } else {
    // Send in batches
    const startIndex = batchNumber * batchSize;
    const endIndex = Math.min(startIndex + batchSize, allContacts.length);
    contactsToProcess = allContacts.slice(startIndex, endIndex);
    
    console.log(`Drip batch ${batchNumber + 1}: processing contacts ${startIndex + 1}-${endIndex} of ${allContacts.length}`);
  }

  // Check RCS capability for contacts in this batch
  const phoneNumbers = contactsToProcess.map(c => c.phone);
  const rcsCapabilities = await batchCheckRcsCapability(phoneNumbers);

  console.log(
    `RCS capable: ${Array.from(rcsCapabilities.values()).filter(Boolean).length}/${contactsToProcess.length}`
  );

  // Send messages
  let successCount = 0;
  let failureCount = 0;

  for (const contact of contactsToProcess) {
    try {
      const isRcsCapable = rcsCapabilities.get(contact.phone) ?? false;
      
      let providerMessageId: string | null = null;
      let usedFallback = false;

      if (isRcsCapable) {
        // Try to send RCS message
        try {
          const result = await sendRcsMessage({
            orgId: typedCampaign.org_id,
            toPhoneE164: contact.phone,
            payload: rcsPayload,
          });
          providerMessageId = result.messageId?.toString() ?? null;
        } catch (rcsError) {
          console.error(`RCS send failed for ${contact.phone}:`, rcsError);
          
          // If RCS fails and fallback is enabled, send SMS
          if (hasFallback && fallbackText) {
            const smsResult = await sendSmsMessage({
              orgId: typedCampaign.org_id,
              toPhoneE164: contact.phone,
              text: fallbackText,
            });
            providerMessageId = smsResult.messageId?.toString() ?? null;
            usedFallback = true;
          } else {
            throw rcsError; // Re-throw if no fallback
          }
        }
      } else if (hasFallback && fallbackText) {
        // Not RCS capable, send SMS fallback
        const smsResult = await sendSmsMessage({
          orgId: typedCampaign.org_id,
          toPhoneE164: contact.phone,
          text: fallbackText,
        });
        providerMessageId = smsResult.messageId?.toString() ?? null;
        usedFallback = true;
      } else {
        // Skip: not RCS capable and no fallback configured
        console.log(`Skipping ${contact.phone}: not RCS capable, no fallback`);
        continue;
      }

      // Record successful send
      await admin.from('message_sends').insert({
        org_id: typedCampaign.org_id,
        course_id: typedCampaign.course_id,
        campaign_id: typedCampaign.id,
        contact_id: contact.id,
        provider_message_id: providerMessageId,
        status: 'sent',
        fallback_used: usedFallback,
        send_attempted_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      });

      successCount++;

    } catch (error) {
      console.error(`Failed to send to ${contact.phone}:`, error);
      
      // Record failed send
      await admin.from('message_sends').insert({
        org_id: typedCampaign.org_id,
        course_id: typedCampaign.course_id,
        campaign_id: typedCampaign.id,
        contact_id: contact.id,
        status: 'failed',
        failure_reason: error instanceof Error ? error.message : 'Unknown error',
        send_attempted_at: new Date().toISOString(),
      });

      failureCount++;
    }
  }

  const newProcessedCount = processedContacts + contactsToProcess.length;
  console.log(
    `Batch complete: ${successCount} sent, ${failureCount} failed. Total progress: ${newProcessedCount}/${totalContacts}`
  );

  // Determine next action
  const hasMoreContacts = newProcessedCount < totalContacts;
  
  if (isDripEnabled && hasMoreContacts) {
    // Schedule next batch
    const nextRunTime = new Date(Date.now() + intervalMinutes * 60 * 1000);
    
    await admin
      .from('send_jobs')
      .update({
        status: 'pending',
        batch_number: batchNumber + 1,
        processed_contacts: newProcessedCount,
        run_at: nextRunTime.toISOString(),
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`Scheduled next batch for ${nextRunTime.toISOString()}`);
  } else {
    // Campaign complete
    await admin
      .from('campaigns')
      .update({
        status: 'completed',
        send_completed_at: new Date().toISOString(),
      })
      .eq('id', typedCampaign.id);

    await admin
      .from('send_jobs')
      .update({ 
        status: 'completed',
        processed_contacts: newProcessedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`Campaign ${typedCampaign.id} completed!`);
  }
}

async function getContactsForCampaign(admin: any, campaign: Campaign): Promise<Contact[]> {
  let contacts: Contact[] = [];
  
  if (campaign.audience_kind === 'all_contacts') {
    // All contacts for this course
    const { data, error } = await admin
      .from('contacts')
      .select('id, phone')
      .eq('course_id', campaign.course_id)
      .eq('consent', 'opted_in')
      .is('opted_out_at', null)
      .is('deleted_at', null);
    
    if (error) throw error;
    contacts = data ?? [];
  } else if (campaign.audience_kind === 'contact_list') {
    // Specific contact list
    const { data, error } = await admin
      .from('contact_list_members')
      .select('contact_id, contacts(id, phone, consent, opted_out_at, deleted_at)')
      .eq('list_id', campaign.audience_ref);
    
    if (error) throw error;
    contacts = (data ?? [])
      .filter((m: any) => 
        m.contacts?.consent === 'opted_in' &&
        !m.contacts?.opted_out_at &&
        !m.contacts?.deleted_at
      )
      .map((m: any) => ({
        id: m.contacts.id,
        phone: m.contacts.phone,
      }));
  }

  return contacts;
}

async function handleJobError(
  admin: any, 
  job: SendJob, 
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const maxAttempts = 3;

  if (job.attempts < maxAttempts) {
    // Retry later
    await admin
      .from('send_jobs')
      .update({
        status: 'pending',
        attempts: job.attempts + 1,
        last_error: errorMessage,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  } else {
    // Mark as failed after max attempts
    await admin
      .from('send_jobs')
      .update({
        status: 'failed',
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}
