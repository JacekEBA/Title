"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "./env";

let client: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient => {
  if (client) return client;

  const { url, anonKey } = getSupabaseCredentials();

  console.info("[supabaseBrowser] creating client", {
    url: url ? "present" : "MISSING",
    key: anonKey ? "present" : "MISSING",
  });

  client = createBrowserClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  return client;
};
