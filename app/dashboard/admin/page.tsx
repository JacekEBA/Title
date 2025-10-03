import PromoCalendar from "@/components/admin/PromoCalendar";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("user_id", user?.id)
    .single();

  if (!user || !profile || !["owner", "staff"].includes(profile.role ?? "")) {
    return <div className="rounded-xl border bg-card p-6">403 – Team access only.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Admin</h2>
      <PromoCalendar orgId={profile.org_id} />
    </div>
  );
}
