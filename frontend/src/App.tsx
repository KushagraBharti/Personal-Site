import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ScrollProgress from "./components/ScrollProgress";
import SectionSidebar from "./components/SectionSidebar";

const Home = lazy(() => import("./pages/Home"));
const Tracker = lazy(() => import("./pages/Tracker"));

const App: React.FC = () => {
  return (
    <Router>
      <ScrollProgress />
      <SectionSidebar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-white/80">
            Loading experience...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracker" element={<Tracker />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
