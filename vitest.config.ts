import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
      // Kept in sync with vite.config.ts — missing here made any api/ test that transitively
      // imports db/schema (e.g. via api/queries/*) fail to even load, regardless of what the
      // test itself covered.
      "@db": path.resolve(templateRoot, "db"),
      db: path.resolve(templateRoot, "db"),
    },
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "api/**/*.spec.ts"],
    // api/lib/env.ts throws on import if these aren't set (by design, see its own comment) —
    // any test that transitively imports a file touching env.ts (most of api/ does, via
    // db connection/session helpers) needs *some* value here even if the test itself never
    // talks to a real DB or auth provider. Individual tests that need to control these
    // themselves (e.g. env.test.ts) still can — vi.resetModules() + a fresh process.env value
    // takes precedence over this baseline.
    env: {
      APP_ID: "test-app-id",
      APP_SECRET: "test-app-secret",
      DATABASE_URL: "mysql://test:test@localhost:3306/test",
      KIMI_AUTH_URL: "https://kimi-auth.test",
      KIMI_OPEN_URL: "https://kimi-open.test",
    },
  },
});
