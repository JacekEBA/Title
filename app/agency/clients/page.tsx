import Link from 'next/link';

import { getOrgDailyFor, getOwnerOrgs } from '@/lib/agency';

type OrgAggregate = {
  sent: number;
  replies: number;
  bookings: number;
  lastDate?: string;
};

function fmt(value: number) {
  return value.toLocaleString();
}

export const metadata = { title: 'Agency • Clients' };

export default async function Page() {
  const orgs = await getOwnerOrgs();
  const orgIds = orgs.map((org) => org.id);
  const metrics = await getOrgDailyFor(orgIds);

  const byOrg = new Map<string, OrgAggregate>();

  for (const metric of metrics) {
    const existing: OrgAggregate = byOrg.get(metric.org_id) ?? {
      sent: 0,
      replies: 0,
      bookings: 0,
      lastDate: undefined,
    };

    existing.sent += metric.sent ?? 0;
    existing.replies += metric.replied ?? 0;
    existing.bookings += metric.bookings ?? 0;
    if (metric.date) {
      existing.lastDate =
        existing.lastDate && existing.lastDate > metric.date ? existing.lastDate : metric.date;
    }

    byOrg.set(metric.org_id, existing);
  }

  return (
    <div className="page">
      <h1 className="page-title">Clients</h1>
      <div className="grid cards">
        {orgs.map((org) => {
          const aggregate = byOrg.get(org.id) ?? {
            sent: 0,
            replies: 0,
            bookings: 0,
            lastDate: undefined,
          };

          return (
            <Link key={org.id} href={`/org/${org.id}`} className="card client">
              <div className="client-name">{org.name}</div>
              <div className="client-kpis">
                <div>
                  <span className="k">{fmt(aggregate.sent)}</span>
                  <span className="l">sent (30d)</span>
                </div>
                <div>
                  <span className="k">{fmt(aggregate.replies)}</span>
                  <span className="l">replies (30d)</span>
                </div>
                <div>
                  <span className="k">{fmt(aggregate.bookings)}</span>
                  <span className="l">bookings (30d)</span>
                </div>
              </div>
              <div className="client-foot muted">Last activity {aggregate.lastDate ?? '—'}</div>
            </Link>
          );
        })}

        {!orgs.length && (
          <div className="card">
            <div className="muted">No organizations yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

