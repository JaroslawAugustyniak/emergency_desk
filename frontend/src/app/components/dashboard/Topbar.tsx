'use client';

import Image from 'next/image';
import LanguageSwitcher from "@/app/components/ui/LanguageSwitcher";
import UserMenu from "@/app/components/dashboard/UserMenu";
import { useTranslations } from 'next-intl';
import { useSidebar } from "@/app/components/context/SidebarContext";
import { usePageTitle } from "@/app/components/context/PageTitleContext";
import { PanelLeftClose, PanelLeftOpen  } from 'lucide-react';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function Topbar() {
  const { toggleCollapsed, isCollapsed } = useSidebar();
  const t = useTranslations('dashboard');
  const { title, subtitle } = usePageTitle();

  const { user } = useSessionContext();

  return (
    <header className={`topbar ${isCollapsed ? 'topbar-collapsed' : ''}`}>
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <PanelLeftClose  size={24} className='close' />
          <PanelLeftOpen  size={24} className='open'/>
        </button>
        <Image
          src="/images/logo-an-mar-mini.png"
          alt="Logo"
          width={40}
          height={40}
          className="main-logo mx-auto md:hidden mr-3"
          priority
        />
      </div>
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* <LanguageSwitcher /> */}

        {t('welcome', {name: user?.first_name || 'Gościu'})} 
        <UserMenu isPortalUser={false} />
      </div>
    </header>
  );
}
