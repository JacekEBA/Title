import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { requireAgencyAccess } from '@/lib/auth';
import AgencySidebar from '@/components/AgencySidebar';

export const metadata: Metadata = {
  title: 'Agency Dashboard',
};

export default async function AgencyLayout({ children }: { children: ReactNode }) {
  // SECURITY: Require owner or agency_staff role
  await requireAgencyAccess();
  
  return (
    <div className="shell">
      <AgencySidebar />
      <main className="content">{children}</main>
    </div>
  );
}
