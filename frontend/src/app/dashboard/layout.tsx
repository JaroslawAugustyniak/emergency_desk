import Sidebar from "@/app/components/dashboard/Sidebar";
import Topbar from "@/app/components/dashboard/Topbar";
import MobileNav from "@/app/components/dashboard/MobileNav";
import { SidebarProvider } from "@/app/components/context/SidebarContext";
import { PageTitleProvider } from "@/app/components/context/PageTitleContext";
import NavigationTracker from "@/app/components/ui/NavigationTracker"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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


