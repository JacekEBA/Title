'use client';

import { useEffect, useState, type FormEvent } from 'react';

type EventDetails = {
  id: string;
  campaignId: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  orgId: string;
  courseId: string;
  templateId: string;
  orgName: string;
  courseName: string;
  templateName: string;
  timezone: string;
  status: string;
  sendWindowStart?: string | null;
  sendWindowEnd?: string | null;
  dripEnabled?: boolean;
  dripBatchSize?: number;
  dripIntervalMinutes?: number;
};

type CourseOption = {
  id: string;
  name: string;
  timezone: string;
  send_window_start?: string | null;
  send_window_end?: string | null;
};

type TemplateOption = {
  id: string;
  name: string;
};

type OrgOption = {
  id: string;
  name: string;
};

type EditEventModalProps = {
  event: EventDetails | null;
  orgOptions: OrgOption[];
  courseOptionsByOrg: Record<string, CourseOption[]>;
  templateOptionsByOrg: Record<string, TemplateOption[]>;
  onClose: () => void;
  onUpdate: (data: {
    eventId: string;
    campaignId: string;
    name: string;
    description: string | null;
    scheduledAt: string;
    timezone: string;
    orgId: string;
    courseId: string;
    templateId: string;
    sendWindowStart?: string | null;
    sendWindowEnd?: string | null;
    dripEnabled?: boolean;
    dripBatchSize?: number;
    dripIntervalMinutes?: number;
  }) => Promise<void>;
  onCancel: (eventId: string) => Promise<void>;
};

export default function EditEventModal({
  event,
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  onClose,
  onUpdate,
  onCancel,
}: EditEventModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [orgId, setOrgId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [timezone, setTimezone] = useState('');
  
  // Send window settings
  const [sendWindowStart, setSendWindowStart] = useState('');
  const [sendWindowEnd, setSendWindowEnd] = useState('');
  
  // Drip settings
  const [dripEnabled, setDripEnabled] = useState(false);
  const [dripBatchSize, setDripBatchSize] = useState('10');
  const [dripIntervalMinutes, setDripIntervalMinutes] = useState('5');

  // Get courses and templates for selected org
  const courses = orgId ? (courseOptionsByOrg[orgId] ?? []) : [];
  const templates = orgId ? (templateOptionsByOrg[orgId] ?? []) : [];

  useEffect(() => {
    if (event) {
      setName(event.title);
      setDescription(event.description ?? '');
      setOrgId(event.orgId);
      setCourseId(event.courseId);
      setTemplateId(event.templateId);
      setTimezone(event.timezone);
      setSendWindowStart(event.sendWindowStart || '');
      setSendWindowEnd(event.sendWindowEnd || '');
      setDripEnabled(event.dripEnabled ?? false);
      setDripBatchSize((event.dripBatchSize ?? 10).toString());
      setDripIntervalMinutes((event.dripIntervalMinutes ?? 5).toString());
      
      // Convert ISO to datetime-local format
      const date = new Date(event.scheduledAt);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(localDateTime);
    }
  }, [event]);

  // Update timezone when course changes
  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return;
    }
    setTimezone(course.timezone ?? 'UTC');
    
    // Load send window from course if not already set
    if (!sendWindowStart && course.send_window_start) {
      setSendWindowStart(course.send_window_start);
    }
    if (!sendWindowEnd && course.send_window_end) {
      setSendWindowEnd(course.send_window_end);
    }
  }, [courseId, courses]);

  if (!event) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Campaign name is required');
      return;
    }
    if (!orgId || !courseId || !templateId) {
      alert('Please select organization, course, and template');
      return;
    }
    if (!scheduledAt) {
      alert('Please select a scheduled time');
      return;
    }

    // Validate send window
    if (sendWindowStart && !sendWindowEnd) {
      alert('Please set both start and end times for send window, or leave both blank.');
      return;
    }
    if (!sendWindowStart && sendWindowEnd) {
      alert('Please set both start and end times for send window, or leave both blank.');
      return;
    }

    setLoading(true);
    try {
      // Convert to ISO
      const isoDateTime = new Date(scheduledAt).toISOString();
      
      await onUpdate({
        eventId: event.id,
        campaignId: event.campaignId,
        name: name.trim(),
        description: description.trim() || null,
        scheduledAt: isoDateTime,
        timezone,
        orgId,
        courseId,
        templateId,
        sendWindowStart: sendWindowStart || null,
        sendWindowEnd: sendWindowEnd || null,
        dripEnabled,
        dripBatchSize: dripEnabled ? parseInt(dripBatchSize) : undefined,
        dripIntervalMinutes: dripEnabled ? parseInt(dripIntervalMinutes) : undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this campaign?')) {
      return;
    }

    setLoading(true);
    try {
      await onCancel(event.id);
      onClose();
    } catch (error) {
      console.error('Failed to cancel event:', error);
      alert('Failed to cancel event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = event.status === 'scheduled' || event.status === 'draft';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background pb-4 border-b border-border z-10">
          <h2 className="section-title mb-0">
            {canEdit ? 'Edit Campaign' : 'Campaign Details'}
          </h2>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {canEdit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Organization</span>
              <select
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value);
                  setCourseId('');
                  setTemplateId('');
                }}
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
            </label>

            {/* Course */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Course</span>
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
            </label>

            {/* Template */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Template</span>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="input"
                required
                disabled={!orgId || loading}
              >
                <option value="">
                  {!orgId ? 'Select organization first…' : 'Select template…'}
                </option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Campaign Name */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Campaign Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Weekend Promo Blast"
                required
                disabled={loading}
              />
            </label>

            {/* Description */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="Short internal note…"
                disabled={loading}
              />
            </label>

            {/* Scheduled Time */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Scheduled Time</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </label>

            {/* Timezone */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Timezone (auto from Course)</span>
              <input
                type="text"
                value={timezone}
                readOnly
                className="input bg-muted"
                disabled={loading}
              />
            </label>

            {/* Send Window Settings */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-2">⏰ Send Window (Optional)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Restrict when messages can be sent. Messages scheduled outside this window will wait until the next available time.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium block">Start Time</label>
                  <input
                    type="time"
                    value={sendWindowStart}
                    onChange={(e) => setSendWindowStart(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., 09:00 (9 AM)
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium block">End Time</label>
                  <input
                    type="time"
                    value={sendWindowEnd}
                    onChange={(e) => setSendWindowEnd(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., 20:00 (8 PM)
                  </p>
                </div>
              </div>

              {sendWindowStart && sendWindowEnd && (
                <p className="text-xs text-green-600 mt-3">
                  ✓ Messages will only be sent between {sendWindowStart} and {sendWindowEnd} ({timezone})
                </p>
              )}
            </div>

            {/* Drip Campaign Settings */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="dripEnabled"
                  checked={dripEnabled}
                  onChange={(e) => setDripEnabled(e.target.checked)}
                  className="w-4 h-4"
                  disabled={loading}
                />
                <label htmlFor="dripEnabled" className="text-sm font-semibold cursor-pointer">
                  💧 Enable Drip Campaign (send gradually)
                </label>
              </div>

              {dripEnabled && (
                <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-background rounded-md">
                  <div className="space-y-1">
                    <label className="text-sm font-medium block">Contacts per Batch</label>
                    <input
                      type="number"
                      value={dripBatchSize}
                      onChange={(e) => setDripBatchSize(e.target.value)}
                      className="input"
                      min="1"
                      max="1000"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many contacts to message at once
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium block">Minutes Between Batches</label>
                    <input
                      type="number"
                      value={dripIntervalMinutes}
                      onChange={(e) => setDripIntervalMinutes(e.target.value)}
                      className="input"
                      min="1"
                      max="1440"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Wait time before sending next batch
                    </p>
                  </div>
                </div>
              )}
              
              {dripEnabled && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Messages will be sent in batches of {dripBatchSize} every {dripIntervalMinutes} minutes
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn bg-red-500 text-white hover:bg-red-600 border-red-500"
              >
                {loading ? 'Cancelling...' : 'Cancel Campaign'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Organization:</span>
              <p>{event.orgName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Course:</span>
              <p>{event.courseName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Template:</span>
              <p>{event.templateName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Campaign Name:</span>
              <p>{event.title}</p>
            </div>
            {event.description && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Description:</span>
                <p>{event.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Scheduled:</span>
              <p>{new Date(event.scheduledAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <p className="capitalize">{event.status}</p>
            </div>
            
            {/* Send Window Display */}
            {(event.sendWindowStart || event.sendWindowEnd) && (
              <div className="border-t border-border pt-3 mt-3">
                <span className="text-sm font-medium text-muted-foreground">Send Window:</span>
                <p className="text-sm">
                  {event.sendWindowStart} - {event.sendWindowEnd} ({event.timezone})
                </p>
              </div>
            )}
            
            {/* Drip Settings Display */}
            {event.dripEnabled && (
              <div className="border-t border-border pt-3 mt-3">
                <span className="text-sm font-medium text-muted-foreground">Drip Campaign:</span>
                <p className="text-sm">Batch Size: {event.dripBatchSize} contacts</p>
                <p className="text-sm">Interval: {event.dripIntervalMinutes} minutes</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                className="btn"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
