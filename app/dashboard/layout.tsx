import { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Settings,
  ShieldCheck,
  GraduationCap,
  Bell,
  Search,
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="p-6">Redirecting to login...</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, full_name")
    .eq("user_id", user.id)
    .single();

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card/50 px-3 py-2 text-sm hover:bg-accent/70 transition"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r bg-muted/30 p-4">
        <div className="flex items-center gap-2 px-2">
          {/* Replace with your logo if you have one */}
          <div className="h-8 w-8 rounded-lg bg-emerald-600" />
          <span className="text-lg font-semibold">Title</span>
        </div>

        <nav className="mt-6 space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/dashboard/courses" icon={GraduationCap} label="Courses" />
          <NavLink href="/dashboard/calendar" icon={CalendarDays} label="Calendar" />
          <NavLink href="/dashboard/analytics" icon={BarChart3} label="Analytics" />
          <NavLink href="/dashboard/settings" icon={Settings} label="Settings" />
          {profile?.role === "owner" && (
            <NavLink href="/dashboard/admin" icon={ShieldCheck} label="Admin (Owner)" />
          )}
        </nav>

        <div className="mt-auto px-2 pt-6 text-xs text-muted-foreground">
          Signed in as <span className="font-medium">{profile?.full_name || user.email}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="h-9 w-64 rounded-md border bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Search…"
                />
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card hover:bg-accent/60"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="h-9 w-9 rounded-full bg-emerald-600/90" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
