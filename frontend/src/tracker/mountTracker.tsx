import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";

export const mountTracker = () => {
  const root = document.getElementById("root");
  if (!root) return;

  createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <TrackerPage />
      </BrowserRouter>
    </React.StrictMode>,
  );
};
