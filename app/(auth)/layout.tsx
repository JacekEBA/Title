import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="bg-muted/40 text-foreground min-h-screen">{children}</div>;
}
