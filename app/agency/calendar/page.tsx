import Calendar from "@/components/Calendar";
import AddPromoModal from "./AddPromoModal";
import { getAccessibleOrgs, getCalendarEventsForOwner } from "@/lib/agency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPromoAction } from "./actions";

export const metadata = { title: "Agency • Calendar" };

export default async function Page() {
  const from = new Date(Date.now() - 100060602430).toISOString();
  const to = new Date(Date.now() + 100060602460).toISOString();
  const eventsRaw = await getCalendarEventsForOwner({ from, to });
  const events = eventsRaw.map((e) => ({
    id: e.id,
    title: e.title ?? "Promo",
    start: e.start_time,
    end: e.end_time ?? e.start_time,
  }));

  const orgs = await getAccessibleOrgs();
  const orgOptions = orgs.map((o) => ({ id: o.id as string, name: o.name as string }));
  const orgIds = orgOptions.map((o) => o.id);

  const supabase = createSupabaseServerClient();

  const courseOptionsByOrg: Record<string, { id: string; name: string; timezone: string }[]> = {};
  const templateOptionsByOrg: Record<string, { id: string; name: string }[]> = {};

  if (orgIds.length > 0) {
    const [{ data: courses }, { data: templates }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, name, org_id, timezone")
        .in("org_id", orgIds)
        .order("name", { ascending: true }),
      supabase
        .from("rcs_templates")
        .select("id, name, org_id")
        .in("org_id", orgIds)
        .order("name", { ascending: true }),
    ]);

    for (const course of courses ?? []) {
      if (!course?.org_id || !course?.id || !course?.name) continue;
      courseOptionsByOrg[course.org_id] = courseOptionsByOrg[course.org_id] ?? [];
      courseOptionsByOrg[course.org_id].push({
        id: course.id,
        name: course.name,
        timezone: course.timezone ?? "",
      });
    }

    for (const template of templates ?? []) {
      if (!template?.org_id || !template?.id || !template?.name) continue;
      templateOptionsByOrg[template.org_id] = templateOptionsByOrg[template.org_id] ?? [];
      templateOptionsByOrg[template.org_id].push({
        id: template.id,
        name: template.name,
      });
    }

    for (const orgId of Object.keys(courseOptionsByOrg)) {
      courseOptionsByOrg[orgId].sort((a, b) => a.name.localeCompare(b.name));
    }

    for (const orgId of Object.keys(templateOptionsByOrg)) {
      templateOptionsByOrg[orgId].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <AddPromoModal
          orgOptions={orgOptions}
          courseOptionsByOrg={courseOptionsByOrg}
          templateOptionsByOrg={templateOptionsByOrg}
          action={async (formData) => {
            const getString = (key: string) => {
              const value = formData.get(key);
              return typeof value === "string" ? value.trim() : "";
            };

            const scheduledAtRaw = getString("scheduled_at");
            const scheduledAtIso = (() => {
              if (!scheduledAtRaw) return "";
              const parsed = new Date(scheduledAtRaw);
              return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
            })();

            await createPromoAction({
              org_id: getString("org_id"),
              course_id: getString("course_id"),
              template_id: getString("template_id"),
              name: getString("name"),
              description: (() => {
                const description = formData.get("description");
                if (typeof description !== "string") return null;
                const trimmed = description.trim();
                return trimmed.length ? trimmed : null;
              })(),
              scheduled_at: scheduledAtIso,
              timezone: getString("timezone"),
            });
          }}
        />
      </div>
      <div className="card">
        <Calendar events={events} />
      </div>
    </div>
  );
}
