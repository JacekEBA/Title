import Calendar from '@/components/Calendar';
import { getCalendarEventsForOwner } from '@/lib/agency';

export const metadata = { title: 'Agency • Calendar' };

export default async function Page() {
  const now = Date.now();
  const from = new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString();
  const to = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString();
  const eventsRaw = await getCalendarEventsForOwner({ from, to });
  const events = eventsRaw.map((event) => ({
    id: event.id,
    title: event.title ?? 'Promo',
    start: event.start_time,
    end: event.end_time ?? event.start_time,
  }));

  return (
    <div className="page">
      <h1 className="page-title">Calendar</h1>
      <div className="card">
        <Calendar events={events} />
      </div>
    </div>
  );
}

