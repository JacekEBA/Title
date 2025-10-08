import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = {
  params: {
    orgId: string;
  };
};

type MetricRow = {
  date: string;
  delivered_like: number | null;
  replies: number | null;
};

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default async function OrgDashboardPage({ params }: Params) {
  const supabase = createSupabaseServerClient();
  
  const { data: metrics } = await supabase
    .from('org_daily_metrics')
    .select('date, delivered_like, replies')
    .eq('org_id', params.orgId)
    .order('date', { ascending: true });

  const typedMetrics = (metrics as MetricRow[]) ?? [];
  
  const totals = typedMetrics.reduce(
    (acc, row) => ({
      delivered: acc.delivered + (row.delivered_like ?? 0),
      replies: acc.replies + (row.replies ?? 0),
    }),
    { delivered: 0, replies: 0 }
  );

  return (
    <div className="page">
      <h1 className="page-title">Dashboard overview</h1>

      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Delivered</div>
          <div className="kpi-value">{formatNumber(totals.delivered)}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-label">Total Replies</div>
          <div className="kpi-value">{formatNumber(totals.replies)}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="flex gap-3">
          <Link
            href={`/org/${params.orgId}/settings/verification`}
            className="btn btn-primary"
          >
            Verify RCS Brand
          </Link>
          <Link
            href={`/org/${params.orgId}/inbox`}
            className="btn"
          >
            View Inbox
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          Chart visualization coming soon
        </div>
      </div>
    </div>
  );
}
