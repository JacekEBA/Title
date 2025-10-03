// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const ADMIN_ROLES = new Set(["owner", "client_admin"]);

export default function DashboardRouter() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      let { data: p } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      if (!p) { await supabase.rpc("ensure_profile_for_me"); ({ data: p } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()); }

      router.replace(ADMIN_ROLES.has(p?.role) ? "/dashboard/admin" : "/dashboard/client");
    })();
  }, [router, supabase]);

  return null;
}
