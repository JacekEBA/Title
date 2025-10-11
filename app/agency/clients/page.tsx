// app/agency/clients/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Clients',
};

type Organization = {
  id: string;
  name: string;
  slug?: string | null;
};

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();
  
  let organizations: Organization[] = [];

  // If user is owner or agency_staff, get ALL organizations
  if (profile?.role === 'owner' || profile?.role === 'agency_staff') {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching organizations:', error);
    } else {
      organizations = data || [];
    }
  }

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
