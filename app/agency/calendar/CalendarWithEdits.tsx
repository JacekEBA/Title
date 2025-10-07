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
  courseId: string | null;
  campaignId: string | null;
  status: string;
  orgName: string;
  courseName: string;
  templateName: string;
  scheduledAt: string;
  campaignStatus: string;
};

type CalendarWithEditProps = {
  events: EnrichedEvent[];
  orgOptions: any[];
  courseOptionsByOrg: Record<string, any[]>;
  templateOptionsByOrg: Record<string, any[]>;
  createPromoAction: (formData: FormData) => Promise<void>;
  updateEventTimeAction: (eventId: string, newScheduledAt: string) => Promise<void>;
  cancelEventAction: (eventId: string) => Promise<void>;
};

export default function CalendarWithEdit({
  events,
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  createPromoAction,
  updateEventTimeAction,
  cancelEventAction,
}: CalendarWithEditProps) {
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);

  const handleSelectEvent = (event: any) => {
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
    }
  };

  const handleUpdateEvent = async (eventId: string, newScheduledAt: string) => {
    await updateEventTimeAction(eventId, newScheduledAt);
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
            title: selectedEvent.title,
            description: selectedEvent.description,
            scheduledAt: selectedEvent.scheduledAt,
            orgName: selectedEvent.orgName,
            courseName: selectedEvent.courseName,
            templateName: selectedEvent.templateName,
            status: selectedEvent.campaignStatus,
          }}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdateEvent}
          onCancel={handleCancelEvent}
        />
      )}
    </div>
  );
}
