import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/require-auth";
import { RequireAdmin } from "@/components/auth/require-admin";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { AppsPage } from "@/pages/apps-page";
import { SettingsPage } from "@/pages/settings-page";
import { navItems } from "@/lib/nav-items";
import { ComingSoonPage } from "@/pages/coming-soon-page";

const AssistantPage = lazy(() =>
  import("@/pages/assistant-page").then((module) => ({
    default: module.AssistantPage,
  })),
);
const SystemPage = lazy(() =>
  import("@/pages/system-page").then((module) => ({
    default: module.SystemPage,
  })),
);
const ServicesPage = lazy(() =>
  import("@/pages/services-page").then((module) => ({
    default: module.ServicesPage,
  })),
);
const MatchdayPage = lazy(() =>
  import("@/pages/matchday-page").then((module) => ({
    default: module.MatchdayPage,
  })),
);
const JellyfinPage = lazy(() =>
  import("@/pages/jellyfin-page").then((module) => ({
    default: module.JellyfinPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/pages/users-page").then((module) => ({
    default: module.UsersPage,
  })),
);

const soonRoutes = navItems.filter((item) => item.status === "soon");

function RouteFallback() {
  return (
    <div className="py-8 text-sm text-muted-foreground">Chargement…</div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route element={<RequireAuth />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="assistant"
              element={
                <LazyPage>
                  <AssistantPage />
                </LazyPage>
              }
            />
            <Route path="apps" element={<AppsPage />} />
            <Route
              path="system"
              element={
                <LazyPage>
                  <SystemPage />
                </LazyPage>
              }
            />
            <Route
              path="matchday"
              element={
                <LazyPage>
                  <MatchdayPage />
                </LazyPage>
              }
            />
            <Route
              path="jellyfin"
              element={
                <LazyPage>
                  <JellyfinPage />
                </LazyPage>
              }
            />
            <Route
              path="services"
              element={
                <LazyPage>
                  <ServicesPage />
                </LazyPage>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route element={<RequireAdmin />}>
              <Route
                path="users"
                element={
                  <LazyPage>
                    <UsersPage />
                  </LazyPage>
                }
              />
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
