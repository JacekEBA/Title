import type { Metadata } from 'next';
import { getAgencyDaily } from '@/lib/agency';
import KpiCard from '@/components/KpiCard';
import AgencyLineChart from '@/components/AgencyLineChart';

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
        <KpiCard label="Messages sent" value={formatNumber(totals.sent)} />
        <KpiCard label="Delivered" value={formatNumber(totals.delivered)} />
        <KpiCard label="Read" value={formatNumber(totals.read)} />
        <KpiCard label="Replies" value={formatNumber(totals.replied)} />
      </div>

      <div className="card mt-6">
        <h2 className="section-title">Last 30 days</h2>
        <AgencyLineChart rows={rows} />
      </div>
    </div>
  );
}
