'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Point = {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  clicked: number;
  bookings: number;
};

export default function AgencyLineChart({ rows }: { rows: Point[] }) {
  const labels = rows.map((r) => r.date);
  const mk = (key: keyof Point) => rows.map((r) => Number(r[key] || 0));

  const data = {
    labels,
    datasets: [
      { label: 'Sent', data: mk('sent') },
      { label: 'Delivered', data: mk('delivered') },
      { label: 'Read', data: mk('read') },
      { label: 'Replied', data: mk('replied') },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: { x: { ticks: { maxRotation: 0 } } },
  };

  return (
    <div style={{ height: 280 }}>
      <Line data={data} options={options} />
    </div>
  );
}
