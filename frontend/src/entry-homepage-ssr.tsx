import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppContent } from "./App";

export const renderHomepage = () =>
  renderToString(
    <React.StrictMode>
      <MemoryRouter initialEntries={["/"]}>
        <AppContent />
      </MemoryRouter>
    </React.StrictMode>
  );
