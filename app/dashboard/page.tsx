import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Organization = {
  id: string;
  name: string;
};

type Membership = {
  org_id: string;
  role: string;
  organizations: Organization | null;
};

/**
 * Organization chooser + landing router.
 *
 * If ?pickOrg=1 is present, always show chooser.
 *
 * Otherwise:
 * - owner/agency_staff -> /agency
 * - exactly one org -> /org/[orgId]
 * - else -> show chooser
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const forcePick = String(searchParams?.pickOrg ?? '') === '1';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .maybeSingle();

  const { data: memberships } = await supabase
    .from('org_memberships')
    .select('org_id, role, organizations:org_id(id, name)')
    .order('created_at', { ascending: true });

  // Type assertion to help TypeScript understand the structure
  const typedMemberships = (memberships as Membership[] | null) ?? [];
  const roles = typedMemberships.map((m) => m.role);

  // Redirect logic
  if (!forcePick) {
    if (
      profile?.role === 'owner' ||
      roles.includes('owner') ||
      roles.includes('agency_staff')
    ) {
      redirect('/agency');
    }

    if (typedMemberships.length === 1) {
      const membership = typedMemberships[0];
      if (membership?.org_id) {
        redirect(`/org/${membership.org_id}`);
      }
    }
  }

  // Extract organizations
  const organizations = typedMemberships
    .map((m) => m.organizations)
    .filter((org): org is Organization => Boolean(org));

  return (
    <div className="container">
      <div className="card mx-auto mt-16 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Select an organization</h1>
        <p className="text-muted-foreground mb-6">
          Choose which client dashboard you want to open.
        </p>

        {organizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No organizations yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/org/${org.id}`}
                className="card flex items-center justify-between hover:border-primary transition-colors"
              >
                <strong className="text-lg">{org.name}</strong>
                <span className="btn btn-primary">Open</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <Link href="/agency" className="btn">
            Go to Agency view
          </Link>
        </div>
      </div>
    </div>
  );
}
