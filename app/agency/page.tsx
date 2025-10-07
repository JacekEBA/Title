import type { Metadata } from 'next';
import { getAgencyDaily } from '@/lib/agency';

export const metadata: Metadata = {
  title: 'Dashboard',
};

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default async function AgencyDashboardPage() {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now);
  
  const from = thirtyDaysAgo.toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const rows = await getAgencyDaily({ from, to });

  // Calculate totals
  const totals = {
    sent: sum(rows.map((r) => r.sent)),
    delivered: sum(rows.map((r) => r.delivered)),
    read: sum(rows.map((r) => r.read)),
    replied: sum(rows.map((r) => r.replied)),
  };

  return (
    <div className="page">
      <h1 className="page-title">Agency overview</h1>

      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-label">Messages sent</div>
          <div className="kpi-value">{formatNumber(totals.sent)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delivered</div>
          <div className="kpi-value">{formatNumber(totals.delivered)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Read</div>
          <div className="kpi-value">{formatNumber(totals.read)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Replies</div>
          <div className="kpi-value">{formatNumber(totals.replied)}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Last 30 days</h2>
        {/* Chart component would go here */}
        <div className="text-center py-12 text-gray-500">
          Chart visualization coming soon
        </div>
      </div>
    </div>
  );
}
