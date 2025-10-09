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
};

type Campaign = {
  id: string;
  org_id: string;
  course_id: string;
  template_id: string;
  audience_kind: string;
  audience_ref: string | null;
  name: string;
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
      .select('id, campaign_id, attempts')
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

  // Get campaign details
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select(
      'id, org_id, course_id, template_id, audience_kind, audience_ref, name'
    )
    .eq('id', job.campaign_id)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  const typedCampaign = campaign as Campaign;

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

  // Get contacts based on audience
  let contacts: Contact[] = [];
  
  if (typedCampaign.audience_kind === 'all_contacts') {
    // All contacts for this course
    const { data, error } = await admin
      .from('contacts')
      .select('id, phone')
      .eq('course_id', typedCampaign.course_id)
      .eq('consent', 'opted_in')
      .is('opted_out_at', null)
      .is('deleted_at', null);
    
    if (error) throw error;
    contacts = data ?? [];
  } else if (typedCampaign.audience_kind === 'contact_list') {
    // Specific contact list
    const { data, error } = await admin
      .from('contact_list_members')
      .select('contact_id, contacts(id, phone, consent, opted_out_at, deleted_at)')
      .eq('list_id', typedCampaign.audience_ref);
    
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

  if (contacts.length === 0) {
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

  console.log(`Found ${contacts.length} contacts to message`);

  // STEP 1: Check RCS capability for all contacts
  const phoneNumbers = contacts.map(c => c.phone);
  const rcsCapabilities = await batchCheckRcsCapability(phoneNumbers);

  console.log(
    `RCS capable: ${Array.from(rcsCapabilities.values()).filter(Boolean).length}/${contacts.length}`
  );

  // STEP 2: Send messages (RCS where supported, SMS fallback where configured)
  let successCount = 0;
  let failureCount = 0;

  for (const contact of contacts) {
    try {
      const isRcsCapable = rcsCapabilities.get(contact.phone) ?? false;
      
      let providerMessageId: string | null = null;
      let usedFallback = false;

      if (isRcsCapable) {
        // Send RCS message
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

  console.log(
    `Job ${job.id} complete: ${successCount} sent, ${failureCount} failed`
  );

  // Mark campaign as completed
  await admin
    .from('campaigns')
    .update({
      status: 'completed',
      send_completed_at: new Date().toISOString(),
    })
    .eq('id', typedCampaign.id);

  // Mark job as completed
  await admin
    .from('send_jobs')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);
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
