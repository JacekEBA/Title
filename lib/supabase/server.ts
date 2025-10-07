import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../types/database';

/**
 * Read-only Supabase client for Server Components.
 *
 * It never writes cookies, so it is safe to call during render.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        // No set/remove here — Server Components must not mutate cookies
      },
      headers: { 'x-forwarded-host': headers().get('x-forwarded-host') ?? undefined },
    }
  );
}

/**
 * Write-enabled Supabase client for Server Actions and Route Handlers.
 *
 * This variant is allowed to modify cookies.
 */
export function createSupabaseActionClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) =>
          cookieStore.set({ name, value: '', ...options, maxAge: 0 }),
      },
      headers: { 'x-forwarded-host': headers().get('x-forwarded-host') ?? undefined },
    }
  );
}

/**
 * Admin client for background jobs / webhooks (service role).
 *
 * Bypasses RLS by design — DO NOT use in pages/components.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
