import { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Building2, CalendarDays, LayoutDashboard, BarChart3, Settings, ShieldCheck } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // middleware handles redirects

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, full_name")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-screen">
      <aside className="hidden md:block border-r bg-muted/30 p-4">
        <div className="flex items-center gap-2 px-2">
          <Building2 className="h-5 w-5" />
          <span className="text-sm font-semibold">RCS Admin</span>
        </div>
        <nav className="mt-6 space-y-1">
          <Link href="/dashboard" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
            <LayoutDashboard className="inline h-4 w-4 mr-2"/> Overview
          </Link>
          <Link href="/dashboard/courses" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
            <ShieldCheck className="inline h-4 w-4 mr-2"/> Courses
          </Link>
          <Link href="/dashboard/calendar" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
            <CalendarDays className="inline h-4 w-4 mr-2"/> Calendar
          </Link>
          <Link href="/dashboard/analytics" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
            <BarChart3 className="inline h-4 w-4 mr-2"/> Analytics
          </Link>
          <Link href="/dashboard/settings" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
            <Settings className="inline h-4 w-4 mr-2"/> Settings
          </Link>
          {profile?.role === "owner" && (
            <Link href="/dashboard/admin" className="block rounded-xl border bg-card px-3 py-2 text-sm hover:bg-accent/60">
              <ShieldCheck className="inline h-4 w-4 mr-2"/> Admin (Owner)
            </Link>
          )}
        </nav>
        <div className="mt-6 px-2 text-xs text-muted-foreground">
          Signed in as {profile?.full_name || user.email}
        </div>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}

