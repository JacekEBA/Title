import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/server';
import { sendRcsMessage } from '../../../../lib/pinnacle';

export const runtime = 'nodejs';

export async function GET() {
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const claim = await admin
    .from('send_jobs')
    .update({ status: 'running', locked_at: new Date().toISOString() })
    .lte('run_at', nowIso)
    .eq('status', 'pending')
    .is('locked_at', null)
    .select('id, campaign_id, attempts')
    .order('run_at', { ascending: true })
    .limit(3);

  if (claim.error) {
    return NextResponse.json({ error: claim.error.message }, { status: 500 });
  }

  for (const job of claim.data ?? []) {
    try {
      const campaign = await admin
        .from('campaigns')
        .select(
          'id, org_id, course_id, template_id, audience_kind, audience_ref, name, scheduled_at'
        )
        .eq('id', job.campaign_id)
        .single();
      if (campaign.error || !campaign.data) {
        throw new Error('Campaign missing');
      }

      const template = await admin
        .from('rcs_templates')
        .select('code')
        .eq('id', campaign.data.template_id)
        .single();
      if (template.error) throw template.error;
      const payload = template.data?.code ?? { text: campaign.data.name };

      let contacts: { id: string; phone: string }[] = [];
      if (campaign.data.audience_kind === 'contact_list' && campaign.data.audience_ref) {
        const contactList = await admin
          .from('contact_list_members')
          .select('contacts:contact_id(id, phone)')
          .eq('list_id', campaign.data.audience_ref);
        if (contactList.error) throw contactList.error;
        contacts = (contactList.data ?? [])
          .map((row: any) => row.contacts)
          .filter((row: any): row is { id: string; phone: string } => Boolean(row));
      } else {
        const allContacts = await admin
          .from('contacts')
          .select('id, phone')
          .eq('org_id', campaign.data.org_id)
          .is('opted_out_at', null);
        if (allContacts.error) throw allContacts.error;
        contacts = allContacts.data ?? [];
      }

      for (const contact of contacts) {
        if (!contact.phone) continue;
        const existingConversation = await admin
          .from('conversations')
          .select('id')
          .eq('org_id', campaign.data.org_id)
          .eq('contact_id', contact.id)
          .maybeSingle();
        let conversationId = existingConversation.data?.id ?? null;
        if (!conversationId) {
          const insertedConversation = await admin
            .from('conversations')
            .insert({
              org_id: campaign.data.org_id,
              course_id: campaign.data.course_id,
              contact_id: contact.id,
              last_message_at: new Date().toISOString(),
              last_direction: 'outbound',
            })
            .select('id')
            .single();
          if (insertedConversation.error) throw insertedConversation.error;
          conversationId = insertedConversation.data.id;
        }

        const response = await sendRcsMessage({
          orgId: campaign.data.org_id,
          toPhoneE164: contact.phone,
          payload,
        });

        const bodyText = typeof payload?.text === 'string' ? payload.text : campaign.data.name;
        await admin.from('messages').insert({
          conversation_id: conversationId,
          org_id: campaign.data.org_id,
          course_id: campaign.data.course_id,
          contact_id: contact.id,
          direction: 'outbound',
          kind: 'text',
          body: bodyText,
          provider_message_id: response?.message_id ?? null,
          sent_at: new Date().toISOString(),
        });

        await admin
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_direction: 'outbound',
            unread_count: 0,
          })
          .eq('id', conversationId);

        await admin.from('message_sends').insert({
          org_id: campaign.data.org_id,
          course_id: campaign.data.course_id,
          campaign_id: campaign.data.id,
          contact_id: contact.id,
          provider_message_id: response?.message_id ?? null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          conversation_id: conversationId,
        });
      }

      await admin.from('send_jobs').update({ status: 'completed' }).eq('id', job.id);
      await admin
        .from('campaigns')
        .update({ status: 'completed', send_completed_at: new Date().toISOString() })
        .eq('id', campaign.data.id);
    } catch (error: any) {
      await admin
        .from('send_jobs')
        .update({
          status: 'retrying',
          attempts: (job.attempts ?? 0) + 1,
          last_error: String(error?.message ?? error),
          locked_at: null,
        })
        .eq('id', job.id);
    }
  }

  return NextResponse.json({ ok: true, claimed: claim.data?.length ?? 0 });
}
