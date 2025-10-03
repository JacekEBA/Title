"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type Role } from "./nav-config";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/60 backdrop-blur sm:flex sm:flex-col">
      <div className="px-6 pb-4 pt-6 text-lg font-semibold">Title</div>
      <nav className="flex-1 space-y-1 px-4 pb-6">
        {NAV_ITEMS.filter((item) =>
          item.roles ? item.roles.includes(role) : true
        ).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Title
      </div>
    </aside>
  );
}
