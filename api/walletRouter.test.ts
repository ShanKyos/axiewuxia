import { describe, it, expect } from "vitest";
import { buildLoginMessage } from "./walletRouter";

describe("buildLoginMessage", () => {
  it("includes the address and nonce the caller passed in", () => {
    const msg = buildLoginMessage("0xABC123", "nonce-xyz");
    expect(msg).toContain("0xABC123");
    expect(msg).toContain("nonce-xyz");
  });

  it("carries the current app name, not an older one", () => {
    // Regression guard for the app-shell rebrand — this exact string is what a user reads
    // and signs inside their wallet, so a stale brand name here is user-visible, not cosmetic.
    const msg = buildLoginMessage("0xABC123", "nonce-xyz");
    expect(msg).toContain("Axie Rift");
    expect(msg).not.toContain("Axie Wuxia");
  });

  it("states plainly that signing costs nothing and grants no spending rights", () => {
    // The whole point of a SIWE-style message is that a user can trust what they're signing —
    // pin the safety disclaimer text so it can't silently drop out of a future edit.
    const msg = buildLoginMessage("0xABC123", "nonce-xyz");
    expect(msg).toMatch(/không tốn phí/i);
    expect(msg).toMatch(/không cấp quyền chi tiêu/i);
  });
});
