import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { requireOrgAccess } from '@/lib/auth';
import InviteMemberForm from './InviteMemberForm';
import { signOutAction } from './actions';
import SignOutButton from './SignOutButton';

export const metadata: Metadata = {
  title: 'Settings',
};

type Params = {
  params: {
    orgId: string;
  };
};

type OrgMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    user_id: string;
  } | null;
};

export default async function OrgSettingsPage({ params }: Params) {
  const { orgId } = params;
  await requireOrgAccess(orgId);

  const supabase = createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get current user's membership role in this org
  const { data: currentMembership } = await supabase
    .from('org_memberships')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user?.id)
    .single();

  const isClientAdmin = currentMembership?.role === 'client_admin';

  // Get all members of this org (only if client_admin)
  let members: OrgMember[] = [];
  if (isClientAdmin) {
    const { data } = await supabase
      .from('org_memberships')
      .select('id, user_id, role, created_at, profiles:user_id(full_name, user_id)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });
    
    members = (data as OrgMember[] | null) ?? [];
  }

  // Get user emails for display
  const memberEmails: Record<string, string> = {};
  if (isClientAdmin && members.length > 0) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    users?.forEach((u: User) => {
      if (u.id && u.email) {
        memberEmails[u.id] = u.email;
      }
    });
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <div className="space-y-6">
        {/* Team Members Section - Only for client_admin */}
        {isClientAdmin && (
          <div className="card">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold">Team Members</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Invite team members to access this organization. Admins can manage settings and invite others, while viewers have read-only access.
              </p>
            </div>

            {/* Invite Form */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-medium mb-3">Invite New Member</h3>
              <InviteMemberForm orgId={orgId} />
            </div>

            {/* Members List */}
            <div>
              <h3 className="font-medium mb-3">Current Members</h3>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.profiles?.full_name || memberEmails[member.user_id] || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {memberEmails[member.user_id] || 'No email'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === 'client_admin' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {member.role === 'client_admin' ? 'Admin' : 'Viewer'}
                        </span>
                        {member.user_id === user?.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RCS Brand Verification */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">RCS Brand Verification</h2>
          <p className="text-muted-foreground mb-4">
            Verify your brand to send RCS messages to customers.
          </p>
          <Link
            href={`/org/${orgId}/settings/verification`}
            className="btn btn-primary"
          >
            Start Verification Process
          </Link>
        </div>

        {/* Organization Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Organization Details</h2>
          <p className="text-muted-foreground">
            Contact your agency administrator to update organization settings.
          </p>
        </div>

        {/* Account Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Sign out</h3>
              <p className="text-sm text-muted-foreground">
                Sign out of your account.
              </p>
            </div>
            <form action={signOutAction}>
              <SignOutButton />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
