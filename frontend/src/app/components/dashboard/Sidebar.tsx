'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function Sidebar() {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const router = useRouter();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
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
    <aside className="sidebar">
      <div className="sidebar-header">
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={80}
          height={80}
          className="main-logo mx-auto"
          priority
        />
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
            >
              {isLoading ? (
                <Loader2 className="text-blue-400 animate-spin" size={20} />
              ) : (
                <Icon className={active ? 'text-blue-400' : ''} size={20} />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
