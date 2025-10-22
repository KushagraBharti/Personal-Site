import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
  startX: number;
  startY: number;
  initial: { x: number; y: number; width: number; height: number };
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
  const activeWindowId = useActiveWindowId();
  const { focusWindow, updateWindow } = useWindowActions();

  const setBodyUserSelect = (value: string) => {
    if (typeof document === "undefined") return;
    document.body.style.userSelect = value;
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const pointer = pointerStateRef.current;
      if (!pointer) return;

      if (pointer.type === "drag") {
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;
        const candidate: WindowState = {
          ...windowState,
          x: pointer.initial.x + dx,
          y: pointer.initial.y + dy,
        };
        const viewport = getViewport();
        const nextPosition = clampWindowToViewport(candidate, viewport, 12);
        updateWindow(windowState.id, {
          x: nextPosition.x,
          y: nextPosition.y,
        });
        return;
      }

      if (pointer.type === "resize" && pointer.direction) {
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;
        const isLeft = pointer.direction.includes("Left") || pointer.direction === "left";
        const isRight = pointer.direction.includes("Right") || pointer.direction === "right";
        const isTop = pointer.direction.includes("Top") || pointer.direction === "top";
        const isBottom = pointer.direction.includes("Bottom") || pointer.direction === "bottom";

        let width = pointer.initial.width;
        let height = pointer.initial.height;
        let x = pointer.initial.x;
        let y = pointer.initial.y;

        if (isRight) {
          width = Math.max(MIN_WIDTH, pointer.initial.width + dx);
        }
        if (isBottom) {
          height = Math.max(MIN_HEIGHT, pointer.initial.height + dy);
        }
        if (isLeft) {
          width = Math.max(MIN_WIDTH, pointer.initial.width - dx);
          x = pointer.initial.x + (pointer.initial.width - width);
        }
        if (isTop) {
          height = Math.max(MIN_HEIGHT, pointer.initial.height - dy);
          y = pointer.initial.y + (pointer.initial.height - height);
        }

        const viewport = getViewport();
        const position = clampWindowToViewport({ ...windowState, x, y, width, height }, viewport, 12);
        updateWindow(windowState.id, {
          x: position.x,
          y: position.y,
          width,
          height,
        });
      }
    },
    [updateWindow, windowState],
  );

  const handlePointerUp = useCallback(() => {
    pointerStateRef.current = null;
    setBodyUserSelect("");
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const startPointerTracking = useCallback(
    (state: PointerState) => {
      pointerStateRef.current = state;
      setBodyUserSelect("none");
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setBodyUserSelect("");
      pointerStateRef.current = null;
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || windowState.maximized) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowState.id);
      startPointerTracking({
        type: "drag",
        startX: event.clientX,
        startY: event.clientY,
        initial: {
          x: windowState.x,
          y: windowState.y,
          width: windowState.width,
          height: windowState.height,
        },
      });
    },
    [focusWindow, startPointerTracking, windowState],
  );

  const handleResizeStart = useCallback(
    (direction: ResizeDirection, event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || windowState.maximized) return;
      event.preventDefault();
      event.stopPropagation();
      focusWindow(windowState.id);
      startPointerTracking({
        type: "resize",
        direction,
        startX: event.clientX,
        startY: event.clientY,
        initial: {
          x: windowState.x,
          y: windowState.y,
          width: windowState.width,
          height: windowState.height,
        },
      });
    },
    [focusWindow, startPointerTracking, windowState],
  );

  const style = useMemo(() => {
    if (windowState.maximized) {
      return {
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: windowState.z,
        display: windowState.minimized ? "none" : undefined,
      } satisfies React.CSSProperties;
    }
    return {
      left: windowState.x,
      top: windowState.y,
      width: windowState.width,
      height: windowState.height,
      zIndex: windowState.z,
      display: windowState.minimized ? "none" : undefined,
    } satisfies React.CSSProperties;
  }, [windowState]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={windowState.title}
      tabIndex={-1}
      onMouseDown={() => focusWindow(windowState.id)}
      className={clsx(
        "absolute flex select-none flex-col overflow-hidden rounded-xl border border-border/50 bg-slate-950/75 text-slate-100 shadow-lg backdrop-blur-lg transition-shadow",
        activeWindowId === windowState.id ? "shadow-elevated ring-1 ring-accent/60" : "shadow-ambient",
      )}
      style={style}
      data-app-id={windowState.appId}
    >
      <TitleBar windowState={windowState} onDragStart={handleDragStart} />
      <div className="pointer-events-auto flex-1 overflow-hidden bg-slate-900/70">{children}</div>
      {!windowState.maximized && <Resizers onResizeStart={handleResizeStart} />}
    </div>
  );
};

export default Window;
