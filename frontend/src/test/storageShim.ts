type StorageShim = {
  readonly length: number;
  clear: () => void;
  getItem: (key: string) => string | null;
  key: (index: number) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

const STORAGE_METHODS: Array<keyof StorageShim> = [
  "clear",
  "getItem",
  "key",
  "removeItem",
  "setItem",
];

const processRef = globalThis as typeof globalThis & {
  process?: {
    emitWarning?: (warning: string | Error, ...args: unknown[]) => void;
  };
};

const processObject = processRef.process;
const originalEmitWarning = processObject?.emitWarning?.bind(processObject);

if (processObject && originalEmitWarning) {
  processObject.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const warningText = typeof warning === "string" ? warning : warning?.message;
    if (
      typeof warningText === "string" &&
      warningText.includes("--localstorage-file") &&
      warningText.includes("was provided without a valid path")
    ) {
      return;
    }

    originalEmitWarning(warning, ...args);
  };
}

const createStorageShim = (): StorageShim => {
  const backingStore = new Map<string, string>();

  return {
    get length() {
      return backingStore.size;
    },
    clear() {
      backingStore.clear();
    },
    getItem(key) {
      return backingStore.has(key) ? backingStore.get(key) ?? null : null;
    },
    key(index) {
      return Array.from(backingStore.keys())[index] ?? null;
    },
    removeItem(key) {
      backingStore.delete(key);
    },
    setItem(key, value) {
      backingStore.set(key, String(value));
    },
  };
};

const hasValidStorage = (candidate: unknown): candidate is StorageShim => {
  if (candidate === null || typeof candidate !== "object") {
    return false;
  }

  const descriptor = Reflect.getOwnPropertyDescriptor(candidate, "length");
  const lengthValue = (candidate as { length?: unknown }).length;
  const hasLength =
    typeof lengthValue === "number" ||
    (typeof descriptor?.get === "function" && typeof descriptor.get.call(candidate) === "number");

  if (!hasLength) {
    return false;
  }

  return STORAGE_METHODS.every((method) => typeof (candidate as Record<string, unknown>)[method] === "function");
};

const ensureStorage = (storageKey: "localStorage" | "sessionStorage") => {
  const existing = Reflect.get(globalThis, storageKey) as unknown;
  if (hasValidStorage(existing)) {
    return;
  }

  Object.defineProperty(globalThis, storageKey, {
    configurable: true,
    enumerable: true,
    value: createStorageShim(),
    writable: true,
  });
};

ensureStorage("localStorage");
ensureStorage("sessionStorage");
