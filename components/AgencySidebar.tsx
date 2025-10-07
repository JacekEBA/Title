'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Calendar as CalendarIcon, LayoutDashboard, Settings, Users2 } from 'lucide-react';

type NavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
};

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link href={href} className={active ? 'nav-item active' : 'nav-item'}>
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

export default function AgencySidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="flag" />
        <span className="brand-name">Title</span>
      </div>
      <nav className="nav">
        <NavItem href="/agency" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/agency/clients" icon={Users2} label="Clients" />
        <NavItem href="/agency/calendar" icon={CalendarIcon} label="Calendar" />
        <NavItem href="/agency/settings" icon={Settings} label="Settings" />
      </nav>
      <div className="sidebar-footer">Golf RCS • Agency</div>
    </aside>
  );
}

