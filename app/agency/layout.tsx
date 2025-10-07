import { ReactNode } from 'react';
import type { Metadata } from 'next';
import AgencySidebar from '@/components/AgencySidebar';

export const metadata: Metadata = {
  title: 'Agency Dashboard',
};

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <AgencySidebar />
      <main className="content">{children}</main>
    </div>
  );
}
