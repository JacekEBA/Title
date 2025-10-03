// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, GraduationCap, CalendarDays, BarChart3, Settings, ShieldCheck
} from "lucide-react";

// --- only existing routes here ---
type NavItem = { href: Route; label: string; icon: LucideIcon };
const NAV: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses",  label: "Courses",   icon: GraduationCap },
  { href: "/dashboard/calendar", label: "Calendar",  icon: CalendarDays },
  { href: "/dashboard/analytics",label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];
// Admin stays conditional:
{/* {profile?.role === "owner" && <NavLink href={"/dashboard/admin"} label="Admin (Owner)"} icon={ShieldCheck} />} */}


const NavLink = ({ href, icon: Icon, label }: NavItem) => (
  <Link
    href={href}
    className="flex items-center gap-3 rounded-xl border bg-card/60 px-3 py-2 text-sm hover:bg-accent/70 transition"
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </Link>
);

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="p-6">Redirecting to login…</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r bg-muted/30 p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600" />
          <span className="text-lg font-semibold">Title</span>
        </div>

        <nav className="mt-6 space-y-2">
          {NAV.map((n) => <NavLink key={n.href} {...n} />)}
          {profile?.role === "owner" && (
            <NavLink href={"/dashboard/admin"} label="Admin (Owner)" icon={ShieldCheck} />
          )}
        </nav>

        <div className="mt-auto px-2 pt-6 text-xs text-muted-foreground">
          Signed in as <span className="font-medium">{profile?.full_name || user.email}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
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
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card hover:bg-accent/60" aria-label="Notifications">
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
