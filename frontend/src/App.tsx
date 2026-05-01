// frontend/src/App.tsx

import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import ScrollProgress from "./shared/components/app/ScrollProgress";
import CustomCursor from "./shared/components/ui/CustomCursor";

import HomePage from "./portfolio/pages/HomePage";

const TrackerPage = lazy(() => import("./tracker/pages/TrackerPage"));
const AiProfilePage = lazy(() => import("./portfolio/pages/AiProfilePage"));
type AnalyticsComponent = React.ComponentType;

const LazyRouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center text-white/80">
    Loading experience...
  </div>
);

const GlobalHotkeys: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (key !== "t" && key !== "h") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (isTyping) return;
      navigate(key === "t" ? "/tracker" : "/");
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [navigate]);

  return null;
};

export const AppContent: React.FC = () => {
  const [Analytics, setAnalytics] = React.useState<AnalyticsComponent | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;

    if (!import.meta.env.PROD) {
      return () => {
        isMounted = false;
      };
    }

    const loadAnalytics = () => {
      timeoutId = window.setTimeout(() => {
        void import("@vercel/analytics/react")
          .then((module) => {
            if (isMounted) {
              setAnalytics(() => module.Analytics);
            }
          })
          .catch(() => {
            // Ad blockers often block analytics. Keep the app silent and fast.
          });
      }, 2500);
    };

    if (document.readyState === "complete") {
      loadAnalytics();
    } else {
      window.addEventListener("load", loadAnalytics, { once: true });
    }

    return () => {
      isMounted = false;
      window.removeEventListener("load", loadAnalytics);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <GlobalHotkeys />
      {Analytics ? <Analytics /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/ai"
          element={
            <Suspense fallback={<LazyRouteFallback />}>
              <AiProfilePage />
            </Suspense>
          }
        />
        <Route
          path="/tracker"
          element={
            <Suspense fallback={<LazyRouteFallback />}>
              <TrackerPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
