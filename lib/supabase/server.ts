import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

type DenoEnv = { env?: { get(name: string): string | undefined } };
type GlobalWithDeno = typeof globalThis & { Deno?: DenoEnv };

const globalWithDeno = globalThis as GlobalWithDeno;

function readEnvVar(name: string): string | undefined {
  const denoEnvGetter = globalWithDeno?.Deno?.env?.get;

  if (typeof denoEnvGetter === 'function') {
    try {
      const denoValue = denoEnvGetter(name);
      if (typeof denoValue === 'string' && denoValue.length > 0) {
        return denoValue;
      }
    } catch (error) {
      console.error('Unable to read environment variable from Deno.env', {
        name,
        error,
      });
    }
  }

  const nodeValue =
    typeof process !== 'undefined' && process?.env ? process.env[name] : undefined;

  return typeof nodeValue === 'string' && nodeValue.length > 0 ? nodeValue : undefined;
}

function normalizeEnvValue(value: string | undefined | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function getEnvValueFromKeys(keys: readonly string[]) {
  for (const key of keys) {
    const candidate = normalizeEnvValue(readEnvVar(key));
    if (candidate) {
      return candidate;
    }
  }

  return '';
}

const SERVICE_ROLE_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_ROLE_SECRET',
] as const;

const SUPABASE_URL_ENV_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'] as const;

const SUPABASE_ANON_KEY_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
] as const;

export function getSupabaseServiceRoleKey(): string | null {
  const resolved = getEnvValueFromKeys(SERVICE_ROLE_ENV_KEYS);

  return resolved || null;
}

export function getSupabaseUrl(): string | null {
  const resolved = getEnvValueFromKeys(SUPABASE_URL_ENV_KEYS);

  return resolved || null;
}

export function getSupabaseAnonKey(): string | null {
  const resolved = getEnvValueFromKeys(SUPABASE_ANON_KEY_ENV_KEYS);

  return resolved || null;
}

function resolveSupabaseUrlOrThrow() {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  return supabaseUrl;
}

function resolveSupabaseAnonKeyOrThrow() {
  const anonKey = getSupabaseAnonKey();

  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }

  return anonKey;
}

/**
 * Read-only client for Server Components (no cookie writes).
 *
 * Uses the new getAll API so SSR won't warn; does NOT provide setAll.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    resolveSupabaseUrlOrThrow(),
    resolveSupabaseAnonKeyOrThrow(),
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
    resolveSupabaseUrlOrThrow(),
    resolveSupabaseAnonKeyOrThrow(),
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
export function createSupabaseAdminClient(
  serviceRoleKey?: string,
  supabaseUrl?: string
) {
  const resolvedKey = normalizeEnvValue(serviceRoleKey ?? getSupabaseServiceRoleKey());
  const resolvedUrl = normalizeEnvValue(supabaseUrl ?? getSupabaseUrl());

  if (!resolvedKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  if (!resolvedUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  // Use the imported createClient from @supabase/supabase-js
  return createClient<Database>(
    resolvedUrl,
    resolvedKey,
    { 
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      } 
    }
  );
}
