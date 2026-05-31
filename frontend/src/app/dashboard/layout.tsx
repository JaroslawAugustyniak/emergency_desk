import Sidebar from "@/app/components/dashboard/Sidebar";
import Topbar from "@/app/components/dashboard/Topbar";
import MobileNav from "@/app/components/dashboard/MobileNav";
import SessionProvider from "@/app/components/providers/SessionProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}


