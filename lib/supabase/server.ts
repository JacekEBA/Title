import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServer() {
  console.info("[supabaseServer] init server client");
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );
}
