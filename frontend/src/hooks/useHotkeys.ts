import { useEffect } from "react";

type KeyCombo = string;

interface HotkeyHandler {
  combo: KeyCombo;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

const normalize = (combo: string) =>
  combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join("+");

const matchEvent = (event: KeyboardEvent, combo: string) => {
  const parts = combo.split("+");
  const modifiers = {
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
  let keyMatched = false;

  for (const part of parts) {
    if (part === "meta" || part === "cmd" || part === "win") {
      if (!modifiers.meta) return false;
    } else if (part === "ctrl") {
      if (!modifiers.ctrl) return false;
    } else if (part === "shift") {
      if (!modifiers.shift) return false;
    } else if (part === "alt") {
      if (!modifiers.alt) return false;
    } else {
      if (keyMatched) return false;
      keyMatched = event.key.toLowerCase() === part;
    }
  }
  const modifierOnly = parts.every((part) =>
    ["meta", "cmd", "win", "ctrl", "shift", "alt"].includes(part),
  );
  return modifierOnly ? false : keyMatched;
};

export function useHotkeys(handlers: HotkeyHandler[], deps: unknown[] = []) {
  useEffect(() => {
    const normalizedHandlers = handlers.map((handler) => ({
      ...handler,
      combo: normalize(handler.combo),
    }));

    const listener = (event: KeyboardEvent) => {
      for (const handler of normalizedHandlers) {
        if (matchEvent(event, handler.combo)) {
          if (handler.preventDefault !== false) {
            event.preventDefault();
          }
          handler.handler(event);
        }
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
