"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { NAV_ITEMS, type Role } from "./nav-config";
import { cn } from "@/lib/utils";

export type Option = { id: string; name: string };

type UserSummary = {
  name: string;
  email: string;
  role: Role;
};

type TopbarProps = {
  user: UserSummary;
  organizations: Option[];
  courses: Option[];
  defaultOrgId?: string;
  defaultCourseId?: string;
};

export function Topbar({
  user,
  organizations,
  courses,
  defaultOrgId,
  defaultCourseId,
}: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orgId, setOrgId] = useState(defaultOrgId ?? organizations[0]?.id ?? "");
  const [courseId, setCourseId] = useState(defaultCourseId ?? courses[0]?.id ?? "");
  const [range, setRange] = useState("30d");

  const roleLabel = useMemo(() => {
    switch (user.role) {
      case "owner":
        return "Owner";
      case "client_admin":
        return "Client Admin";
      default:
        return "Client Viewer";
    }
  }, [user.role]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border sm:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden flex-col sm:flex sm:gap-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="org-select">
                Organization
              </label>
              <div className="relative">
                <select
                  id="org-select"
                  value={orgId}
                  onChange={(event) => setOrgId(event.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none"
                >
                  {organizations.length === 0 ? (
                    <option value="">No orgs</option>
                  ) : (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="course-select">
                Course
              </label>
              <div className="relative">
                <select
                  id="course-select"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="min-w-[10rem] rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none"
                >
                  <option value="">All locations</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <label className="text-xs text-muted-foreground" htmlFor="range-select">
              Range
            </label>
            <select
              id="range-select"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col text-right text-sm sm:flex">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background p-3 sm:hidden">
          <div className="mb-3 grid gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="org-select-mobile">
              Organization
            </label>
            <select
              id="org-select-mobile"
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {organizations.length === 0 ? (
                <option value="">No orgs</option>
              ) : (
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))
              )}
            </select>

            <label className="text-xs text-muted-foreground" htmlFor="course-select-mobile">
              Course
            </label>
            <select
              id="course-select-mobile"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All locations</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <label className="text-xs text-muted-foreground" htmlFor="range-select-mobile">
              Range
            </label>
            <select
              id="range-select-mobile"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <nav className="grid gap-1">
            {NAV_ITEMS.filter((item) =>
              item.roles ? item.roles.includes(user.role) : true
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  "hover:bg-muted"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
