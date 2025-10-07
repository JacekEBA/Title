'use server';

import { redirect } from 'next/navigation';

import { createSupabaseActionClient } from '@/lib/supabase/server';

export async function signOutAction() {
  const supabase = createSupabaseActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}

