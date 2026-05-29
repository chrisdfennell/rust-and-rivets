import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tiny localStorage polyfill so meta / save tests can round-trip
    // their JSON without pulling a full DOM env.
    setupFiles: ['./tests/setup.ts']
  }
});
