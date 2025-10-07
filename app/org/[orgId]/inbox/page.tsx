import '../../../../styles/globals.css';
import ConversationList from '../../../../components/ConversationList';
import { requireOrgAccess } from '../../../../lib/auth';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export default async function Page({ params }: { params: { orgId: string } }) {
  await requireOrgAccess(params.orgId);
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, org_id, last_message_at, unread_count')
    .eq('org_id', params.orgId)
    .order('last_message_at', { ascending: false })
    .limit(50);
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
        <a className="btn btn-primary">Inbox</a>
        <a className="btn" href={`/org/${params.orgId}/settings`}>
          Settings
        </a>
      </div>
      <h2>Conversations</h2>
      <ConversationList items={data ?? []} />
    </div>
  );
}
