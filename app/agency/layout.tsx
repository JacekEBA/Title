import type { ReactNode } from 'react';

import '@/styles/globals.css';
import AgencySidebar from '@/components/AgencySidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <AgencySidebar />
      <section className="content">{children}</section>
    </div>
  );
}

