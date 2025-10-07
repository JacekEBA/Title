"use client";

import { useEffect, useState, type ReactNode } from "react";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

type Props = {
  orgOptions: Array<{ id: string; name: string }>;
  courseOptionsByOrg: Record<string, Array<{ id: string; name: string; timezone: string }>>;
  templateOptionsByOrg: Record<string, Array<{ id: string; name: string }>>;
  action: (formData: FormData) => Promise<void>;
};

export default function AddPromoModal({
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  action,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [orgId, setOrgId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState("");

  // Get courses and templates for selected org
  const courses = orgId ? (courseOptionsByOrg[orgId] ?? []) : [];
  const templates = orgId ? (templateOptionsByOrg[orgId] ?? []) : [];

  // Reset dependent fields when org changes
  useEffect(() => {
    setCourseId("");
    setTemplateId("");
    setTimezone("");
  }, [orgId]);

  // Update timezone when course changes
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
      const formData = new FormData();
      formData.set("org_id", orgId);
      formData.set("course_id", courseId);
      formData.set("template_id", templateId);
      formData.set("name", name);
      formData.set("description", description);
      formData.set("scheduled_at", scheduledAt);
      formData.set("timezone", timezone);

      await action(formData);

      alert("Campaign scheduled!");
      resetForm();
      setOpen(false);
      window.location.reload(); // Reload to show new event
    } catch (error) {
      console.error(error);
      alert(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                  {orgOptions.map((org) => (
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
                  disabled={!orgId}
                >
                  <option value="">
                    {!orgId ? "Select organization first…" : "Select course…"}
                  </option>
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
                  disabled={!orgId}
                >
                  <option value="">
                    {!orgId ? "Select organization first…" : "Select RCS template…"}
                  </option>
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
