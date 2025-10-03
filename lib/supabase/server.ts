import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "./env";

export function supabaseServer() {
  console.info("[supabaseServer] init server client");
  const cookieStore = cookies();

  const { url, anonKey } = getSupabaseCredentials();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        const v = cookieStore.get(name)?.value;
        console.debug(
          "[supabaseServer.cookies.get]",
          name,
          v ? "present" : "missing"
        );
        return v;
      },
      set(name: string, value: string, options: any) {
        console.debug("[supabaseServer.cookies.set]", name);
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        console.debug("[supabaseServer.cookies.remove]", name);
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}
