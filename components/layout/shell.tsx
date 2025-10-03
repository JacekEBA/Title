import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar, type Option } from "./topbar";
import type { Role } from "./nav-config";

export type ShellProps = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
  organizations: Option[];
  courses: Option[];
  activeOrgId: string | null;
  activeCourseId: string | null;
  children: ReactNode;
};

export function Shell({
  user,
  organizations,
  courses,
  activeOrgId,
  activeCourseId,
  children,
}: ShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar
          user={user}
          organizations={organizations}
          courses={courses}
          defaultOrgId={activeOrgId ?? undefined}
          defaultCourseId={activeCourseId ?? undefined}
        />
        <main className="flex-1 space-y-6 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
