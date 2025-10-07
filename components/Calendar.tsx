'use client';

import { useMemo, useState } from 'react';
import { Calendar as RBC, luxonLocalizer } from 'react-big-calendar';
import { DateTime } from 'luxon';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = luxonLocalizer(DateTime);

function toDate(d: any) {
  return typeof d === 'string' ? new Date(d) : d;
}

type CalendarEvent = {
  id: string;
  title: string;
  start: any;
  end: any;
};

type CalendarProps = {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

export default function Calendar({ events, onSelectEvent }: CalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());

  const processedEvents = useMemo(
    () => events.map((e) => ({ ...e, start: toDate(e.start), end: toDate(e.end) })),
    [events]
  );

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    if (action === 'TODAY') {
      newDate = new Date();
    } else if (action === 'PREV') {
      if (view === 'month') {
        newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      } else if (view === 'week') {
        newDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (view === 'day') {
        newDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      }
    } else if (action === 'NEXT') {
      if (view === 'month') {
        newDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      } else if (view === 'week') {
        newDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (view === 'day') {
        newDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    
    setDate(newDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div className="seg">
          <button
            type="button"
            className={view === 'month' ? 'btn-tab active' : 'btn-tab'}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={view === 'week' ? 'btn-tab active' : 'btn-tab'}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={view === 'day' ? 'btn-tab active' : 'btn-tab'}
            onClick={() => setView('day')}
          >
            Day
          </button>
        </div>
        <div className="seg">
          <button 
            type="button"
            className="btn" 
            onClick={() => handleNavigate('TODAY')}
          >
            Today
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => handleNavigate('PREV')}
          >
            ← Prev
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => handleNavigate('NEXT')}
          >
            Next →
          </button>
        </div>
      </div>

      <RBC
        localizer={localizer}
        events={processedEvents}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={(v) => setView(v as 'month' | 'week' | 'day')}
        date={date}
        onNavigate={(d) => setDate(d)}
        onSelectEvent={onSelectEvent}
        selectable
        popup
        style={{ height: 700 }}
      />
    </div>
  );
}
