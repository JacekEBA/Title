"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  createSupabaseActionClient,
  createSupabaseAdminClient,
  getSupabaseServiceRoleKey,
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

  if (!serviceRoleKey) {
    console.error(
      'Owner invite attempted without SUPABASE_SERVICE_ROLE_KEY configured.'
    );
    return {
      status: 'error',
      message:
        'Invites are not configured yet. Please contact support to finish setup.',
    };
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminClient = createSupabaseAdminClient(serviceRoleKey);
  } catch (error) {
    console.error('Unable to create Supabase admin client for owner invite', error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again later.',
    };
  }

  const existingUser = await adminClient.auth.admin.getUserByEmail(email);

  if (existingUser.error) {
    console.error('Failed to check for existing user', existingUser.error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again.',
    };
  }

  if (existingUser.data?.user) {
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
    console.warn('Invalid site URL for invite redirect; falling back to manual join', {
      siteUrl,
      error,
    });
  }

  const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (inviteResult.error) {
    console.error('Failed to send owner invite', inviteResult.error);
    return {
      status: 'error',
      message: 'Failed to send invite. Please try again.',
    };
  }

  const invitedUser = inviteResult.data.user;

  if (!invitedUser) {
    return {
      status: 'success',
      message: 'Invite sent!',
    };
  }

  const profileInsert: Record<string, any> = {
    user_id: invitedUser.id,
    role: 'owner',
  };

  const agencyId =
    (profileRecord.agency_id as string | null | undefined) ??
    (profileRecord.org_id as string | null | undefined) ??
    null;

  if (agencyId) {
    if ('agency_id' in profileRecord) {
      profileInsert.agency_id = agencyId;
    } else {
      profileInsert.org_id = agencyId;
    }
  }

  profileInsert.email = email;

  const { error: insertError } = await adminClient
    .from('profiles')
    .upsert(profileInsert, { onConflict: 'user_id' });

  if (insertError) {
    console.error('Failed to link invited owner to agency', insertError);
    return {
      status: 'error',
      message:
        'Invite sent but we could not link the user to your agency. Please contact support.',
    };
  }

  return {
    status: 'success',
    message: 'Invite sent!',
  };
}

