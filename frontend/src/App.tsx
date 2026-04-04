// frontend/src/App.tsx

import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ScrollProgress from "./shared/components/app/ScrollProgress";

const HomePage = lazy(() => import("./portfolio/pages/HomePage"));
const TrackerPage = lazy(() => import("./tracker/pages/TrackerPage"));
const AiProfilePage = lazy(() => import("./portfolio/pages/AiProfilePage"));

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

const App: React.FC = () => {
  return (
    <Router>
      <ScrollProgress />
      <GlobalHotkeys />
      <Analytics />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-white/80">
            Loading experience...
          </div>
        }
        >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<AiProfilePage />} />
          <Route path="/tracker" element={<TrackerPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
