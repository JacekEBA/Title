import KpiCard from '@/components/KpiCard';
import Sparkline from '@/components/Sparkline';
import { getAgencyDaily } from '@/lib/agency';

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function fmt(value: number) {
  return value.toLocaleString();
}

export const metadata = { title: 'Agency • Dashboard' };

export default async function Page() {
  const daily = await getAgencyDaily();
  const lastSeven = daily.slice(-7);
  const sent = sum(daily.map((entry) => entry.sent));
  const delivered = sum(daily.map((entry) => entry.delivered));
  const read = sum(daily.map((entry) => entry.read));
  const replied = sum(daily.map((entry) => entry.replied));

  const lastSevenSent = lastSeven.map((entry) => entry.sent);
  const previousSevenSent = daily.slice(-14, -7).map((entry) => entry.sent);
  const previousTotal = sum(previousSevenSent);
  const currentTotal = sum(lastSevenSent);

  const delta = (() => {
    if (previousTotal === 0) return undefined;
    const pct = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    return Number.isFinite(pct) ? `${pct}%` : undefined;
  })();

  return (
    <div className="page">
      <h1 className="page-title">Agency overview</h1>

      <div className="grid kpis">
        <KpiCard label="Messages sent" value={fmt(sent)} delta={delta}>
          <Sparkline points={lastSevenSent} />
        </KpiCard>
        <KpiCard label="Delivered" value={fmt(delivered)} />
        <KpiCard label="Read" value={fmt(read)} />
        <KpiCard label="Replies" value={fmt(replied)} />
      </div>

      <div className="card">
        <h2 className="section-title">Recent activity</h2>
        <p className="muted">
          This section can include trends, top performing templates, and booking conversions.
          (Data source: agency_daily_metrics).
        </p>
      </div>
    </div>
  );
}

