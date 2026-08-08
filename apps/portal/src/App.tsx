import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/require-auth";
import { RequireAdmin } from "@/components/auth/require-admin";
import { AppShell } from "@/components/layout/app-shell";
import { AppsPage } from "@/pages/apps-page";
import { ComingSoonPage } from "@/pages/coming-soon-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { SystemPage } from "@/pages/system-page";
import { UsersPage } from "@/pages/users-page";
import { navItems } from "@/lib/nav-items";

const soonRoutes = navItems.filter((item) => item.status === "soon");

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route element={<RequireAuth />}>
            <Route index element={<DashboardPage />} />
            <Route path="apps" element={<AppsPage />} />
            <Route path="system" element={<SystemPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
            {soonRoutes.map((item) => (
              <Route
                key={item.id}
                path={item.to.slice(1)}
                element={<ComingSoonPage />}
              />
            ))}
          </Route>
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
