'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import ViewEventModal from './ViewEventModal';

type EnrichedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string | null;
  campaignId: string;
  courseId: string;
  courseName: string;
  templateName: string;
  scheduledAt: string;
  timezone: string;
  status: string;
  campaignStatus: string;
};

type OrgCalendarViewProps = {
  events: EnrichedEvent[];
};

export default function OrgCalendarView({ events }: OrgCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);

  const handleSelectEvent = (event: any) => {
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
    }
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
      <h1 className="page-title">Campaign Calendar</h1>
      
      <div className="card">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No campaigns scheduled yet. Your agency will schedule campaigns for you.
          </p>
        ) : (
          <Calendar events={calendarEvents} onSelectEvent={handleSelectEvent} />
        )}
      </div>

      {selectedEvent && (
        <ViewEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

// Save this as: app/org/[orgId]/calendar/OrgCalendarView.tsx
