"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  createSupabaseActionClient,
  createSupabaseAdminClient,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/supabase/server';
import type { InviteMemberActionState } from './inviteMemberState';

export async function signOutAction() {
  const supabase = createSupabaseActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Enter an email address.' })
    .trim()
    .min(1, 'Enter an email address.')
    .email('Enter a valid email address.'),
  role: z.enum(['client_admin', 'client_viewer'], {
    required_error: 'Select a role.',
  }),
  org_id: z.string().uuid('Invalid organization ID.'),
});

export async function inviteMemberAction(
  _prevState: InviteMemberActionState,
  formData: FormData
): Promise<InviteMemberActionState> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    org_id: formData.get('org_id'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  const { email, role, org_id } = parsed.data;
  const emailLower = email.toLowerCase();

  const supabase = createSupabaseActionClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      status: 'error',
      message: 'You must be signed in to send invites.',
    };
  }

  // Verify user is client_admin for this org
  const { data: membership } = await supabase
    .from('org_memberships')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', userData.user.id)
    .single();

  if (!membership || membership.role !== 'client_admin') {
    return {
      status: 'error',
      message: 'Only admins can send invites.',
    };
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();
  const supabaseUrl = getSupabaseUrl();

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('Invite attempted without proper Supabase configuration.');
    return {
      status: 'error',
      message: 'Invites are not configured. Please contact support.',
    };
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminClient = createSupabaseAdminClient(serviceRoleKey, supabaseUrl);
  } catch (error) {
    console.error('Unable to create Supabase admin client', error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again later.',
    };
  }

  // Check if user already exists
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === emailLower);

  if (existingUser) {
    // Check if they're already a member of this org
    const { data: existingMembership } = await (adminClient as any)
      .from('org_memberships')
      .select('id')
      .eq('org_id', org_id)
      .eq('user_id', existingUser.id)
      .maybeSingle();

    if (existingMembership) {
      return {
        status: 'error',
        message: 'That user is already a member of this organization.',
      };
    }

    // User exists but not in this org - add them
    const { error: membershipError } = await (adminClient as any)
      .from('org_memberships')
      .insert({
        org_id,
        user_id: existingUser.id,
        role,
      });

    if (membershipError) {
      console.error('Failed to add existing user to org:', membershipError);
      return {
        status: 'error',
        message: 'Failed to add user to organization.',
      };
    }

    return {
      status: 'success',
      message: 'User added to organization successfully!',
    };
  }

  // User doesn't exist - send invite WITHOUT metadata
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.SUPABASE_SITE_URL?.trim() ??
    'http://localhost:3000';

  let redirectTo = `${siteUrl.replace(/\/$/, '')}/login`;
  try {
    redirectTo = new URL('/login', siteUrl).toString();
  } catch (error) {
    console.warn('Invalid site URL for invite redirect', { siteUrl, error });
  }

  // IMPORTANT: Don't pass user metadata here - it causes database errors
  const inviteResult = await adminClient.auth.admin.inviteUserByEmail(emailLower, {
    redirectTo,
  });

  if (inviteResult.error) {
    console.error('Failed to send invite', inviteResult.error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again.',
    };
  }

  // Create profile and org_membership for the new user AFTER invite succeeds
  if (inviteResult.data?.user?.id) {
    const newUserId = inviteResult.data.user.id;

    // Check if profile already exists (may be created by database trigger)
    const { data: existingProfile } = await (adminClient as any)
      .from('profiles')
      .select('user_id')
      .eq('user_id', newUserId)
      .maybeSingle();

    if (!existingProfile) {
      // Profile doesn't exist, create it
      const { error: profileError } = await (adminClient as any)
        .from('profiles')
        .insert({
          user_id: newUserId,
          role,
          org_id,
        });

      if (profileError) {
        console.error('Failed to create profile for invited user', profileError);
      }
    } else {
      // Profile exists, update it with role and org_id
      const { error: profileUpdateError } = await (adminClient as any)
        .from('profiles')
        .update({
          role,
          org_id,
        })
        .eq('user_id', newUserId);

      if (profileUpdateError) {
        console.error('Failed to update profile for invited user', profileUpdateError);
      }
    }

    // Create org membership with admin client (bypasses RLS)
    const { error: membershipError } = await (adminClient as any)
      .from('org_memberships')
      .insert({
        org_id,
        user_id: newUserId,
        role,
      });

    if (membershipError) {
      console.error('Failed to create org membership for invited user', membershipError);
      // Don't fail the whole invite - user can still sign in
    }
  }

  return {
    status: 'success',
    message: 'Invite sent! They will receive an email to set their password.',
  };
}
