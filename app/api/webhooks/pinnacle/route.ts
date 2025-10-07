import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/server';
import { verifyPinnacleSignature } from '../../../../lib/pinnacle';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-pinnacle-signature') ?? req.headers.get('X-Pinnacle-Signature');
  if (!verifyPinnacleSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const admin = createSupabaseAdminClient();

  const externalId = event.id ?? event.event_id ?? event.message?.id ?? null;
  if (externalId) {
    const existing = await admin
      .from('webhook_events')
      .select('id')
      .eq('external_event_id', externalId)
      .maybeSingle();
    if (existing.data) {
      return NextResponse.json({ ok: true, deduped: true });
    }
  }

  let orgId: string | null = null;
  if (event.brand_id) {
    const integration = await admin
      .from('org_integrations')
      .select('org_id')
      .eq('brand_id', event.brand_id)
      .maybeSingle();
    orgId = integration.data?.org_id ?? null;
  }

  let contactId: string | null = null;
  if (orgId && event.type?.startsWith('inbound') && event.from?.phone) {
    const phone = event.from.phone;
    const existing = await admin
      .from('contacts')
      .select('id')
      .eq('org_id', orgId)
      .eq('phone', phone)
      .maybeSingle();
    if (existing.data) {
      contactId = existing.data.id;
    } else {
      const inserted = await admin
        .from('contacts')
        .insert({ org_id: orgId, phone })
        .select('id')
        .single();
      contactId = inserted.data?.id ?? null;
    }
  }

  let conversationId: string | null = null;
  let conversationUnread = 0;
  if (orgId && contactId) {
    const existing = await admin
      .from('conversations')
      .select('id, unread_count')
      .eq('org_id', orgId)
      .eq('contact_id', contactId)
      .maybeSingle();
    if (existing.data) {
      conversationId = existing.data.id;
      conversationUnread = existing.data.unread_count ?? 0;
    } else {
      const inserted = await admin
        .from('conversations')
        .insert({
          org_id: orgId,
          contact_id: contactId,
          last_message_at: new Date().toISOString(),
          last_direction: 'inbound',
          unread_count: 0,
        })
        .select('id, unread_count')
        .single();
      conversationId = inserted.data?.id ?? null;
      conversationUnread = inserted.data?.unread_count ?? 0;
    }
  }

  if (orgId) {
    if (event.type === 'inbound_text') {
      await admin.from('messages').insert({
        conversation_id: conversationId,
        org_id: orgId,
        course_id: null,
        contact_id: contactId,
        direction: 'inbound',
        kind: 'text',
        body: event.text,
        provider_message_id: event.message?.id ?? null,
        sent_at: new Date().toISOString(),
      });
      if (conversationId) {
        await admin
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_direction: 'inbound',
            unread_count: conversationUnread + 1,
          })
          .eq('id', conversationId);
      }
    }

    if (['delivered', 'read', 'clicked', 'failed'].includes(event.type)) {
      const updates: Record<string, any> = {};
      const now = new Date().toISOString();
      if (event.type === 'delivered') updates.delivered_at = now;
      if (event.type === 'read') updates.read_at = now;
      if (event.type === 'clicked') updates.first_click_at = now;
      if (event.type === 'failed') {
        updates.failure_reason = event.reason ?? 'unknown';
        updates.status = 'failed';
      }
      if (event.message?.id) {
        await admin.from('message_sends').update(updates).eq('provider_message_id', event.message.id);
        await admin.from('messages').update(updates).eq('provider_message_id', event.message.id);
      }
    }
  }

  await admin.from('webhook_events').insert({
    org_id: orgId,
    course_id: null,
    event_type: event.type ?? 'inbound_text',
    external_event_id: externalId,
    pinnacle_message_id: event.message?.id ?? null,
    contact_phone: event.from?.phone ?? null,
    payload: event,
    received_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
