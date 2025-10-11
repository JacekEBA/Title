import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyPinnacleSignature } from '@/lib/pinnacle';

export const runtime = 'nodejs';

type PinnacleEvent = {
  id?: string;
  event_id?: string;
  type: string;
  brand_id?: string;
  brand?: {
    id?: number;
    status?: string;
  };
  from?: {
    phone?: string;
  };
  message?: {
    id?: string;
  };
  text?: string;
  reason?: string;
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-pinnacle-signature') ??
      req.headers.get('X-Pinnacle-Signature');

    // Verify signature
    if (!verifyPinnacleSignature(rawBody, signature)) {
      console.error('Invalid Pinnacle signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: PinnacleEvent = JSON.parse(rawBody);
    const admin = createSupabaseAdminClient() as any;
    const now = new Date().toISOString();

    // Check for duplicate events
    const externalId =
      event.id ?? event.event_id ?? event.message?.id ?? null;
    if (externalId) {
      const { data: existing } = await admin
        .from('webhook_events')
        .select('id')
        .eq('external_event_id', externalId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true, deduped: true });
      }
    }

    // Find organization by brand_id
    let orgId: string | null = null;
    if (event.brand_id) {
      const { data: integration } = await admin
        .from('org_integrations')
        .select('org_id')
        .eq('brand_id', event.brand_id)
        .maybeSingle();

      orgId = integration?.org_id ?? null;
    }

    // Handle brand verification status changes
    if ((event.type === 'brand.verified' || event.type === 'brand.failed') && event.brand?.id) {
      const newStatus = event.type === 'brand.verified' ? 'verified' : 'failed';
      
      if (orgId) {
        // Update org_integrations
        await admin
          .from('org_integrations')
          .update({
            status: newStatus,
            updated_at: now,
          })
          .eq('org_id', orgId)
          .eq('brand_id', event.brand.id.toString());

        // Create inbox notification
        await admin.from('inbox_notifications').insert({
          org_id: orgId,
          notification_type: event.type === 'brand.verified' ? 'brand_verified' : 'brand_failed',
          title: event.type === 'brand.verified' 
            ? '✅ RCS Brand Verified!' 
            : '❌ RCS Brand Verification Failed',
          message: event.type === 'brand.verified'
            ? 'Your brand has been verified and you can now send RCS messages!'
            : `Brand verification failed. Reason: ${event.reason || 'Unknown'}`,
        });

        console.log(`Brand ${event.brand.id} status updated to ${newStatus} for org ${orgId}`);
      }
    }

    // Handle inbound messages - find or create contact
    let contactId: string | null = null;
    if (orgId && event.type?.startsWith('inbound') && event.from?.phone) {
      const phone = event.from.phone;

      // Try to find existing contact
      const { data: existingContact } = await admin
        .from('contacts')
        .select('id')
        .eq('org_id', orgId)
        .eq('phone', phone)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        // Create new contact
        const { data: newContact } = await admin
          .from('contacts')
          .insert({ org_id: orgId, phone })
          .select('id')
          .single();

        contactId = newContact?.id ?? null;
      }
    }

    // Find or create conversation
    let conversationId: string | null = null;
    let conversationUnread = 0;
    if (orgId && contactId) {
      const { data: existingConv } = await admin
        .from('conversations')
        .select('id, unread_count')
        .eq('org_id', orgId)
        .eq('contact_id', contactId)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
        conversationUnread = existingConv.unread_count ?? 0;
      } else {
        const { data: newConv } = await admin
          .from('conversations')
          .insert({
            org_id: orgId,
            contact_id: contactId,
            last_message_at: now,
            last_direction: 'inbound',
            unread_count: 0,
          })
          .select('id, unread_count')
          .single();

        conversationId = newConv?.id ?? null;
        conversationUnread = newConv?.unread_count ?? 0;
      }
    }

    // Process event based on type
    if (orgId) {
      // Handle inbound text messages
      if (event.type === 'inbound_text') {
        await admin.from('messages').insert({
          conversation_id: conversationId,
          org_id: orgId,
          course_id: null,
          contact_id: contactId,
          direction: 'inbound',
          kind: 'text',
          body: event.text ?? '',
          provider_message_id: event.message?.id ?? null,
          sent_at: now,
        });

        // Increment unread count
        if (conversationId) {
          await admin
            .from('conversations')
            .update({
              last_message_at: now,
              last_direction: 'inbound',
              unread_count: conversationUnread + 1,
            })
            .eq('id', conversationId);
        }
      }

      // Handle delivery status updates
      if (['delivered', 'read', 'clicked', 'failed'].includes(event.type)) {
        const updates: Record<string, any> = {};

        if (event.type === 'delivered') updates.delivered_at = now;
        if (event.type === 'read') updates.read_at = now;
        if (event.type === 'clicked') updates.first_click_at = now;
        if (event.type === 'failed') {
          updates.failure_reason = event.reason ?? 'unknown';
          updates.status = 'failed';
        }

        if (event.message?.id) {
          // Update message_sends
          await admin
            .from('message_sends')
            .update(updates)
            .eq('provider_message_id', event.message.id);

          // Update messages
          await admin
            .from('messages')
            .update(updates)
            .eq('provider_message_id', event.message.id);
        }
      }
    }

    // Store webhook event
    await admin.from('webhook_events').insert({
      org_id: orgId,
      course_id: null,
      event_type: event.type ?? 'unknown',
      external_event_id: externalId,
      pinnacle_message_id: event.message?.id ?? null,
      contact_phone: event.from?.phone ?? null,
      payload: event as any,
      received_at: now,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
