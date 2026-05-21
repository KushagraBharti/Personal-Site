import React, { Suspense, useEffect, useState } from "react";
import ScrollProgress from "../../shared/components/app/ScrollProgress";
import HomePage from "./HomePage";
import { scheduleIdle } from "../../shared/lib/scheduleIdle";

const Noop = () => null;

const DeferredAnalytics = React.lazy(() =>
  import("@vercel/analytics/react")
    .then((module) => ({ default: module.Analytics }))
    .catch(() => ({ default: Noop })),
);

const DeferredCustomCursor = React.lazy(
  () => import("../../shared/components/ui/CustomCursor"),
);

const GlobalHotkeys: React.FC = () => {
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        (key !== "t" && key !== "h")
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable;

      if (isTyping) return;
      window.location.assign(key === "t" ? "/tracker" : "/");
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return null;
};

const useAnalytics = () => {
  const [shouldRenderAnalytics, setShouldRenderAnalytics] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let isMounted = true;
    let timeoutId: number | null = null;
    let cancelIdle: (() => void) | null = null;

    const loadAnalytics = () => {
      timeoutId = window.setTimeout(() => {
        cancelIdle = scheduleIdle(() => {
          if (isMounted) {
            setShouldRenderAnalytics(true);
          }
        }, 2500);

        if (!isMounted) {
          cancelIdle();
        }
      }, 2500);
    };

    if (document.readyState === "complete") {
      loadAnalytics();
    } else {
      window.addEventListener("load", loadAnalytics, { once: true });
    }

    return () => {
      isMounted = false;
      window.removeEventListener("load", loadAnalytics);
      cancelIdle?.();
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return shouldRenderAnalytics;
};

const useDeferredCursor = () => {
  const [shouldRenderCursor, setShouldRenderCursor] = useState(false);

  useEffect(() => {
    const canUseFinePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!canUseFinePointer) return;

    let isMounted = true;
    const cancelIdle = scheduleIdle(() => {
      if (isMounted) {
        setShouldRenderCursor(true);
      }
    }, 3000);

    return () => {
      isMounted = false;
      cancelIdle();
    };
  }, []);

  return shouldRenderCursor;
};

const HomePageApp: React.FC = () => {
  const shouldRenderAnalytics = useAnalytics();
  const shouldRenderCursor = useDeferredCursor();

  return (
    <>
      <ScrollProgress />
      <Suspense fallback={null}>
        {shouldRenderCursor ? <DeferredCustomCursor /> : null}
        {shouldRenderAnalytics ? <DeferredAnalytics /> : null}
      </Suspense>
      <GlobalHotkeys />
      <HomePage />
    </>
  );
};

export default HomePageApp;
