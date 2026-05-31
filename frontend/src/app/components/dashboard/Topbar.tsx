'use client';

import Image from 'next/image';
import LanguageSwitcher from "@/app/components/ui/LanguageSwitcher";
import UserMenu from "@/app/components/dashboard/UserMenu";

export default function Topbar() {
  return (
    <header className="topbar">
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Image
          src="/images/logo.svg"
          alt="Logo"
          width={40}
          height={40}
          className="main-logo mx-auto md:hidden"
          priority
        />
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <LanguageSwitcher />
        <UserMenu isPortalUser={false} />
      </div>
    </header>
  );
}
