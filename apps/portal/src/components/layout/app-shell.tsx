import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { InstallBanner } from "@/components/pwa/install-banner";

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />

      {/* min-w-0 keeps wide page content (tab strips, long image names) from
          stretching the shell past the viewport on mobile. */}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <Topbar />
        <InstallBanner />

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-clip px-4 py-6 pb-24 sm:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
