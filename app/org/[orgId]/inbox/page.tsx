import { createSupabaseServerClient } from '@/lib/supabase/server';
import ConversationList from '@/components/ConversationList';

type Params = {
  params: {
    orgId: string;
  };
};

type Conversation = {
  id: string;
  org_id: string;
  last_message_at: string;
  unread_count: number;
};

export default async function OrgInboxPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, org_id, last_message_at, unread_count')
    .eq('org_id', params.orgId)
    .order('last_message_at', { ascending: false })
    .limit(50);

  const conversations = (data as Conversation[]) ?? [];

  return (
    <div className="page">
      <h1 className="page-title">Conversations</h1>

      <div className="card">
        {conversations.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No conversations yet. Messages will appear here when customers reply
            to your campaigns.
          </p>
        ) : (
          <ConversationList items={conversations} />
        )}
      </div>
    </div>
  );
}
