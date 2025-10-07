import '../../../styles/globals.css';
import { requireOrgAccess } from '../../../lib/auth';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function Page({ params }: { params: { orgId: string } }) {
  await requireOrgAccess(params.orgId);
  const supabase = createSupabaseServerClient();
  const { data: metrics } = await supabase
    .from('org_daily_metrics')
    .select('date, delivered_like, replies')
    .eq('org_id', params.orgId)
    .order('date', { ascending: true });
  const totals = (metrics ?? []).reduce(
    (acc, row) => ({
      delivered: acc.delivered + (row.delivered_like ?? 0),
      replies: acc.replies + (row.replies ?? 0),
    }),
    { delivered: 0, replies: 0 }
  );
  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn btn-primary">Dashboard</a>
        <a className="btn" href={`/org/${params.orgId}/calendar`}>
          Calendar
        </a>
        <a className="btn" href={`/org/${params.orgId}/courses`}>
          Courses
        </a>
        <a className="btn" href={`/org/${params.orgId}/inbox`}>
          Inbox
        </a>
        <a className="btn" href={`/org/${params.orgId}/settings`}>
          Settings
        </a>
      </div>
      <div className="row">
        <div className="card col">
          <h3>Total delivered-like</h3>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.delivered}</div>
        </div>
        <div className="card col">
          <h3>Total replies</h3>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.replies}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <a className="btn btn-primary" href={`/org/${params.orgId}/settings/verification`}>
          Verify RCS Brand
        </a>
      </div>
    </div>
  );
}
