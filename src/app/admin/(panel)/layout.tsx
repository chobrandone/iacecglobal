import { can, requirePage, roleLabels } from '@/lib/permissions';
import { AdminShell, type NavItem } from '@/components/admin/AdminShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage();
  const nav: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
    ...(can(user.role, 'content')
      ? ([
          { href: '/admin/pages', label: 'Pages', icon: 'FileText' },
          { href: '/admin/collections', label: 'Collections', icon: 'Library' },
        ] as NavItem[])
      : []),
    ...(can(user.role, 'media') ? ([{ href: '/admin/media', label: 'Media library', icon: 'Images' }] as NavItem[]) : []),
    ...(can(user.role, 'sponsorship') ? ([{ href: '/admin/submissions', label: 'Submissions', icon: 'Inbox' }] as NavItem[]) : []),
    ...(can(user.role, 'forms') ? ([{ href: '/admin/forms', label: 'Forms', icon: 'ClipboardList' }] as NavItem[]) : []),
    ...(can(user.role, 'subscribers') ? ([{ href: '/admin/subscribers', label: 'Newsletter', icon: 'Mail' }] as NavItem[]) : []),
    ...(can(user.role, 'settings') ? ([{ href: '/admin/settings', label: 'Site settings', icon: 'Settings' }] as NavItem[]) : []),
    ...(can(user.role, 'users') ? ([{ href: '/admin/users', label: 'Users', icon: 'Users' }] as NavItem[]) : []),
    { href: '/admin/account', label: 'My account', icon: 'UserRound' },
  ];
  return (
    <AdminShell nav={nav} user={{ name: user.name, email: user.email, role: roleLabels[user.role] }}>
      {children}
    </AdminShell>
  );
}
