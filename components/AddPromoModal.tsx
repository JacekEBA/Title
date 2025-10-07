'use client';
import { Plus } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

type CourseOption = { id: string; name: string; timezone: string };
type TemplateOption = { id: string; name: string };

export default function AddPromoModal({
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  action,
}: {
  orgOptions: { id: string; name: string }[];
  courseOptionsByOrg: Record<string, CourseOption[]>;
  templateOptionsByOrg: Record<string, TemplateOption[]>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const courses: CourseOption[] = orgId ? courseOptionsByOrg[orgId] ?? [] : [];
  const templates: TemplateOption[] = orgId ? templateOptionsByOrg[orgId] ?? [] : [];

  useEffect(() => {
    if (!courseId) {
      setTimezone('');
      return;
    }

    const selectedCourse = courses.find((course) => course.id === courseId);
    setTimezone(selectedCourse?.timezone ?? '');
  }, [courseId, courses]);

  useEffect(() => {
    if (!templateId) return;
    if (!templates.find((template) => template.id === templateId)) {
      setTemplateId('');
    }
  }, [templateId, templates]);

  const resetFormState = () => {
    setOrgId('');
    setCourseId('');
    setTimezone('');
    setTemplateId('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!timezone) {
      alert('Please choose a course so the timezone can be set.');
      return;
    }

    if (!templateId) {
      alert('Please choose an RCS template.');
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        formElement.reset();
        resetFormState();
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Something went wrong while creating the promo.';
        alert(message);
      }
    });
  };

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => {
          resetFormState();
          setOpen(true);
        }}
      >
        <Plus size={16} /> Add RCS Promo
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: 'fixed',
            inset: '10% 20%',
            background: '#fff',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => {
              resetFormState();
              setOpen(false);
            }}
            style={{ marginBottom: 8 }}
            disabled={isPending}
          >
            Back
          </button>
          <h3 style={{ marginBottom: 12 }}>Schedule RCS Promo</h3>
          <form style={{ display: 'grid', gap: 10 }} onSubmit={handleSubmit}>
            <label>
              Organization
              <select
                name="org_id"
                className="input"
                required
                value={orgId}
                onChange={(event) => {
                  const nextOrgId = event.target.value;
                  setOrgId(nextOrgId);
                  setCourseId('');
                  setTimezone('');
                  setTemplateId('');
                }}
              >
                <option value="">Select organization</option>
                {orgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Course (required)
              <select
                name="course_id"
                className="input"
                value={courseId}
                onChange={(event) => {
                  const nextCourseId = event.target.value;
                  setCourseId(nextCourseId);
                  setTemplateId('');
                }}
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Template
              <select
                name="template_id"
                className="input"
                required
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                disabled={!orgId || templates.length === 0}
              >
                <option value="">
                  {!orgId
                    ? 'Choose an organization first'
                    : templates.length === 0
                      ? 'No templates available for this organization'
                      : 'Select a template'}
                </option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <div className="col">
                <label>
                  Audience kind
                  <select name="audience_kind" className="input" required defaultValue="all_contacts">
                    <option value="all_contacts">All contacts</option>
                    <option value="contact_list">Contact list</option>
                    <option value="smart_list">Smart list</option>
                  </select>
                </label>
              </div>
              <div className="col">
                <label>
                  Audience ref (list id)
                  <input className="input" name="audience_ref" placeholder="uuid or empty" />
                </label>
              </div>
            </div>
            <label>
              Name
              <input className="input" name="name" placeholder="Promo name" required />
            </label>
            <label>
              Description
              <textarea className="input" name="description" placeholder="Optional description" />
            </label>
            <div className="row">
              <div className="col">
                <label>
                  Scheduled time (ISO)
                  <input className="input" name="scheduled_at" type="datetime-local" required />
                </label>
              </div>
              <div className="col">
                <label>
                  Timezone
                  <input
                    className="input"
                    name="timezone"
                    placeholder="America/Chicago"
                    value={timezone}
                    readOnly
                    required
                  />
                </label>
              </div>
            </div>
            <label>
              Max sends per minute (optional)
              <input className="input" name="max_sends_per_minute" type="number" placeholder="e.g. 200" />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetFormState();
                  setOpen(false);
                }}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={
                  isPending || !orgId || !courseId || !templateId || !timezone
                }
              >
                {isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
