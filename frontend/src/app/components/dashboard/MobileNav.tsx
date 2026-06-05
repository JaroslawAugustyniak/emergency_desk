'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Mountain, Target, CheckSquare, CalendarDays, BanknoteArrowUp, FileText, Bell, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('dashboard');



    const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), exact: true },
    { href: '/dashboard/clients', icon: Mountain, label: t('clients') },
    { href: '/dashboard/reports', icon: FileText, label: t('reports') },
    // { href: '/dashboard/reminders', icon: Bell, label: t('reminders') },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="mobile-nav bg-slate-900">
      <div className="mobile-nav-container">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'mobile-nav-item-active' : 'mobile-nav-item'}
              title={item.label}
            >
              <Icon size={24} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
