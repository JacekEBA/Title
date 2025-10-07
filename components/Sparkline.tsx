'use client';

type SparklineProps = {
  points: number[];
  width?: number;
  height?: number;
};

export default function Sparkline({ points, width = 140, height = 40 }: SparklineProps) {
  if (!points || points.length === 0) return null;

  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      const command = index === 0 ? 'M' : 'L';
      return `${command}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="sparkline" aria-hidden>
      <path d={path} />
    </svg>
  );
}

