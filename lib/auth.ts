import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRole = "owner" | "client_admin" | "client_viewer";

export type ProfileSummary = {
  fullName: string;
  role: ProfileRole;
  organizationId: string | null;
};

type RequireProfileResult = {
  supabase: SupabaseClient;
  user: {
    id: string;
    email?: string;
  };
  profile: ProfileSummary;
};

export async function requireProfile(): Promise<RequireProfileResult> {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const role: ProfileRole = (profile?.role as ProfileRole) ?? "client_viewer";

  return {
    supabase,
    user,
    profile: {
      fullName: profile?.full_name ?? user.email ?? "User",
      role,
      organizationId: profile?.organization_id ?? null,
    },
  };
}
