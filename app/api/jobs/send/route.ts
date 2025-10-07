import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendRcsMessage } from '@/lib/pinnacle';

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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not configured. Skipping job run.');
    return NextResponse.json({ ok: false, reason: 'service role key missing' });
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  try {
    // Claim pending jobs
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
    .select('code')
    .eq('id', typedCampaign.template_id)
    .single();

  if (templateError) {
    throw templateError;
  }

  const payload = template?.code ?? { text: typedCampaign.name };

  // Get contacts
  const contacts = await getContacts(admin, typedCampaign);

  // Send to each contact
  for (const contact of contacts) {
    try {
      await sendToContact(admin, typedCampaign, contact, payload);
    } catch (error) {
      console.error(
        `Failed to send to contact ${contact.id}:`,
        error
      );
      // Continue with other contacts even if one fails
    }
  }

  // Mark job as completed
  await admin
    .from('send_jobs')
    .update({ status: 'completed' })
    .eq('id', job.id);

  // Mark campaign as completed
  await admin
    .from('campaigns')
    .update({
      status: 'completed',
      send_completed_at: new Date().toISOString(),
    })
    .eq('id', typedCampaign.id);
}

async function getContacts(
  admin: any,
  campaign: Campaign
): Promise<Contact[]> {
  if (campaign.audience_kind === 'contact_list' && campaign.audience_ref) {
    // Get contacts from specific list
    const { data: members, error } = await admin
      .from('contact_list_members')
      .select('contacts:contact_id(id, phone)')
      .eq('list_id', campaign.audience_ref);

    if (error) throw error;

    return (members ?? [])
      .map((row: any) => row.contacts)
      .filter((c: any): c is Contact => Boolean(c?.id && c?.phone));
  } else {
    // Get all contacts for the organization
    const { data: contacts, error } = await admin
      .from('contacts')
      .select('id, phone')
      .eq('org_id', campaign.org_id)
      .is('opted_out_at', null);

    if (error) throw error;

    return (contacts as Contact[]) ?? [];
  }
}

async function sendToContact(
  admin: any,
  campaign: Campaign,
  contact: Contact,
  payload: any
): Promise<void> {
  if (!contact.phone) return;

  // Find or create conversation
  const { data: existingConv } = await admin
    .from('conversations')
    .select('id')
    .eq('org_id', campaign.org_id)
    .eq('contact_id', contact.id)
    .maybeSingle();

  let conversationId = existingConv?.id ?? null;

  if (!conversationId) {
    const { data: newConv, error: convError } = await admin
      .from('conversations')
      .insert({
        org_id: campaign.org_id,
        course_id: campaign.course_id,
        contact_id: contact.id,
        last_message_at: new Date().toISOString(),
        last_direction: 'outbound',
      })
      .select('id')
      .single();

    if (convError) throw convError;
    conversationId = newConv.id;
  }

  // Send RCS message
  const response = await sendRcsMessage({
    orgId: campaign.org_id,
    toPhoneE164: contact.phone,
    payload,
  });

  // Extract body text
  const bodyText =
    typeof payload?.text === 'string' ? payload.text : campaign.name;

  // Store message
  await admin.from('messages').insert({
    conversation_id: conversationId,
    org_id: campaign.org_id,
    course_id: campaign.course_id,
    contact_id: contact.id,
    direction: 'outbound',
    kind: 'text',
    body: bodyText,
    provider_message_id: response?.message_id ?? null,
    sent_at: new Date().toISOString(),
  });

  // Update conversation
  await admin
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_direction: 'outbound',
      unread_count: 0,
    })
    .eq('id', conversationId);

  // Record message send
  await admin.from('message_sends').insert({
    org_id: campaign.org_id,
    course_id: campaign.course_id,
    campaign_id: campaign.id,
    contact_id: contact.id,
    provider_message_id: response?.message_id ?? null,
    status: 'sent',
    sent_at: new Date().toISOString(),
    conversation_id: conversationId,
  });
}

async function handleJobError(
  admin: any,
  job: SendJob,
  error: unknown
): Promise<void> {
  const errorMessage =
    error instanceof Error ? error.message : String(error);

  await admin
    .from('send_jobs')
    .update({
      status: 'retrying',
      attempts: (job.attempts ?? 0) + 1,
      last_error: errorMessage,
      locked_at: null,
    })
    .eq('id', job.id);
}
