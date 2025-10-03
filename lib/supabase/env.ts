type SupabaseCredentials = {
  url: string;
  anonKey: string;
};

let cachedCredentials: SupabaseCredentials | null = null;

export function getSupabaseCredentials(): SupabaseCredentials {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
  const anonKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY)?.trim();

  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your environment."
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY in your environment."
    );
  }

  cachedCredentials = { url, anonKey };
  return cachedCredentials;
}
