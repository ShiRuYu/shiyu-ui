type BrowserStorageType = 'localStorage' | 'sessionStorage';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  } as Storage;
}

function createSafeStorage(storage: Storage): Storage {
  const fallback = createMemoryStorage();
  let active = storage;
  const useFallback = () => {
    active = fallback;
  };

  return {
    get length() {
      try {
        return active.length;
      } catch {
        useFallback();
        return fallback.length;
      }
    },
    clear() {
      try {
        active.clear();
      } catch {
        useFallback();
        fallback.clear();
      }
    },
    getItem(key) {
      try {
        return active.getItem(key);
      } catch {
        useFallback();
        return fallback.getItem(key);
      }
    },
    key(index) {
      try {
        return active.key(index);
      } catch {
        useFallback();
        return fallback.key(index);
      }
    },
    removeItem(key) {
      try {
        active.removeItem(key);
      } catch {
        useFallback();
        fallback.removeItem(key);
      }
    },
    setItem(key, value) {
      try {
        active.setItem(key, value);
      } catch {
        useFallback();
        fallback.setItem(key, value);
      }
    },
  } as Storage;
}

/**
 * Returns browser storage when it can be read, otherwise an isolated memory store.
 * Accessing localStorage itself can throw when the browser blocks persistence.
 */
function getBrowserStorage(type: BrowserStorageType = 'localStorage'): Storage {
  try {
    const storage =
      type === 'localStorage'
        ? globalThis.localStorage
        : globalThis.sessionStorage;
    storage?.getItem('__vben_storage_probe__');
    return storage ? createSafeStorage(storage) : createMemoryStorage();
  } catch {
    return createMemoryStorage();
  }
}

export { getBrowserStorage };
export type { BrowserStorageType };
