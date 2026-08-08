import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />

      <div className="flex min-h-svh flex-1 flex-col">
        <Topbar />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
