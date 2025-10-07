import Link from 'next/link';
import { getAccessibleOrgs } from '@/lib/agency';

export const metadata = { title: 'Agency • Clients' };

export default async function Page() {
  const orgs = await getAccessibleOrgs();

  return (
    <div className="page">
      <h1 className="page-title">Clients</h1>
      <div className="grid cards">
        {orgs.map((org) => (
          <Link key={org.id} href={`/org/${org.id}`} className="card client">
            <div className="client-name">{org.name}</div>
            <div className="client-foot muted">Open client dashboard →</div>
          </Link>
        ))}
        {!orgs.length && (
          <div className="card">
            <div className="muted">No organizations yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
