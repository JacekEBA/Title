"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function AddPromoModal() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string; timezone: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);

  const [orgId, setOrgId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("organizations").select("id,name").order("name");
      if (!error && data) {
        setOrgs(data as Array<{ id: string; name: string }>);
      }
    })();
  }, [supabase]);

  useEffect(() => {
    if (!orgId) {
      setCourses([]);
      setTemplates([]);
      setCourseId("");
      setTemplateId("");
      setTimezone("");
      return;
    }

    (async () => {
      const [{ data: courseData }, { data: templateData }] = await Promise.all([
        supabase.from("courses").select("id,name,timezone").eq("org_id", orgId).order("name"),
        supabase.from("rcs_templates").select("id,name").eq("org_id", orgId).order("name"),
      ]);

      setCourses((courseData as Array<{ id: string; name: string; timezone: string }>) ?? []);
      setTemplates((templateData as Array<{ id: string; name: string }>) ?? []);
    })();
  }, [orgId, supabase]);

  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    setTimezone(course?.timezone ?? "");
  }, [courseId, courses]);

  const resetForm = () => {
    setOrgId("");
    setCourseId("");
    setTemplateId("");
    setName("");
    setDescription("");
    setScheduledAt("");
    setTimezone("");
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orgId) return alert("Please choose an Organization.");
    if (!courseId) return alert("Please choose a Course.");
    if (!templateId) return alert("Please choose a Template.");
    if (!name.trim()) return alert("Please enter a Campaign Name.");
    if (!scheduledAt) return alert("Please pick a Scheduled time.");
    if (!timezone) return alert("Missing timezone (comes from Course).");

    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const payload = {
        org_id: orgId,
        course_id: courseId,
        template_id: templateId,
        name,
        description: description || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        timezone,
        status: "scheduled",
        audience_kind: "all_contacts",
        client_visible: true,
        created_by: userId,
      } as const;

      const { data, error } = await supabase
        .from("campaigns")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error(error);
        alert(`Failed to create campaign: ${error.message}`);
        return;
      }

      try {
        await supabase.from("calendar_events").insert({
          org_id: orgId,
          course_id: courseId,
          campaign_id: data.id,
          title: name,
          description: description || null,
          start_time: new Date(scheduledAt).toISOString(),
          status: "scheduled",
          is_client_visible: true,
          event_type: "campaign",
          event_status: "scheduled",
        });
      } catch (calendarError) {
        console.warn("Calendar insert skipped/failed:", calendarError);
      }

      alert("Campaign scheduled!");
      resetForm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn-primary"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        Add RCS Promo
      </button>
      {open && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              type="button"
              className="btn mb-2"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
            >
              Back
            </button>
            <h3 className="section-title">Schedule RCS Promo</h3>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <Field label="Organization">
                <select
                  value={orgId}
                  onChange={(event) => setOrgId(event.target.value)}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select organization…</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Course (required)">
                <select
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select course…</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Template">
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select RCS template…</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Campaign Name">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Weekend Promo Blast"
                  required
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full border rounded p-2"
                  rows={3}
                  placeholder="Short internal note…"
                />
              </Field>

              <Field label="Scheduled Time">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </Field>

              <Field label="Timezone (auto from Course)">
                <input value={timezone} readOnly className="w-full border rounded p-2 bg-gray-50" />
              </Field>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-60">
                  {loading ? "Saving…" : "Schedule Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
