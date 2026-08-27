import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// env.ts computes `export const env = {...}` at module load time by calling required() on
// each var — so each test needs a fresh module instance (vi.resetModules + dynamic import)
// to see the effect of a different process.env, rather than one cached import at file top.
const ENV_KEYS = [
  "APP_ID",
  "APP_SECRET",
  "DATABASE_URL",
  "KIMI_AUTH_URL",
  "KIMI_OPEN_URL",
  "LOCAL_ONLY",
  "NODE_ENV",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  vi.resetModules();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("required env vars", () => {
  it("throws when a required var is missing and LOCAL_ONLY isn't set", async () => {
    for (const k of ["APP_ID", "APP_SECRET", "DATABASE_URL", "KIMI_AUTH_URL", "KIMI_OPEN_URL"]) {
      delete process.env[k];
    }
    delete process.env.LOCAL_ONLY;
    await expect(import("./env")).rejects.toThrow(/Missing required environment variable/);
  });

  it("does NOT silently fall back to an empty secret outside NODE_ENV=production", async () => {
    // Regression guard for the actual security bug: the old check only threw when
    // NODE_ENV==='production', so a staging/preview deploy that forgot to set NODE_ENV would
    // silently sign JWTs with an empty-string secret. This must throw regardless of NODE_ENV.
    delete process.env.APP_SECRET;
    delete process.env.LOCAL_ONLY;
    process.env.NODE_ENV = "development";
    process.env.APP_ID = "x";
    process.env.DATABASE_URL = "x";
    process.env.KIMI_AUTH_URL = "x";
    process.env.KIMI_OPEN_URL = "x";
    await expect(import("./env")).rejects.toThrow(/APP_SECRET/);
  });

  it("allows missing vars when LOCAL_ONLY=1 (the offline demo deploy mode)", async () => {
    for (const k of ["APP_ID", "APP_SECRET", "DATABASE_URL", "KIMI_AUTH_URL", "KIMI_OPEN_URL"]) {
      delete process.env[k];
    }
    process.env.LOCAL_ONLY = "1";
    const { env } = await import("./env");
    expect(env.appSecret).toBe("");
    expect(env.databaseUrl).toBe("");
  });

  it("reads real values through when every var is set", async () => {
    process.env.APP_ID = "app-1";
    process.env.APP_SECRET = "secret-1";
    process.env.DATABASE_URL = "mysql://x";
    process.env.KIMI_AUTH_URL = "https://auth.example";
    process.env.KIMI_OPEN_URL = "https://open.example";
    delete process.env.LOCAL_ONLY;
    const { env } = await import("./env");
    expect(env.appId).toBe("app-1");
    expect(env.appSecret).toBe("secret-1");
    expect(env.databaseUrl).toBe("mysql://x");
  });
});
