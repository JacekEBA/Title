'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import AddPromoModal from './AddPromoModal';
import EditEventModal from './EditEventModal';

type EnrichedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string | null;
  orgId: string;
  courseId: string;
  campaignId: string;
  templateId: string;
  status: string;
  orgName: string;
  courseName: string;
  templateName: string;
  scheduledAt: string;
  timezone: string;
  campaignStatus: string;
};

type CalendarWithEditProps = {
  events: EnrichedEvent[];
  orgOptions: any[];
  courseOptionsByOrg: Record<string, any[]>;
  templateOptionsByOrg: Record<string, any[]>;
  createPromoAction: (formData: FormData) => Promise<void>;
  updateEventAction: (data: {
    eventId: string;
    campaignId: string;
    name: string;
    description: string | null;
    scheduledAt: string;
    timezone: string;
    orgId: string;
    courseId: string;
    templateId: string;
  }) => Promise<void>;
  cancelEventAction: (eventId: string) => Promise<void>;
};

export default function CalendarWithEdit({
  events,
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  createPromoAction,
  updateEventAction,
  cancelEventAction,
}: CalendarWithEditProps) {
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);

  const handleSelectEvent = (event: any) => {
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
    }
  };

  const handleUpdateEvent = async (data: {
    eventId: string;
    campaignId: string;
    name: string;
    description: string | null;
    scheduledAt: string;
    timezone: string;
    orgId: string;
    courseId: string;
    templateId: string;
  }) => {
    await updateEventAction(data);
    setSelectedEvent(null);
    window.location.reload();
  };

  const handleCancelEvent = async (eventId: string) => {
    await cancelEventAction(eventId);
    setSelectedEvent(null);
    window.location.reload();
  };

  const createPromo = async (formData: FormData) => {
    await createPromoAction(formData);
  };

  // Map events for calendar display
  const calendarEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <AddPromoModal
          orgOptions={orgOptions}
          courseOptionsByOrg={courseOptionsByOrg}
          templateOptionsByOrg={templateOptionsByOrg}
          action={createPromo}
        />
      </div>
      
      <div className="card">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No events scheduled yet. Click "Add RCS Promo" to get started.
          </p>
        ) : (
          <Calendar events={calendarEvents} onSelectEvent={handleSelectEvent} />
        )}
      </div>

      {selectedEvent && (
        <EditEventModal
          event={{
            id: selectedEvent.id,
            campaignId: selectedEvent.campaignId,
            title: selectedEvent.title,
            description: selectedEvent.description,
            scheduledAt: selectedEvent.scheduledAt,
            orgId: selectedEvent.orgId,
            courseId: selectedEvent.courseId,
            templateId: selectedEvent.templateId,
            orgName: selectedEvent.orgName,
            courseName: selectedEvent.courseName,
            templateName: selectedEvent.templateName,
            timezone: selectedEvent.timezone,
            status: selectedEvent.campaignStatus,
          }}
          orgOptions={orgOptions}
          courseOptionsByOrg={courseOptionsByOrg}
          templateOptionsByOrg={templateOptionsByOrg}
          onClose={() => setSelectedEvent(null)}
          onUpdate={async (data) => {
            await handleUpdateEvent(data);
          }}
          onCancel={handleCancelEvent}
        />
      )}
    </div>
  );
}
