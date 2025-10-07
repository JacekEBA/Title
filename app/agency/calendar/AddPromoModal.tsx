'use client';
//test
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

type OrgOption = {
  id: string;
  name: string;
};

type CourseOption = {
  id: string;
  name: string;
  timezone: string;
};

type TemplateOption = {
  id: string;
  name: string;
};

type AddPromoModalProps = {
  orgOptions: OrgOption[];
  courseOptionsByOrg: Record<string, CourseOption[]>;
  templateOptionsByOrg: Record<string, TemplateOption[]>;
  action: (formData: FormData) => Promise<void>;
};

export default function AddPromoModal({
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  action,
}: AddPromoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [orgId, setOrgId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [templateId, setTemplateId] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('');

  // Get courses and templates for selected org
  const courses = orgId ? (courseOptionsByOrg[orgId] ?? []) : [];
  const templates = orgId ? (templateOptionsByOrg[orgId] ?? []) : [];

  // Reset dependent fields when org changes
  useEffect(() => {
    setCourseId('');
    setTemplateId('');
    setTimezone('');
  }, [orgId]);

  // Update timezone when course changes
  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    setTimezone(course?.timezone ?? '');
  }, [courseId, courses]);

  const resetForm = () => {
    setOrgId('');
    setCourseId('');
    setTemplateId('');
    setName('');
    setDescription('');
    setScheduledAt('');
    setTimezone('');
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    setOpen(false);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validation
    if (!orgId) {
      alert('Please choose an Organization.');
      return;
    }
    if (!courseId) {
      alert('Please choose a Course.');
      return;
    }
    if (!templateId) {
      alert('Please choose a Template.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a Campaign Name.');
      return;
    }
    if (!scheduledAt) {
      alert('Please pick a Scheduled time.');
      return;
    }
    if (!timezone) {
      alert('Missing timezone (comes from Course).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('org_id', orgId);
      formData.set('course_id', courseId);
      formData.set('template_id', templateId);
      formData.set('name', name);
      formData.set('description', description);
      formData.set('scheduled_at', scheduledAt);
      formData.set('timezone', timezone);

      await action(formData);

      alert('Campaign scheduled successfully!');
      resetForm();
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create campaign: ${message}`);
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
        type="button"
      >
        Add RCS Promo
      </button>

      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Schedule RCS Promo</h2>
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Organization">
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="input"
                  required
                  disabled={loading}
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
                  onChange={(e) => setCourseId(e.target.value)}
                  className="input"
                  required
                  disabled={!orgId || loading}
                >
                  <option value="">
                    {!orgId ? 'Select organization first…' : 'Select course…'}
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
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="input"
                  required
                  disabled={!orgId || loading}
                >
                  <option value="">
                    {!orgId
                      ? 'Select organization first…'
                      : 'Select RCS template…'}
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
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Weekend Promo Blast"
                  required
                  disabled={loading}
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Short internal note…"
                  disabled={loading}
                />
              </Field>

              <Field label="Scheduled Time">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input"
                  required
                  disabled={loading}
                />
              </Field>

              <Field label="Timezone (auto from Course)">
                <input
                  value={timezone}
                  readOnly
                  className="input bg-muted"
                  disabled={loading}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving…' : 'Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
