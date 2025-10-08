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

const SERVICE_ROLE_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_ROLE_SECRET',
] as const;

function normalizeEnvValue(value: string | undefined | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseServiceRoleKey(): string | null {
  for (const key of SERVICE_ROLE_ENV_KEYS) {
    const candidate = normalizeEnvValue(process.env[key]);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

/**
 * Admin client for cron/webhooks (service role; bypasses RLS by design).
 */
export function createSupabaseAdminClient(serviceRoleKey?: string) {
  const resolvedKey = normalizeEnvValue(serviceRoleKey ?? getSupabaseServiceRoleKey());

  if (!resolvedKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolvedKey,
    { auth: { persistSession: false, autoRefreshToken: false } } as any
  ) as any;
}
