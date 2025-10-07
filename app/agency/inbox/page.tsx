import '../../../styles/globals.css';
import ConversationList from '../../../components/ConversationList';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, org_id, last_message_at, unread_count')
    .order('last_message_at', { ascending: false })
    .limit(50);
  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href="/agency/calendar">
          Calendar
        </a>
        <a className="btn" href="/agency/clients">
          Clients
        </a>
        <a className="btn" href="/agency/analytics">
          Analytics
        </a>
        <a className="btn btn-primary">Inbox</a>
        <a className="btn" href="/agency/settings">
          Settings
        </a>
      </div>
      <h2>All Conversations</h2>
      <ConversationList items={data ?? []} />
    </div>
  );
}
