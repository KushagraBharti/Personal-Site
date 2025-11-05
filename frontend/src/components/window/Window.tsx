import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampWindowToViewport } from "../../app/wm/layout";
import { useActiveWindowId, useWindowActions } from "../../app/wm/hooks";
import type { WindowState } from "../../app/wm/types";
import Resizers, { type ResizeDirection } from "./Resizers";
import TitleBar from "./TitleBar";

interface WindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

type PointerState = {
  type: "drag" | "resize";
  pointerId?: number;
  windowId: string;
  startX: number;
  startY: number;
  initialRect: { x: number; y: number; width: number; height: number };
  direction?: ResizeDirection;
};

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;

const getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

const Window: React.FC<WindowProps> = ({ windowState, children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<PointerState | null>(null);
  const pointerCaptureTargetRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastClientRef = useRef<{ x: number; y: number } | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);

  const supportsPointerEvents = typeof window !== "undefined" && "PointerEvent" in window;

  const activeWindowId = useActiveWindowId();
  const { focusWindow, updateWindow } = useWindowActions();

  const setBodyUserSelect = useCallback((value: string) => {
    if (typeof document === "undefined") return;
    document.body.style.userSelect = value;
  }, []);

  const processMovement = useCallback(() => {
    const pointer = pointerStateRef.current;
    const client = lastClientRef.current;
    if (!pointer || !client) return;

    const dx = client.x - pointer.startX;
    const dy = client.y - pointer.startY;
    const { initialRect } = pointer;

    if (pointer.type === "drag") {
      const viewport = getViewport();
      const clamped = clampWindowToViewport(
        {
          x: initialRect.x + dx,
          y: initialRect.y + dy,
          width: initialRect.width,
          height: initialRect.height,
        },
        viewport,
        12,
      );
      updateWindow(pointer.windowId, {
        x: clamped.x,
        y: clamped.y,
      });
      return;
    }

    if (pointer.type === "resize" && pointer.direction) {
      let width = initialRect.width;
      let height = initialRect.height;
      let x = initialRect.x;
      let y = initialRect.y;

      const dir = pointer.direction;
      const isLeft = dir.includes("Left") || dir === "left";
      const isRight = dir.includes("Right") || dir === "right";
      const isTop = dir.includes("Top") || dir === "top";
      const isBottom = dir.includes("Bottom") || dir === "bottom";

      if (isRight) {
        width = Math.max(MIN_WIDTH, initialRect.width + dx);
      }
      if (isBottom) {
        height = Math.max(MIN_HEIGHT, initialRect.height + dy);
      }
      if (isLeft) {
        width = Math.max(MIN_WIDTH, initialRect.width - dx);
        x = initialRect.x + (initialRect.width - width);
      }
      if (isTop) {
        height = Math.max(MIN_HEIGHT, initialRect.height - dy);
        y = initialRect.y + (initialRect.height - height);
      }

      const viewport = getViewport();
      const clamped = clampWindowToViewport({ x, y, width, height }, viewport, 12);
      updateWindow(pointer.windowId, {
        x: clamped.x,
        y: clamped.y,
        width,
        height,
      });
    }
  }, [updateWindow]);

  const scheduleMovement = useCallback(
    (clientX: number, clientY: number) => {
      lastClientRef.current = { x: clientX, y: clientY };
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        processMovement();
      });
    },
    [processMovement],
  );

  const endInteraction = useCallback(() => {
    const pointer = pointerStateRef.current;
    pointerStateRef.current = null;
    lastClientRef.current = null;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setBodyUserSelect("");
    setIsInteracting(false);

    if (pointer && pointer.pointerId !== undefined && pointerCaptureTargetRef.current) {
      try {
        pointerCaptureTargetRef.current.releasePointerCapture(pointer.pointerId);
      } catch {
        // ignore capture release failures
      }
    }

    pointerCaptureTargetRef.current = null;
  }, [setBodyUserSelect]);

  const startInteraction = useCallback(
    (state: PointerState, captureTarget?: HTMLElement | null) => {
      pointerStateRef.current = state;
      lastClientRef.current = { x: state.startX, y: state.startY };
      setBodyUserSelect("none");
      setIsInteracting(true);

      if (captureTarget && state.pointerId !== undefined) {
        pointerCaptureTargetRef.current = captureTarget;
        try {
          captureTarget.setPointerCapture(state.pointerId);
        } catch {
          pointerCaptureTargetRef.current = null;
        }
      } else {
        pointerCaptureTargetRef.current = null;
      }
    },
    [setBodyUserSelect],
  );

  useEffect(() => {
    if (!isInteracting) return;

    const handlePointerMove = (event: PointerEvent) => {
      const pointer = pointerStateRef.current;
      if (!pointer) return;
      if (pointer.pointerId !== undefined && event.pointerId !== pointer.pointerId) {
        return;
      }
      event.preventDefault();
      scheduleMovement(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pointer = pointerStateRef.current;
      if (!pointer) return;
      if (pointer.pointerId !== undefined && event.pointerId !== pointer.pointerId) {
        return;
      }
      endInteraction();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!pointerStateRef.current) return;
      event.preventDefault();
      scheduleMovement(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      if (!pointerStateRef.current) return;
      endInteraction();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pointerStateRef.current) return;
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return;
      event.preventDefault();
      scheduleMovement(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      if (!pointerStateRef.current) return;
      endInteraction();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [endInteraction, isInteracting, scheduleMovement]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      const pointer = pointerStateRef.current;
      if (pointer && pointer.pointerId !== undefined && pointerCaptureTargetRef.current) {
        try {
          pointerCaptureTargetRef.current.releasePointerCapture(pointer.pointerId);
        } catch {
          // ignore
        }
      }
      pointerStateRef.current = null;
      pointerCaptureTargetRef.current = null;
      lastClientRef.current = null;
      setBodyUserSelect("");
    };
  }, [setBodyUserSelect]);

  const { id: windowId, title, appId, z, minimized, maximized, x, y, width, height } = windowState;

  const createInitialRect = useCallback(
    () => ({
      x,
      y,
      width,
      height,
    }),
    [height, width, x, y],
  );

  const handlePointerDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || maximized) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      const captureTarget = containerRef.current ?? (event.currentTarget as HTMLElement | null);
      startInteraction(
        {
          type: "drag",
          pointerId: event.pointerId,
          windowId,
          startX: event.clientX,
          startY: event.clientY,
          initialRect: createInitialRect(),
        },
        captureTarget,
      );
    },
    [createInitialRect, focusWindow, maximized, startInteraction, windowId],
  );

  const handleMouseDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || maximized) return;
      if (supportsPointerEvents) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      startInteraction({
        type: "drag",
        windowId,
        startX: event.clientX,
        startY: event.clientY,
        initialRect: createInitialRect(),
      });
    },
    [createInitialRect, focusWindow, maximized, startInteraction, supportsPointerEvents, windowId],
  );

  const handleTouchDragStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (maximized || supportsPointerEvents) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      startInteraction({
        type: "drag",
        windowId,
        startX: touch.clientX,
        startY: touch.clientY,
        initialRect: createInitialRect(),
      });
    },
    [createInitialRect, focusWindow, maximized, startInteraction, supportsPointerEvents, windowId],
  );

  const handlePointerResizeStart = useCallback(
    (direction: ResizeDirection, event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || maximized) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      const captureTarget = containerRef.current ?? (event.currentTarget as HTMLElement | null);
      startInteraction(
        {
          type: "resize",
          direction,
          pointerId: event.pointerId,
          windowId,
          startX: event.clientX,
          startY: event.clientY,
          initialRect: createInitialRect(),
        },
        captureTarget,
      );
    },
    [createInitialRect, focusWindow, maximized, startInteraction, windowId],
  );

  const handleMouseResizeStart = useCallback(
    (direction: ResizeDirection, event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || maximized) return;
      if (supportsPointerEvents) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      startInteraction({
        type: "resize",
        direction,
        windowId,
        startX: event.clientX,
        startY: event.clientY,
        initialRect: createInitialRect(),
      });
    },
    [createInitialRect, focusWindow, maximized, startInteraction, supportsPointerEvents, windowId],
  );

  const handleTouchResizeStart = useCallback(
    (direction: ResizeDirection, event: React.TouchEvent<HTMLDivElement>) => {
      if (maximized || supportsPointerEvents) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowId);
      startInteraction({
        type: "resize",
        direction,
        windowId,
        startX: touch.clientX,
        startY: touch.clientY,
        initialRect: createInitialRect(),
      });
    },
    [createInitialRect, focusWindow, maximized, startInteraction, supportsPointerEvents, windowId],
  );

  const style = useMemo(() => {
    if (maximized) {
      return {
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: z,
        display: minimized ? "none" : undefined,
      } satisfies React.CSSProperties;
    }
    return {
      left: x,
      top: y,
      width,
      height,
      zIndex: z,
      display: minimized ? "none" : undefined,
    } satisfies React.CSSProperties;
  }, [height, maximized, minimized, width, x, y, z]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      onMouseDown={() => focusWindow(windowId)}
      className={clsx(
        "absolute flex select-none flex-col overflow-hidden rounded-xl border border-border/50 bg-slate-950/75 text-slate-100 shadow-lg backdrop-blur-lg transition-shadow",
        activeWindowId === windowId ? "shadow-elevated ring-1 ring-accent/60" : "shadow-ambient",
      )}
      style={style}
      data-app-id={appId}
    >
      <TitleBar
        windowState={windowState}
        onPointerDrag={handlePointerDragStart}
        onMouseDrag={handleMouseDragStart}
        onTouchDrag={handleTouchDragStart}
      />
      <div className="pointer-events-auto flex-1 overflow-hidden bg-slate-900/70">{children}</div>
      {!maximized && (
        <Resizers
          onPointerResize={handlePointerResizeStart}
          onMouseResize={handleMouseResizeStart}
          onTouchResize={handleTouchResizeStart}
        />
      )}
    </div>
  );
};

export default Window;
