import { ReactNode } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireOrgAccess, getCurrentProfile } from '@/lib/auth';
import OrgSidebar from '@/components/OrgSidebar';

type Props = {
  children: ReactNode;
  params: {
    orgId: string;
  };
};

export default async function OrgLayout({ children, params }: Props) {
  await requireOrgAccess(params.orgId);
  
  // Get current user profile to check if owner
  const profile = await getCurrentProfile();
  const isOwner = profile?.role === 'owner';
  
  // Fetch organization name
  const supabase = createSupabaseServerClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', params.orgId)
    .single();

  const orgName = org?.name || 'Client Dashboard';

  return (
    <div className="shell">
      <OrgSidebar orgId={params.orgId} orgName={orgName} isOwner={isOwner} />
      <main className="content">{children}</main>
    </div>
  );
}
