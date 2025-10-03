// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // read role (and self-heal if missing)
  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    await supabase.rpc("ensure_profile_for_me");
    ({ data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single());
  }

  const role = profile?.role;
  const isAdmin = role === "owner" || role === "client_admin";

  redirect(isAdmin ? "/dashboard/admin" : "/dashboard/client");
}
