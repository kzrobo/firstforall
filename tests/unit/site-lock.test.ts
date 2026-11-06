import { describe, expect, it } from "vitest";
import { passesSiteLock } from "@/lib/site-lock";

const basic = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`;

describe("private-preview gate", () => {
  it("is off when no password is configured", () => {
    expect(passesSiteLock("/", null, undefined)).toBe(true);
    expect(passesSiteLock("/", null, "")).toBe(true);
  });
  it("requires the shared password on every page when configured", () => {
    expect(passesSiteLock("/", null, "s3cret-team")).toBe(false);
    expect(passesSiteLock("/manuals", basic("team", "wrong"), "s3cret-team")).toBe(false);
    expect(passesSiteLock("/manuals", basic("anyone", "s3cret-team"), "s3cret-team")).toBe(true);
    expect(passesSiteLock("/admin", basic("team", "s3cret-team "), "s3cret-team")).toBe(false);
    expect(passesSiteLock("/", "Bearer s3cret-team", "s3cret-team")).toBe(false);
    expect(passesSiteLock("/", "Basic !!!", "s3cret-team")).toBe(false);
  });
  it("accepts passwords containing colons and non-ASCII-safe base64 only", () => {
    expect(passesSiteLock("/", basic("team", "a:b:c"), "a:b:c")).toBe(true);
  });
  it("lets the scheduled sync through (it has its own CRON_SECRET)", () => {
    expect(passesSiteLock("/api/cron/youtube-sync", null, "s3cret-team")).toBe(true);
    expect(passesSiteLock("/api/other", null, "s3cret-team")).toBe(false);
  });
});
