"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

let client: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient => {
  if (client) return client;

  console.info("[supabaseBrowser] creating client", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "MISSING",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "MISSING",
  });

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  return client;
};
