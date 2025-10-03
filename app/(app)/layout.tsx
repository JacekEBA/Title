import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Shell } from "@/components/layout/shell";

type OptionRecord = {
  id: string | number | null;
  name?: string | null;
};

function isOptionRecord(value: unknown): value is OptionRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as { id?: unknown };

  return (
    "id" in record &&
    record.id !== undefined &&
    (typeof record.id === "string" ||
      typeof record.id === "number" ||
      record.id === null)
  );
}

function normalizeOptions(
  records: OptionRecord[],
  fallbackName: string
): { id: string; name: string }[] {
  return records
    .filter((record) => record.id !== null && record.id !== undefined)
    .map((record) => ({
      id: String(record.id),
      name: record.name ?? fallbackName,
    }));
}

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

  let organizationsRaw: OptionRecord[] = [];

  if (role === "owner") {
    const { data: ownerOrganizations } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");

    organizationsRaw = (ownerOrganizations ?? []).filter(isOptionRecord);
  } else if (profile?.organization) {
    const organizationData = profile.organization;
    const normalizedOrganizations = Array.isArray(organizationData)
      ? organizationData
      : [organizationData];

    organizationsRaw = normalizedOrganizations.filter(isOptionRecord);
  }

  const organizations = normalizeOptions(
    organizationsRaw,
    "Unnamed organization"
  );

  const activeOrgId =
    profile?.organization_id !== undefined &&
    profile?.organization_id !== null
      ? String(profile.organization_id)
      : organizations?.[0]?.id ?? null;

  const coursesRawData = activeOrgId
    ? (
        await supabase
          .from("courses")
          .select("id, name")
          .eq("organization_id", activeOrgId)
          .order("name")
      ).data ?? []
    : [];

  const coursesRaw = (coursesRawData as unknown[]).filter(isOptionRecord);

  const courses = normalizeOptions(coursesRaw, "Course");

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
