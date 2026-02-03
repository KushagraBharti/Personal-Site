import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GlassButton from "../../components/ui/GlassButton";
import GlassCard from "../../components/ui/GlassCard";
import { trackerModules, defaultModuleId } from "./registry";
import { inputBase } from "./shared/styles";
import { TrackerProvider } from "./shared/hooks/useTrackerContext";
import { useTrackerAuth } from "./shared/hooks/useTrackerAuth";
import { TrackerModuleId } from "./shared/types";

const TrackerShell: React.FC = () => {
  const { session, authLoading, authError, signIn, signOut, isSupabaseConfigured, supabase } = useTrackerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get("module");
  const availableModuleIds = useMemo(() => trackerModules.map((module) => module.id), []);
  const resolvedModuleId = availableModuleIds.includes(moduleParam as TrackerModuleId)
    ? (moduleParam as TrackerModuleId)
    : defaultModuleId;
  const [activeModuleId, setActiveModuleId] = useState<TrackerModuleId>(resolvedModuleId);
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = () => setLoadingCount((count) => count + 1);
  const stopLoading = () => setLoadingCount((count) => Math.max(0, count - 1));
  const loadingAll = loadingCount > 0;

  const activeModule = useMemo(() => {
    return trackerModules.find((module) => module.id === activeModuleId) ?? trackerModules[0];
  }, [activeModuleId]);

  useEffect(() => {
    if (resolvedModuleId !== activeModuleId) {
      setActiveModuleId(resolvedModuleId);
    }
    if (moduleParam && resolvedModuleId === defaultModuleId && moduleParam !== defaultModuleId) {
      const next = new URLSearchParams(searchParams);
      next.set("module", defaultModuleId);
      setSearchParams(next, { replace: true });
    }
  }, [resolvedModuleId, activeModuleId, moduleParam, searchParams, setSearchParams]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Tracker setup needed</h1>
          <p className="text-sm text-white/70">
            Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your environment to enable the private tracker.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        Loading tracker...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Private Tracker</h1>
          <p className="text-sm text-white/70 mb-4">Sign in to access your tracker.</p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}
          >
            <input
              className={inputBase}
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputBase}
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && <p className="text-sm text-red-300">{authError}</p>}
            <GlassButton className="w-full py-3" type="submit">
              Sign In
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  const ActiveModuleComponent = activeModule.Component;
  const userId = session.user.id;

  return (
    <TrackerProvider value={{ session, userId, supabase, startLoading, stopLoading }}>
      <div className="min-h-screen px-4 py-8 md:px-10 text-white">
        <div className="mx-auto w-full max-w-screen-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Private</p>
              <h1 className="text-3xl font-semibold text-white">Execution Tracker</h1>
            </div>
            <GlassButton className="px-4 py-2" onClick={signOut}>
              Log out
            </GlassButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {trackerModules.map((module) => (
              <button
                key={module.id}
                onClick={() => {
                  setActiveModuleId(module.id);
                  const next = new URLSearchParams(searchParams);
                  next.set("module", module.id);
                  setSearchParams(next, { replace: true });
                }}
                className={`rounded-full px-4 py-2 text-sm ${
                  activeModuleId === module.id
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {module.label}
              </button>
            ))}
          </div>
          {loadingAll && <p className="text-sm text-white/60">Syncing data...</p>}
          <ActiveModuleComponent />
        </div>
      </div>
    </TrackerProvider>
  );
};

export default TrackerShell;
