import { useCallback, useEffect, useRef, useState } from "react";

interface UseLocalStorageOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  sync?: boolean;
}

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse, sync = true } = options;
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser()) return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item ? (deserialize(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!isBrowser() || !sync) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        setStoredValue(deserialize(event.newValue));
      } catch {
        // ignore corrupted cross-tab events
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, deserialize, sync]);

  useEffect(() => {
    if (!isBrowser()) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    try {
      const value = serialize(storedValue);
      localStorage.setItem(key, value);
    } catch {
      // ignore write errors
    }
  }, [deserialize, key, serialize, storedValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((currentValue) => {
        const nextValue = value instanceof Function ? value(currentValue) : value;
        return nextValue;
      });
    },
    [],
  );

  const remove = useCallback(() => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // ignore remove errors
    }
  }, [initialValue, key]);

  return [storedValue, setValue, remove] as const;
}
