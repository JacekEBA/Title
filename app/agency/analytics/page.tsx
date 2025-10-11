import type { Metadata } from 'next';
import LineChart from '@/components/LineChart';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Analytics',
};

type MetricRow = {
  date: string;
  delivered_like: number | null;
  replies: number | null;
  clicks: number | null;
  reads: number | null;
};

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  
  const { data: rows } = await supabase
    .from('agency_daily_metrics')
    .select('date, delivered_like, replies, clicks, reads')
    .order('date', { ascending: true });

  const metrics = (rows as MetricRow[]) ?? [];
  const labels = metrics.map((row) => row.date);
  const delivered = metrics.map((row) => row.delivered_like ?? 0);
  const replies = metrics.map((row) => row.replies ?? 0);
  const clicks = metrics.map((row) => row.clicks ?? 0);
  const reads = metrics.map((row) => row.reads ?? 0);

  return (
    <div className="page">
      <h1 className="page-title">Agency Analytics</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="mb-4 section-title">Delivered Messages</h2>
          <LineChart
            labels={labels}
            series={delivered}
            label="Delivered-like"
          />
        </div>

        <div className="card">
          <h2 className="mb-4 section-title">Replies</h2>
          <LineChart labels={labels} series={replies} label="Replies" />
        </div>

        <div className="card">
          <h2 className="mb-4 section-title">Reads</h2>
          <LineChart labels={labels} series={reads} label="Reads" />
        </div>

        <div className="card">
          <h2 className="mb-4 section-title">Clicks</h2>
          <LineChart labels={labels} series={clicks} label="Clicks" />
        </div>
      </div>
    </div>
  );
}
