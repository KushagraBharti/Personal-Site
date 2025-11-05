import { useEffect, useState } from "react";

const isBrowser = () => typeof window !== "undefined";

export function usePrefersDark() {
  const [prefersDark, setPrefersDark] = useState(() => {
    if (!isBrowser() || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (!isBrowser() || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => setPrefersDark(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
    } else {
      media.addListener(handler);
    }

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, []);

  return prefersDark;
}
