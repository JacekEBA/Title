import '../../../../../styles/globals.css';
import ChatThread from '../../../../../components/ChatThread';
import MessageComposer from '../../../../../components/MessageComposer';
import { requireOrgAccess } from '../../../../../lib/auth';
import { sendRcsMessage } from '../../../../../lib/pinnacle';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server';

export default async function Page({
  params,
}: {
  params: { orgId: string; conversationId: string };
}) {
  await requireOrgAccess(params.orgId);
  const supabase = createSupabaseServerClient();
  const { data: messages } = await supabase
    .from('messages')
    .select('id, direction, body, created_at')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true });

  async function sendMessageAction(formData: FormData) {
    'use server';
    const supa = createSupabaseServerClient();
    const conversationId = String(formData.get('conversation_id'));
    const body = String(formData.get('body') || '');

    const convRow = await supa
      .from('conversations')
      .select('id, org_id, course_id, contact_id, contacts:contact_id(phone)')
      .eq('id', conversationId)
      .single();
    if (convRow.error || !convRow.data) throw new Error('Conversation not found');

    const message = await supa
      .from('messages')
      .insert({
        conversation_id: conversationId,
        org_id: convRow.data.org_id,
        course_id: convRow.data.course_id,
        contact_id: convRow.data.contact_id,
        direction: 'outbound',
        kind: 'text',
        body,
      })
      .select('id')
      .single();
    if (message.error) throw message.error;

    await supa
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_direction: 'outbound',
        unread_count: 0,
      })
      .eq('id', conversationId);

    const phone = convRow.data.contacts?.phone;
    if (!phone) throw new Error('Contact phone missing');

    const result = await sendRcsMessage({
      orgId: convRow.data.org_id,
      toPhoneE164: phone,
      payload: { text: body },
    });

    await supa.from('message_sends').insert({
      org_id: convRow.data.org_id,
      course_id: convRow.data.course_id,
      campaign_id: null,
      contact_id: convRow.data.contact_id,
      provider_message_id: result?.message_id ?? null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      conversation_id: conversationId,
    });
  }

  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href={`/org/${params.orgId}`}>
          Dashboard
        </a>
        <a className="btn" href={`/org/${params.orgId}/calendar`}>
          Calendar
        </a>
        <a className="btn" href={`/org/${params.orgId}/courses`}>
          Courses
        </a>
        <a className="btn btn-primary" href={`/org/${params.orgId}/inbox`}>
          Inbox
        </a>
        <a className="btn" href={`/org/${params.orgId}/settings`}>
          Settings
        </a>
      </div>
      <h2>Conversation</h2>
      <ChatThread conversationId={params.conversationId} initialMessages={messages ?? []} />
      <MessageComposer conversationId={params.conversationId} action={sendMessageAction} />
    </div>
  );
}
