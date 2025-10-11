"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

let _client: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  _client = createClient<Database>(url, anonKey);
  return _client;
}

export const supabaseBrowser = createSupabaseBrowserClient;
