// frontend/src/main.tsx

import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (root.dataset.prerendered === "homepage" && window.location.pathname === "/") {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
