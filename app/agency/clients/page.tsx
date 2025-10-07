import type { Metadata } from 'next';
import Link from 'next/link';
import { getAccessibleOrgs } from '@/lib/agency';

export const metadata: Metadata = {
  title: 'Clients',
};

type Organization = {
  id: string;
  name: string;
  slug?: string | null;
};

export default async function ClientsPage() {
  const organizations = (await getAccessibleOrgs()) as Organization[];

  return (
    <div className="page">
      <h1 className="page-title">Clients</h1>
      
      {organizations.length === 0 ? (
        <div className="card">
          <p className="text-muted-foreground text-center py-8">
            No organizations yet.
          </p>
        </div>
      ) : (
        <div className="grid cards">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/org/${org.id}`}
              className="card client"
            >
              <div className="client-name">{org.name}</div>
              <div className="client-foot muted">Open client dashboard →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
