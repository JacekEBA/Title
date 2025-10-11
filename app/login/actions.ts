'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseActionClient } from '@/lib/supabase/server';
import { landingRedirectPath } from '@/lib/auth';

type ActionState = { ok: boolean; message?: string };

function appOrigin() {
  const h = headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('host') ?? 'localhost:3000';
  const scheme = host.startsWith('localhost') ? 'http' : 'https';
  return `${scheme}://${host}`;
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = createSupabaseActionClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: 'Wrong email or password.' };
  }

  const path = await landingRedirectPath();
  redirect(path);
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = createSupabaseActionClient();

  const redirectTo = `${appOrigin()}/reset-password`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    const already = error.message?.toLowerCase().includes('already');
    return {
      ok: false,
      message: already ? 'You already have an account. Please sign in.' : error.message,
    };
  }

  if (data?.user && Array.isArray((data as any).user.identities) && (data as any).user.identities.length === 0) {
    return { ok: false, message: 'You already have an account. Please sign in.' };
  }

  return {
    ok: true,
    message: 'Check your email to confirm your account, then sign in.',
  };
}

export async function sendResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const supabase = createSupabaseActionClient();
  const redirectTo = `${appOrigin()}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, message: 'Could not send reset email. Please try again.' };
  return { ok: true, message: 'Reset link sent! Check your inbox.' };
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (!password || password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
  if (password !== confirm) return { ok: false, message: 'Passwords do not match.' };

  const supabase = createSupabaseActionClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: 'Could not update password. Please open the reset link again.' };
  return { ok: true, message: 'Password updated! You can sign in now.' };
}
