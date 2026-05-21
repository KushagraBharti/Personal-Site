type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export const scheduleIdle = (
  callback: () => void,
  timeout = 1500,
): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const idleWindow = window as IdleWindow;

  if (
    typeof idleWindow.requestIdleCallback === "function" &&
    typeof idleWindow.cancelIdleCallback === "function"
  ) {
    const handle = idleWindow.requestIdleCallback(() => callback(), {
      timeout,
    });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const timeoutId = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(timeoutId);
};
