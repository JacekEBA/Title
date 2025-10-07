'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function LineChart({
  labels,
  series,
  label,
}: {
  labels: string[];
  series: number[];
  label: string;
}) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: series,
        fill: false,
        borderColor: '#8BC34A',
        backgroundColor: 'rgba(139, 195, 74, 0.2)',
        tension: 0.3,
      },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: false };
  return (
    <div style={{ height: 300 }}>
      <Line data={data} options={options} />
    </div>
  );
}
