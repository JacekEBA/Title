import Link from 'next/link';

type OrgNavProps = {
  orgId: string;
  currentPath: 'dashboard' | 'calendar' | 'courses' | 'inbox' | 'settings';
};

export default function OrgNav({ orgId, currentPath }: OrgNavProps) {
  const links = [
    { path: 'dashboard', label: 'Dashboard', href: `/org/${orgId}` },
    { path: 'calendar', label: 'Calendar', href: `/org/${orgId}/calendar` },
    { path: 'courses', label: 'Courses', href: `/org/${orgId}/courses` },
    { path: 'inbox', label: 'Inbox', href: `/org/${orgId}/inbox` },
    { path: 'settings', label: 'Settings', href: `/org/${orgId}/settings` },
  ] as const;

  return (
    <nav className="tabbar">
      {links.map((link) => (
        <Link
          key={link.path}
          href={link.href}
          className={`btn ${currentPath === link.path ? 'btn-primary' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
