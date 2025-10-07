import Link from 'next/link';
import { requireOrgAccess } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import OrgNav from '@/components/OrgNav';

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

export default async function OrgDashboardPage({ params }: Params) {
  await requireOrgAccess(params.orgId);
  
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
    <div className="container">
      <OrgNav orgId={params.orgId} currentPath="dashboard" />

      <h1 className="text-2xl font-bold mb-6">Organization Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Total Delivered
          </h2>
          <div className="text-3xl font-bold">{totals.delivered.toLocaleString()}</div>
        </div>
        
        <div className="card">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Total Replies
          </h2>
          <div className="text-3xl font-bold">{totals.replies.toLocaleString()}</div>
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
    </div>
  );
}
