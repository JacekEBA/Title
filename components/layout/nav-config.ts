import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Users,
  Inbox,
  BarChart3,
  Settings,
  UserCog,
  Sparkles,
  CalendarClock,
} from "lucide-react";

export type Role = "owner" | "client_admin" | "client_viewer";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/promos", label: "Promos", icon: CalendarDays },
  { href: "/rcs/campaigns", label: "RCS Campaigns", icon: Megaphone },
  { href: "/rcs/segments", label: "Segments", icon: Users },
  { href: "/rcs/inbox", label: "Inbox", icon: Inbox },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  {
    href: "/clients",
    label: "Clients",
    icon: UserCog,
    roles: ["owner"],
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["owner"],
  },
  { href: "/blasts", label: "Blasts", icon: Sparkles },
  { href: "/promos/new", label: "Schedule Promo", icon: CalendarClock },
  { href: "/settings", label: "Settings", icon: Settings },
];
