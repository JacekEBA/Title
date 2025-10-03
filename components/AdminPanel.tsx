"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminPanel() {
  const sb = supabaseBrowser();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState({
    org_id: "",
    course_id: "",
    template_id: "",
    name: "Promo",
    when: "",
  });

  useEffect(() => {
    console.log("[AdminPanel] mounted");
    (async () => {
      const { data: o, error: oErr } = await sb
        .from("organizations")
        .select("id,name")
        .order("name");
      if (oErr) console.error("[AdminPanel] orgs error", oErr);
      setOrgs(o || []);
      console.info("[AdminPanel] orgs loaded", (o || []).length);

      const { data: c, error: cErr } = await sb
        .from("courses")
        .select("id,name,org_id")
        .order("name");
      if (cErr) console.error("[AdminPanel] courses error", cErr);
      setCourses(c || []);
      console.info("[AdminPanel] courses loaded", (c || []).length);

      const { data: t, error: tErr } = await sb
        .from("rcs_templates")
        .select("id,name,org_id")
        .order("updated_at", { ascending: false });
      if (tErr) console.error("[AdminPanel] templates error", tErr);
      setTemplates(t || []);
      console.info("[AdminPanel] templates loaded", (t || []).length);
    })();
  }, []);

  const scopedCourses = courses.filter(
    (c) => !form.org_id || c.org_id === form.org_id
  );
  const scopedTemplates = templates.filter(
    (t) => !form.org_id || t.org_id === form.org_id
  );

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    console.log("[AdminPanel.createCampaign] submit", form);
    const tz = "America/New_York";
    const when = new Date(form.when || Date.now()).toISOString();
    const { error } = await sb.from("campaigns").insert({
      org_id: form.org_id,
      course_id: form.course_id,
      template_id: form.template_id,
      name: form.name,
      timezone: tz,
      audience_kind: "all_contacts",
      scheduled_at: when,
      status: "scheduled",
      client_visible: true,
    });

    if (error) {
      console.error("[AdminPanel.createCampaign] error", error);
    } else {
      console.info("[AdminPanel.createCampaign] campaign created");
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
      <form onSubmit={createCampaign} className="space-y-3">
        <select
          value={form.org_id}
          onChange={(e) => setForm({ ...form, org_id: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="">Select organization</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <select
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="">Select course</option>
          {scopedCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={form.template_id}
          onChange={(e) => setForm({ ...form, template_id: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="">Select template</option>
          {scopedTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={form.when}
          onChange={(e) => setForm({ ...form, when: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded w-full"
        >
          Create Campaign
        </button>
      </form>
    </div>
  );
}
