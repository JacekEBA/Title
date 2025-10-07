import '../../../styles/globals.css';
import LineChart from '../../../components/LineChart';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from('agency_daily_metrics')
    .select('date, delivered_like, replies, clicks, reads');
  const labels = (rows ?? []).map((row) => row.date);
  const delivered = (rows ?? []).map((row) => row.delivered_like ?? 0);
  const replies = (rows ?? []).map((row) => row.replies ?? 0);

  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href="/agency/calendar">
          Calendar
        </a>
        <a className="btn" href="/agency/clients">
          Clients
        </a>
        <a className="btn btn-primary">Analytics</a>
        <a className="btn" href="/agency/inbox">
          Inbox
        </a>
        <a className="btn" href="/agency/settings">
          Settings
        </a>
      </div>
      <h2>Agency Analytics</h2>
      <div className="card">
        <LineChart labels={labels} series={delivered} label="Delivered-like" />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <LineChart labels={labels} series={replies} label="Replies" />
      </div>
    </div>
  );
}
