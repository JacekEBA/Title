import { getAgencyDaily } from '@/lib/agency';
import KpiCard from '@/components/KpiCard';
import AgencyLineChart from '@/components/AgencyLineChart';

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
function fmt(n: number) {
  return n.toLocaleString();
}

export const metadata = { title: 'Agency • Dashboard' };

export default async function Page() {
  const now = Date.now();
  const from = new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const to = new Date(now).toISOString().slice(0, 10);

  const rows = await getAgencyDaily({ from, to });

  const sent = sum(rows.map((r) => r.sent));
  const delivered = sum(rows.map((r) => r.delivered));
  const read = sum(rows.map((r) => r.read));
  const replied = sum(rows.map((r) => r.replied));

  return (
    <div className="page">
      <h1 className="page-title">Agency overview</h1>

      <div className="grid kpis">
        <KpiCard label="Messages sent" value={fmt(sent)} />
        <KpiCard label="Delivered" value={fmt(delivered)} />
        <KpiCard label="Read" value={fmt(read)} />
        <KpiCard label="Replies" value={fmt(replied)} />
      </div>

      <div className="card">
        <h2 className="section-title">Last 30 days</h2>
        <AgencyLineChart rows={rows} />
      </div>
    </div>
  );
}
