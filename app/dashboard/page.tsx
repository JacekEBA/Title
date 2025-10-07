import '../../styles/globals.css';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase/server';

/**
 * Org chooser + landing router.
 *
 * If ?pickOrg=1 is present, always show chooser.
 *
 * Otherwise:
 *
 * owner/agency_staff -> /agency
 *
 * exactly one org -> /org/[orgId]
 *
 * else -> show chooser
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const forcePick = String(searchParams?.pickOrg ?? '') === '1';

  const { data: profile } = await supabase.from('profiles').select('role').maybeSingle();
  const { data: mems } = await supabase
    .from('org_memberships')
    .select('org_id, role, organizations:org_id(id, name)')
    .order('created_at', { ascending: true });

  const roles = (mems ?? []).map((m) => m.role);
  if (!forcePick) {
    if (profile?.role === 'owner' || roles.includes('owner') || roles.includes('agency_staff')) {
      redirect('/agency');
    }
    if ((mems ?? []).length === 1) {
      const membership = mems?.[0];
      if (membership) {
        redirect(`/org/${membership.org_id}`);
      }
    }
  }

  const orgs = (mems ?? [])
    .map((m) => m.organizations)
    .filter(Boolean) as { id: string; name: string }[];

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720, margin: '60px auto' }}>
        <h2>Select an organization</h2>
        <p>Choose which client dashboard you want to open.</p>
        <div className="row" style={{ marginTop: 12 }}>
          {orgs.length === 0 && <div>No organizations yet.</div>}
          {orgs.map((o) => (
            <div className="card col" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{o.name}</strong>
                <a className="btn btn-primary" href={`/org/${o.id}`}>
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <a className="btn" href="/agency">
            Go to Agency view
          </a>
        </div>
      </div>
    </div>
  );
}
