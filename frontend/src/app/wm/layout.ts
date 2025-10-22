import type { WindowState } from "./types";

export interface Viewport {
  width: number;
  height: number;
}

const DEFAULT_MARGIN = 24;

export function clampWindowToViewport(
  window: WindowState,
  viewport: Viewport,
  margin: number = DEFAULT_MARGIN,
) {
  const maxX = Math.max(margin, viewport.width - margin - window.width);
  const maxY = Math.max(margin, viewport.height - margin - window.height);
  return {
    x: Math.min(Math.max(window.x, margin), maxX),
    y: Math.min(Math.max(window.y, margin), maxY),
  };
}

export type SnapZone = "left" | "right" | "top" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";

interface SnapResult {
  zone: SnapZone;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SNAP_THRESHOLD = 32;

export function maybeSnapWindow(
  window: WindowState,
  viewport: Viewport,
): SnapResult | null {
  const near = (value: number, target: number, threshold = SNAP_THRESHOLD) =>
    Math.abs(value - target) <= threshold;

  const halfWidth = Math.round(viewport.width / 2);
  const halfHeight = Math.round(viewport.height / 2);
  const thirdWidth = Math.round(viewport.width / 3);
  const thirdHeight = Math.round(viewport.height / 3);

  const edges = {
    left: window.x,
    top: window.y,
    right: window.x + window.width,
    bottom: window.y + window.height,
  };

  if (near(edges.top, 0) && near(edges.left, 0)) {
    return { zone: "topLeft", x: 0, y: 0, width: halfWidth, height: halfHeight };
  }
  if (near(edges.top, 0) && near(edges.right, viewport.width)) {
    return { zone: "topRight", x: halfWidth, y: 0, width: halfWidth, height: halfHeight };
  }
  if (near(edges.bottom, viewport.height) && near(edges.left, 0)) {
    return { zone: "bottomLeft", x: 0, y: halfHeight, width: halfWidth, height: halfHeight };
  }
  if (near(edges.bottom, viewport.height) && near(edges.right, viewport.width)) {
    return { zone: "bottomRight", x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight };
  }
  if (near(edges.left, 0)) {
    return { zone: "left", x: 0, y: 0, width: halfWidth, height: viewport.height };
  }
  if (near(edges.right, viewport.width)) {
    return { zone: "right", x: halfWidth, y: 0, width: halfWidth, height: viewport.height };
  }
  if (near(edges.top, 0)) {
    return { zone: "top", x: 0, y: 0, width: viewport.width, height: halfHeight };
  }
  if (near(edges.bottom, viewport.height)) {
    return { zone: "bottom", x: 0, y: halfHeight, width: viewport.width, height: halfHeight };
  }

  const centerX = window.x + window.width / 2;
  const centerY = window.y + window.height / 2;
  if (
    near(centerX, viewport.width / 2, thirdWidth / 2) &&
    near(centerY, viewport.height / 2, thirdHeight / 2)
  ) {
    return {
      zone: "center",
      x: Math.round(viewport.width * 0.1),
      y: Math.round(viewport.height * 0.08),
      width: Math.round(viewport.width * 0.8),
      height: Math.round(viewport.height * 0.84),
    };
  }

  return null;
}
