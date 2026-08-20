'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from "next/navigation";
import { LayoutDashboard, Mountain, MapPin, Logs, Users, Loader2, FileText, Bell, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from "react";

import { useSessionContext } from "@/app/components/providers/SessionProvider";

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  exact?: boolean;
  roles: ('admin' | 'client' | 'technician')[];
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  
  const { role } = useSessionContext();
  

  const menuItems: MenuItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), exact: true, roles: ['admin', 'client', 'technician'] },
    { href: '/dashboard/clients', icon: Mountain, label: t('clients'), roles: ['admin'] },
    { href: '/dashboard/locations', icon: MapPin, label: t('locations'), roles: ['admin', 'client'] },
    { href: '/dashboard/orders', icon: Logs, label: t('orders'), roles: ['admin', 'client', 'technician'] },
    { href: '/dashboard/users', icon: Users, label: t('users'), roles: ['admin'] },
    { href: '/dashboard/reports', icon: FileText, label: t('reports'), roles: ['admin'] },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const active = isActive(href, menuItems.find(item => item.href === href)?.exact);

    // Don't show loader if already on this page
    if (active) return;

    e.preventDefault();
    setLoadingHref(href);
    router.push(href);
  };

  // Reset loading state when pathname changes
  if (loadingHref && isActive(loadingHref, menuItems.find(item => item.href === loadingHref)?.exact)) {
    setLoadingHref(null);
  }

  const getLinkClassName = (active: boolean, isLoading: boolean) => {
    if (active) return 'mobile-nav-item-active';
    if (isLoading) return 'sidebar-link-loading';
    return 'mobile-nav-item';
  };

  return (
    <nav className="mobile-nav bg-slate-900">
      <div className="mobile-nav-container">
        {menuItems
          .filter(item => role && item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const isLoading = loadingHref === item.href;

          return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={getLinkClassName(active, isLoading)}
                
                title={item.label}
              >
                {isLoading ? (
                  <Loader2 className="text-blue-400 animate-spin"  />
                ) : (
                  <Icon  size={24} />
                )}
              </Link>
                
            );
        })}
      </div>
    </nav>

  );
}


