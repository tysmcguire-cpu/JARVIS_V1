import { describe, expect, it } from "vitest";
import { isOwner, demoEnabled } from "../../src/features/auth/policy";
import { findModule, navigation } from "../../src/features/shell/navigation";
const owner = "a2c92111-c2a3-4ab2-91dc-3d1abc84cc33";
describe("single-owner boundary", () => {
  it("accepts only the exact configured UUID", () => {
    expect(isOwner(owner, owner)).toBe(true);
    expect(isOwner("b2c92111-c2a3-4ab2-91dc-3d1abc84cc33", owner)).toBe(false);
    expect(isOwner(undefined, owner)).toBe(false);
    expect(isOwner(owner, undefined)).toBe(false);
    expect(isOwner("invalid", "invalid")).toBe(false);
  });
  it("fails closed for production demo access even with the flag enabled", () => {
    expect(demoEnabled({ NODE_ENV: "production", JARVIS_DEMO_MODE: "true" })).toBe(false);
    expect(demoEnabled({ NODE_ENV: "development", JARVIS_DEMO_MODE: "true" })).toBe(true);
    expect(demoEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(demoEnabled({ NODE_ENV: "development", JARVIS_DEMO_MODE: "false" })).toBe(false);
  });
});
describe("module routing", () => {
  it("does not resolve arbitrary route segments", () => {
    expect(findModule("unknown")).toBeUndefined();
    expect(findModule("../settings")).toBeUndefined();
    expect(new Set(navigation.map(item => item.slug)).size).toBe(navigation.length);
  });
});
