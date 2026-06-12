'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Mountain, Target, CalendarDays, BanknoteArrowUp, FileText, CheckSquare, Loader2, Coins, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { useSidebar } from "@/app/components/context/SidebarContext";

export default function Sidebar() {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const router = useRouter();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const { isCollapsed } = useSidebar();

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), exact: true },
    { href: '/dashboard/clients', icon: Mountain, label: t('clients') },
    { href: '/dashboard/users', icon: Mountain, label: t('users') },
    { href: '/dashboard/reports', icon: FileText, label: t('reports') },
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
    if (active) return 'sidebar-link-active';
    if (isLoading) return 'sidebar-link-loading';
    return 'sidebar-link';
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <Image
            src="/images/logo-an-mar-big.png"
            alt="Logo"
            width={140}
            height={60}
            className="main-logo mx-auto"
            priority
          />
        )}
        {isCollapsed && (
          <Image
            src="/images/logo-an-mar-mini.png"
            alt="Logo"
            width={40}
            height={40}
            className="main-logo mx-auto"
            priority
          />
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          const isLoading = loadingHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={getLinkClassName(active, isLoading)}
              title={isCollapsed ? item.label : ''}
            >
              {isLoading ? (
                <Loader2 className="text-blue-400 animate-spin" size={20} />
              ) : (
                <Icon className={active ? 'text-blue-400' : ''} size={20} />
              )}
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
