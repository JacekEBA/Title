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
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          console.warn(
            "[supabaseServer.cookies.set] unable to set cookie (likely invoked outside a Server Action or Route Handler)",
            error
          );
        }
      },
      remove(name: string, options: any) {
        console.debug("[supabaseServer.cookies.remove]", name);
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          console.warn(
            "[supabaseServer.cookies.remove] unable to remove cookie (likely invoked outside a Server Action or Route Handler)",
            error
          );
        }
      },
    },
  });
}
