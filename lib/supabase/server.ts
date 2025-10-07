import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../types/database';

/**
 * Read-only client for Server Components (no cookie writes).
 *
 * Uses the new getAll API so SSR won’t warn; does NOT provide setAll.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // No setAll here — you cannot modify cookies from a Server Component.
      },
      headers: { 'x-forwarded-host': headers().get('x-forwarded-host') ?? undefined },
    } as any
  ) as any;
}

/**
 * Write-enabled client for Server Actions and Route Handlers.
 *
 * Supplies getAll + setAll; safe to mutate cookies in these contexts.
 */
export function createSupabaseActionClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, any> }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...(options ?? {}) });
          });
        },
      },
      headers: { 'x-forwarded-host': headers().get('x-forwarded-host') ?? undefined },
    } as any
  ) as any;
}

/**
 * Admin client for cron/webhooks (service role; bypasses RLS by design).
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } } as any
  ) as any;
}
