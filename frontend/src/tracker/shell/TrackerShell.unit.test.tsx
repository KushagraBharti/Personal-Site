import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useTrackerAuthMock = vi.hoisted(() => vi.fn());

vi.mock("../shared/hooks/useTrackerAuth", () => ({
  useTrackerAuth: useTrackerAuthMock,
}));

vi.mock("./registry", () => ({
  defaultModuleId: "tasks",
  trackerModules: [
    { id: "tasks", label: "Tasks", Component: () => <div>Tasks module</div> },
    { id: "weekly", label: "Weekly Tasks", Component: () => <div>Weekly module</div> },
    { id: "pipeline", label: "Active Deals", Component: () => <div>Pipeline module</div> },
  ],
}));

const renderShell = async (entry = "/tracker") => {
  const { default: TrackerShell } = await import("./TrackerShell");
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <TrackerShell />
    </MemoryRouter>
  );
};

describe("TrackerShell", () => {
  beforeEach(() => {
    useTrackerAuthMock.mockReset();
    vi.resetModules();
  });

  it("shows setup-needed when Supabase is not configured", async () => {
    useTrackerAuthMock.mockReturnValue({
      session: null,
      authLoading: false,
      authError: "",
      signIn: vi.fn(),
      signOut: vi.fn(),
      isSupabaseConfigured: false,
      supabase: null,
    });

    await renderShell();

    expect(screen.getByText("SETUP REQUIRED")).toBeInTheDocument();
  });

  it("shows the loading state while auth is booting", async () => {
    useTrackerAuthMock.mockReturnValue({
      session: null,
      authLoading: true,
      authError: "",
      signIn: vi.fn(),
      signOut: vi.fn(),
      isSupabaseConfigured: true,
      supabase: {},
    });

    await renderShell();

    expect(screen.getByText("LOADING SYSTEM...")).toBeInTheDocument();
  });

  it("shows the login state when there is no active session", async () => {
    useTrackerAuthMock.mockReturnValue({
      session: null,
      authLoading: false,
      authError: "Invalid credentials",
      signIn: vi.fn(),
      signOut: vi.fn(),
      isSupabaseConfigured: true,
      supabase: {},
    });

    await renderShell();

    expect(screen.getByText("TRACKER")).toBeInTheDocument();
    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  it("renders the authenticated shell and normalizes an invalid module query param", async () => {
    useTrackerAuthMock.mockReturnValue({
      session: {
        user: { id: "user-1" },
      },
      authLoading: false,
      authError: "",
      signIn: vi.fn(),
      signOut: vi.fn(),
      isSupabaseConfigured: true,
      supabase: {},
    });

    await renderShell("/tracker?module=not-real");

    await waitFor(() => {
      expect(screen.getByText("Tasks module")).toBeInTheDocument();
      expect(screen.getByText("BUILT FOR EXECUTION")).toBeInTheDocument();
    });
  });
});
