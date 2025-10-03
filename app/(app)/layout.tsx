import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/layout/shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, organization_id, organization:organizations(id, name)"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "client_viewer";

  const organizationsRaw =
    role === "owner"
      ? (
          await supabase
            .from("organizations")
            .select("id, name")
            .order("name")
        ).data ?? []
      : profile?.organization
      ? [profile.organization]
      : [];

  const organizations = organizationsRaw.map((org) => ({
    id: org.id,
    name: org.name ?? "Unnamed organization",
  }));

  const activeOrgId =
    profile?.organization_id ?? organizations?.[0]?.id ?? null;

  const coursesRaw = activeOrgId
    ? (
        await supabase
          .from("courses")
          .select("id, name")
          .eq("organization_id", activeOrgId)
          .order("name")
      ).data ?? []
    : [];

  const courses = coursesRaw.map((course) => ({
    id: course.id,
    name: course.name ?? "Course",
  }));

  const activeCourseId = courses[0]?.id ?? null;

  return (
    <Shell
      user={{
        id: user.id,
        email: user.email ?? "",
        name: profile?.full_name ?? user.email ?? "User",
        role,
      }}
      organizations={organizations}
      courses={courses}
      activeOrgId={activeOrgId}
      activeCourseId={activeCourseId}
    >
      {children}
    </Shell>
  );
}
