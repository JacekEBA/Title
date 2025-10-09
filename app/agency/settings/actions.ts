"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  createSupabaseActionClient,
  createSupabaseAdminClient,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/supabase/server';

import type { InviteOwnerActionState } from './inviteOwnerState';

export async function signOutAction() {
  const supabase = createSupabaseActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const inviteOwnerSchema = z.object({
  email: z
    .string({ required_error: 'Enter an email address.' })
    .trim()
    .min(1, 'Enter an email address.')
    .email('Enter a valid email address.'),
});

export async function inviteOwnerAction(
  _prevState: InviteOwnerActionState,
  formData: FormData
): Promise<InviteOwnerActionState> {
  'use server';

  const parsed = inviteOwnerSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Enter a valid email address.',
    };
  }

  const email = parsed.data.email.toLowerCase();

  const supabase = createSupabaseActionClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    console.error('Unable to load current user', userError);
    return {
      status: 'error',
      message: 'You must be signed in to send invites.',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('Unable to load current profile', profileError);
    return {
      status: 'error',
      message: 'Unable to load your profile. Please try again.',
    };
  }

  const profileRecord = profile as Record<string, any>;

  if (profileRecord.role !== 'owner') {
    return {
      status: 'error',
      message: 'Only owners can send invites.',
    };
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();
  const supabaseUrl = getSupabaseUrl();

  if (!serviceRoleKey) {
    console.error('Owner invite attempted without SUPABASE_SERVICE_ROLE_KEY configured.');
    return {
      status: 'error',
      message: 'Invites are not configured yet. Please contact support to finish setup.',
    };
  }

  if (!supabaseUrl) {
    console.error('Owner invite attempted without NEXT_PUBLIC_SUPABASE_URL configured.');
    return {
      status: 'error',
      message: 'Invites are not configured yet. Please contact support to finish setup.',
    };
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminClient = createSupabaseAdminClient(serviceRoleKey, supabaseUrl);
  } catch (error) {
    console.error('Unable to create Supabase admin client for owner invite', error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again later.',
    };
  }

  // Check if user already exists
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email);

  if (existingUser) {
    return {
      status: 'error',
      message: 'That user is already registered.',
    };
  }

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

  const orgId = profileRecord.org_id as string | null | undefined;

  // Send invite with metadata that will be used to create profile on first login
  const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      role: 'owner',
      org_id: orgId || null,
    }
  });

  if (inviteResult.error) {
    console.error('Failed to send owner invite', inviteResult.error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again.',
    };
  }

  return {
    status: 'success',
    message: 'Invite sent! They will receive an email to set their password.',
  };
}
