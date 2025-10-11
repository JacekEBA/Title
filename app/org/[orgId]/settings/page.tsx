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

type PendingInvite = {
  id: string;
  email: string;
  role: 'client_admin' | 'client_viewer';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  created_at: string;
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
  const { data: membersData } = await supabase
    .from('org_memberships')
    .select('id, user_id, role, created_at, profiles:user_id(full_name, user_id)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  const members = (membersData as OrgMember[] | null) ?? [];

  // Get user emails for display
  const memberEmails: Record<string, string> = {};
  if (user?.id && user.email) {
    memberEmails[user.id] = user.email;
  }
  let pendingInvites: PendingInvite[] = [];

  if (isClientAdmin && members.length > 0) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    users?.forEach((u: User) => {
      if (u.id && u.email) {
        memberEmails[u.id] = u.email;
      }
    });
  }

  if (isClientAdmin) {
    const { data: invitesData, error: invitesError } = await supabase
      .from('client_invites')
      .select('id, email, role, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Failed to load client invites', invitesError);
    } else {
      pendingInvites = ((invitesData as PendingInvite[] | null) ?? []).filter(
        invite => invite.status === 'pending'
      );
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <div className="space-y-6">
        {/* Team Members Section - Only for client_admin */}
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Invite team members to access this organization. Admins can manage settings and invite others, while viewers have read-only access.
            </p>
          </div>

          {isClientAdmin ? (
            <>
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-medium mb-3">Invite New Member</h3>
                <InviteMemberForm orgId={orgId} />
              </div>

              {pendingInvites.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-medium mb-3">Pending Invites</h3>
                  <div className="space-y-2">
                    {pendingInvites.map(invite => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm"
                      >
                        <div>
                          <div className="font-medium">{invite.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {invite.role === 'client_admin' ? 'Admin' : 'Viewer'} • Sent{' '}
                            {new Date(invite.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invite.role === 'client_admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {invite.role === 'client_admin' ? 'Admin' : 'Viewer'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm text-muted-foreground">
                Only client administrators can invite new members. Contact your admin if you need additional access.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-3">Current Members</h3>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {member.profiles?.full_name || memberEmails[member.user_id] || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {memberEmails[member.user_id] || 'No email'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === 'client_admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
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
