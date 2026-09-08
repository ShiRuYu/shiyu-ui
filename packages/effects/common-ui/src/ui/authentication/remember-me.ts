export function readRememberedUsername(key: string): string {
  try {
    return globalThis.localStorage?.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function writeRememberedUsername(key: string, username: string) {
  try {
    globalThis.localStorage?.setItem(key, username);
  } catch {
    // Remember-me is optional and must not block authentication when storage
    // is unavailable or quota-limited.
  }
}
