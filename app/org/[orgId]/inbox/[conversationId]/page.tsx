import { requireOrgAccess } from '@/lib/auth';
import { sendRcsMessage } from '@/lib/pinnacle';
import {
  createSupabaseServerClient,
  createSupabaseActionClient,
} from '@/lib/supabase/server';
import OrgNav from '@/components/OrgNav';
import ChatThread from '@/components/ChatThread';
import MessageComposer from '@/components/MessageComposer';

type Params = {
  params: {
    orgId: string;
    conversationId: string;
  };
};

type Message = {
  id: string;
  direction: string;
  body: string | null;
  created_at: string;
};

export default async function ConversationPage({ params }: Params) {
  await requireOrgAccess(params.orgId);

  const supabase = createSupabaseServerClient();
  const conversationId = params.conversationId;

  const { data: messages } = await supabase
    .from('messages')
    .select('id, direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const typedMessages = (messages as Message[]) ?? [];

  async function sendMessageAction(formData: FormData) {
    'use server';

    const supa = createSupabaseActionClient();
    const conversationId = String(formData.get('conversation_id'));
    const body = String(formData.get('body') || '');

    if (!body.trim()) {
      throw new Error('Message body is required');
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supa
      .from('conversations')
      .select('id, org_id, course_id, contact_id, contacts:contact_id(phone)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Insert message into database
    const { error: messageError } = await supa
      .from('messages')
      .insert({
        conversation_id: conversationId,
        org_id: conversation.org_id,
        course_id: conversation.course_id,
        contact_id: conversation.contact_id,
        direction: 'outbound',
        kind: 'text',
        body,
      })
      .select('id')
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update conversation
    await supa
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_direction: 'outbound',
        unread_count: 0,
      })
      .eq('id', conversationId);

    // Send via RCS
    const phone = (conversation.contacts as any)?.phone;
    if (!phone) {
      throw new Error('Contact phone missing');
    }

    const result = await sendRcsMessage({
      orgId: conversation.org_id,
      toPhoneE164: phone,
      payload: { text: body },
    });

    // Record the send
    await supa.from('message_sends').insert({
      org_id: conversation.org_id,
      course_id: conversation.course_id,
      campaign_id: null,
      contact_id: conversation.contact_id,
      provider_message_id: result?.message_id ?? null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      conversation_id: conversationId,
    });
  }

  return (
    <div className="container">
      <OrgNav orgId={params.orgId} currentPath="inbox" />

      <h1 className="text-2xl font-bold mb-6">Conversation</h1>

      <div className="space-y-4">
        <div className="card">
          <ChatThread
            conversationId={conversationId}
            initialMessages={typedMessages}
          />
        </div>

        <div className="card">
          <MessageComposer conversationId={conversationId} action={sendMessageAction} />
        </div>
      </div>
    </div>
  );
}
