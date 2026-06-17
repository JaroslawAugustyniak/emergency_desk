'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/app/components/dashboard/Sidebar";
import Topbar from "@/app/components/dashboard/Topbar";
import MobileNav from "@/app/components/dashboard/MobileNav";
import { SidebarProvider } from "@/app/components/context/SidebarContext";
import { PageTitleProvider } from "@/app/components/context/PageTitleContext";
import NavigationTracker from "@/app/components/ui/NavigationTracker";
import { useSessionContext } from "@/app/components/providers/SessionProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, isLoading } = useSessionContext();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <SidebarProvider>
      <PageTitleProvider>
        <NavigationTracker />
        <div className="dashboard-container">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:flex md:flex-col">
              <Sidebar />
            </div>

            <div className="dashboard-main">
              <Topbar />
              <main className="dashboard-content pb-20 md:pb-6">{children}</main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
          </div>
        </PageTitleProvider>
      </SidebarProvider>
  );
}


