import type { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  children?: ReactNode;
};

export default function KpiCard({ label, value, delta, children }: KpiCardProps) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        {delta && <div className="kpi-delta">↑ {delta}</div>}
      </div>
      <div className="kpi-value">{value}</div>
      {children && <div className="kpi-extra">{children}</div>}
    </div>
  );
}

