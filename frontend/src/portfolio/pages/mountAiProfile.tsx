import React from "react";
import { createRoot } from "react-dom/client";
import AiProfilePage from "./AiProfilePage";

export const mountAiProfile = () => {
  const root = document.getElementById("root");
  if (!root) return;

  createRoot(root).render(
    <React.StrictMode>
      <AiProfilePage />
    </React.StrictMode>,
  );
};
