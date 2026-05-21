import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import HomePageApp from "./HomePageApp";

export const mountHomePage = () => {
  const root = document.getElementById("root");
  if (!root) return;

  const app = (
    <React.StrictMode>
      <HomePageApp />
    </React.StrictMode>
  );

  if (
    root.dataset.prerendered === "homepage" &&
    window.location.pathname === "/"
  ) {
    hydrateRoot(root, app);
    return;
  }

  createRoot(root).render(app);
};
