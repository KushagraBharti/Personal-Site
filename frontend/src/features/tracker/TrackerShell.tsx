import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { trackerModules, defaultModuleId } from "./registry";
import { TrackerProvider } from "./shared/hooks/useTrackerContext";
import { useTrackerAuth } from "./shared/hooks/useTrackerAuth";
import { TrackerModuleId } from "./shared/types";
import "./styles/neo-brutal.css";

// ============================================================================
// DECORATIVE FLOATING SHAPES
// ============================================================================

const FloatingShapes: React.FC = () => {
  const shapes = [
    { size: 72, color: "var(--neo-lime)", top: "8%", left: "3%", delay: 0, opacity: 0.9 },
    { size: 48, color: "var(--neo-pink)", top: "22%", right: "12%", delay: 0.3, opacity: 0.8 },
    { size: 95, color: "var(--neo-cyan)", bottom: "18%", left: "6%", delay: 0.8, opacity: 0.7 },
    { size: 55, color: "var(--neo-yellow)", bottom: "28%", right: "8%", delay: 1.2, opacity: 0.85 },
    { size: 42, color: "var(--neo-purple)", top: "45%", left: "88%", delay: 1.6, opacity: 0.9 },
    { size: 65, color: "var(--neo-lime)", top: "12%", left: "75%", delay: 0.4, opacity: 0.75 },
    { size: 38, color: "var(--neo-pink)", bottom: "8%", right: "20%", delay: 0.7, opacity: 0.85 },
    { size: 85, color: "var(--neo-cyan)", top: "35%", left: "2%", delay: 1.1, opacity: 0.8 },
    { size: 58, color: "var(--neo-yellow)", top: "60%", right: "3%", delay: 1.5, opacity: 0.9 },
    { size: 32, color: "var(--neo-purple)", bottom: "5%", left: "45%", delay: 2, opacity: 0.8 },
    { size: 76, color: "var(--neo-lime)", top: "15%", right: "18%", delay: 0.2, opacity: 0.6 },
    { size: 62, color: "var(--neo-cyan)", top: "42%", left: "12%", delay: 0.9, opacity: 0.85 },
    { size: 44, color: "var(--neo-yellow)", bottom: "35%", right: "25%", delay: 1.4, opacity: 0.75 },
    { size: 51, color: "var(--neo-pink)", top: "68%", left: "18%", delay: 0.6, opacity: 0.9 },
    { size: 88, color: "var(--neo-purple)", bottom: "12%", right: "6%", delay: 1.8, opacity: 0.8 },
    { size: 35, color: "var(--neo-lime)", top: "28%", right: "35%", delay: 0.5, opacity: 0.85 },
    { size: 71, color: "var(--neo-cyan)", top: "72%", left: "68%", delay: 1.3, opacity: 0.75 },
    { size: 46, color: "var(--neo-yellow)", bottom: "42%", left: "78%", delay: 2.1, opacity: 0.9 },
    { size: 83, color: "var(--neo-pink)", top: "5%", left: "45%", delay: 0.1, opacity: 0.8 },
    { size: 40, color: "var(--neo-purple)", bottom: "22%", left: "25%", delay: 1.7, opacity: 0.85 },
    { size: 67, color: "var(--neo-lime)", top: "55%", right: "42%", delay: 0.8, opacity: 0.7 },
    { size: 52, color: "var(--neo-cyan)", bottom: "15%", right: "45%", delay: 1.9, opacity: 0.9 },
    { size: 39, color: "var(--neo-yellow)", top: "38%", left: "32%", delay: 0.35, opacity: 0.8 },
    { size: 29, color: "var(--neo-lime)", top: "11%", right: "5%", delay: 1.05, opacity: 0.75 },
    { size: 73, color: "var(--neo-pink)", bottom: "38%", left: "41%", delay: 0.45, opacity: 0.8 },
    { size: 41, color: "var(--neo-cyan)", top: "52%", left: "58%", delay: 1.25, opacity: 0.9 },
    { size: 63, color: "var(--neo-yellow)", top: "28%", left: "68%", delay: 0.65, opacity: 0.85 },
    { size: 47, color: "var(--neo-purple)", bottom: "48%", right: "32%", delay: 1.35, opacity: 0.75 },
    { size: 54, color: "var(--neo-lime)", top: "78%", right: "28%", delay: 0.25, opacity: 0.9 },
    { size: 37, color: "var(--neo-pink)", top: "14%", left: "22%", delay: 0.55, opacity: 0.8 },
    { size: 79, color: "var(--neo-cyan)", bottom: "32%", left: "52%", delay: 1.45, opacity: 0.85 },
    { size: 45, color: "var(--neo-yellow)", top: "48%", right: "18%", delay: 0.75, opacity: 0.9 },
    { size: 60, color: "var(--neo-purple)", bottom: "55%", right: "15%", delay: 1.55, opacity: 0.8 },
    { size: 53, color: "var(--neo-lime)", top: "32%", left: "35%", delay: 0.85, opacity: 0.75 },
    { size: 68, color: "var(--neo-pink)", bottom: "42%", left: "23%", delay: 1.65, opacity: 0.9 },
    { size: 34, color: "var(--neo-cyan)", top: "66%", left: "78%", delay: 0.35, opacity: 0.8 },
  ];

  return (
    <>
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="neo-shape"
          style={{
            width: shape.size,
            height: shape.size,
            background: shape.color,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
            borderRadius: i % 2 === 0 ? "50%" : "0",
            transform: i % 2 === 1 ? "rotate(45deg)" : "none",
          }}
          animate={{
            y: [0, -20, 0],
            rotate: i % 2 === 1 ? [45, 55, 45] : [0, 10, 0],
          }}
          transition={{
            duration: 4,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};


// ============================================================================
// LOGIN SCREEN
// ============================================================================

const LoginScreen: React.FC<{
  onSignIn: (email: string, password: string) => void;
  error: string | null;
}> = ({ onSignIn, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email, password);
  };

  return (
    <div className="neo-tracker min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(var(--neo-black) 1px, transparent 1px),
            linear-gradient(90deg, var(--neo-black) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating shapes */}
      <FloatingShapes />

      {/* Giant rotated text in background */}
      <motion.div
        className="absolute text-[200px] font-black opacity-5 select-none pointer-events-none"
        style={{ fontFamily: "var(--neo-font-display)" }}
        initial={{ rotate: -12, x: -100 }}
        animate={{ rotate: -12, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        PRIVATE
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ y: 50, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10"
      >
        <div
          className="neo-card w-full max-w-md"
          style={{
            background: "var(--neo-yellow)",
            transform: isHovered ? "translate(-4px, -4px)" : "none",
            boxShadow: isHovered ? "10px 10px 0 var(--neo-black)" : "6px 6px 0 var(--neo-black)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Top stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-3"
            style={{
              background: "repeating-linear-gradient(90deg, var(--neo-black), var(--neo-black) 10px, var(--neo-yellow) 10px, var(--neo-yellow) 20px)",
              marginTop: "-24px",
              marginLeft: "-24px",
              marginRight: "-24px",
              width: "calc(100% + 48px)",
            }}
          />

          {/* Title */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="neo-label-rotated inline-block mb-2" style={{ background: "var(--neo-pink)" }}>
              TOP SECRET
            </div>
            <h1
              className="neo-title text-4xl mb-2"
              style={{ fontFamily: "var(--neo-font-display)" }}
            >
              TRACKER
            </h1>
            <p className="neo-label mb-6">AUTHORIZED PERSONNEL ONLY</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="neo-label block mb-2">EMAIL</label>
              <input
                type="email"
                className="neo-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="neo-label block mb-2">PASSWORD</label>
              <input
                type="password"
                className="neo-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="neo-card p-3"
                    style={{ background: "var(--neo-red)", color: "var(--neo-white)" }}
                  >
                    <p className="neo-label" style={{ color: "var(--neo-white)" }}>
                      ⚠ {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button type="submit" className="neo-btn neo-btn-black w-full text-lg">
                <span>ACCESS SYSTEM</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.span>
              </button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="neo-label mt-4 text-[10px] leading-relaxed"
          >
            if you want access to this; please contact kushagra directly @ kushagrabharti@gmail.com
          </motion.p>

          {/* Decorative corner */}
          <div
            className="absolute -bottom-3 -right-3 w-12 h-12"
            style={{
              background: "var(--neo-cyan)",
              border: "3px solid var(--neo-black)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// LOADING SCREEN
// ============================================================================

const LoadingScreen: React.FC = () => {
  return (
    <div className="neo-tracker min-h-screen flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-black"
        style={{ borderTopColor: "var(--neo-lime)" }}
      />
      <motion.p
        className="neo-label mt-4"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        LOADING SYSTEM...
      </motion.p>
    </div>
  );
};

// ============================================================================
// SETUP NEEDED SCREEN
// ============================================================================

const SetupNeededScreen: React.FC = () => {
  return (
    <div className="neo-tracker min-h-screen flex items-center justify-center p-4">
      <div className="neo-card neo-card-pink max-w-md text-center">
        <h1 className="neo-title text-2xl mb-4">SETUP REQUIRED</h1>
        <p className="mb-4">
          Add <code className="bg-black text-white px-2 py-1">VITE_SUPABASE_URL</code> and{" "}
          <code className="bg-black text-white px-2 py-1">VITE_SUPABASE_ANON_KEY</code> to enable.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN TRACKER LAYOUT
// ============================================================================

const TrackerLayout: React.FC<{
  session: any;
  supabase: any;
  signOut: () => void;
  children: React.ReactNode;
  activeModuleId: TrackerModuleId;
  setActiveModuleId: (id: TrackerModuleId) => void;
  loadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
}> = ({
  session,
  supabase,
  signOut,
  children,
  activeModuleId,
  setActiveModuleId,
  loadingCount,
  startLoading,
  stopLoading,
  searchParams,
  setSearchParams,
}) => {
  const [time, setTime] = useState(new Date());
  const mainWidthClass = activeModuleId === "tasks" ? "w-full max-w-none" : "max-w-7xl";

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (id: TrackerModuleId) => {
    setActiveModuleId(id);
    const next = new URLSearchParams(searchParams);
    next.set("module", id);
    setSearchParams(next, { replace: true });
  };

  return (
    <TrackerProvider value={{ session, userId: session.user.id, supabase, startLoading, stopLoading }}>
      <div className="neo-tracker min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border-b-4 border-black bg-white sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{
                    background: "var(--neo-lime)",
                    border: "3px solid var(--neo-black)",
                  }}
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-2xl font-black">K</span>
                </motion.div>
                <div>
                  <h1
                    className="text-2xl font-black tracking-tight"
                    style={{ fontFamily: "var(--neo-font-display)" }}
                  >
                    TRACKER
                  </h1>
                  <p className="neo-label text-xs">EXECUTION DASHBOARD</p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                {/* Clock */}
                <div className="hidden md:block neo-card p-2" style={{ background: "var(--neo-black)", color: "var(--neo-lime)" }}>
                  <span className="neo-label" style={{ color: "var(--neo-lime)", fontFamily: "var(--neo-font-mono)" }}>
                    {time.toLocaleTimeString()}
                  </span>
                </div>

                {/* Loading indicator */}
                <AnimatePresence>
                  {loadingCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black"
                        style={{ borderTopColor: "var(--neo-lime)" }}
                      />
                      <span className="neo-label text-xs">SYNCING</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logout */}
                <motion.button
                  onClick={signOut}
                  className="neo-btn neo-btn-sm neo-btn-pink"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  LOGOUT
                </motion.button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t-4 border-black">
            <div className="max-w-7xl mx-auto px-4">
              <nav className="flex">
                {trackerModules.map((module, index) => (
                  <motion.button
                    key={module.id}
                    onClick={() => handleTabChange(module.id)}
                    className={`
                      relative px-6 py-4 font-bold uppercase tracking-wider text-sm
                      border-r-4 first:border-l-4 border-black transition-colors
                      ${activeModuleId === module.id
                        ? "bg-neo-lime text-black"
                        : "bg-white text-black hover:bg-gray-100"
                      }
                    `}
                    style={{
                      fontFamily: "var(--neo-font-mono)",
                      background: activeModuleId === module.id ? "var(--neo-lime)" : "white",
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    {module.label}
                    {activeModuleId === module.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-black"
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
          </div>
        </motion.header>

        {/* Floating shapes */}
        <FloatingShapes />

        {/* Main Content */}
        <main className={`${mainWidthClass} mx-auto px-4 py-6 relative z-10`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModuleId}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t-4 border-black bg-black text-white py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <p className="neo-label" style={{ color: "var(--neo-lime)" }}>
              BUILT FOR EXECUTION
            </p>
            <div className="flex items-center gap-2">
              <div className="neo-status neo-status-active" />
              <span className="neo-label" style={{ color: "var(--neo-lime)" }}>SYSTEM ONLINE</span>
            </div>
          </div>
        </footer>
      </div>
    </TrackerProvider>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TrackerShell: React.FC = () => {
  const { session, authLoading, authError, signIn, signOut, isSupabaseConfigured, supabase } = useTrackerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get("module");
  const availableModuleIds = useMemo(() => trackerModules.map((module) => module.id), []);
  const resolvedModuleId = availableModuleIds.includes(moduleParam as TrackerModuleId)
    ? (moduleParam as TrackerModuleId)
    : defaultModuleId;
  const [activeModuleId, setActiveModuleId] = useState<TrackerModuleId>(resolvedModuleId);
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => setLoadingCount((count) => count + 1), []);
  const stopLoading = useCallback(() => setLoadingCount((count) => Math.max(0, count - 1)), []);

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
    return <SetupNeededScreen />;
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <LoginScreen onSignIn={signIn} error={authError} />;
  }

  const ActiveModuleComponent = activeModule.Component;

  return (
    <TrackerLayout
      session={session}
      supabase={supabase}
      signOut={signOut}
      activeModuleId={activeModuleId}
      setActiveModuleId={setActiveModuleId}
      loadingCount={loadingCount}
      startLoading={startLoading}
      stopLoading={stopLoading}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
    >
      <ActiveModuleComponent />
    </TrackerLayout>
  );
};

export default TrackerShell;
