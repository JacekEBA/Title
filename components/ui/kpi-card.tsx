import type { ReactNode } from "react";

export type KpiCardProps = {
  title: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
};

export function KpiCard({ title, value, trend, icon }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {trend && <div className="text-xs text-muted-foreground">{trend}</div>}
    </div>
  );
}
