// Vitest setup — provides a tiny localStorage polyfill so the meta /
// save modules can round-trip their JSON without a full DOM env. The
// polyfill is per-process (one Map shared across all tests in the
// worker) and gets cleared between tests via beforeEach hooks where
// needed.

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; }
  } as Storage;
}
