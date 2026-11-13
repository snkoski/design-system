import { describe, expect, it } from "vitest";

// vitest.config.ts runs the unit tests in America/Anchorage, far from UTC, so a date read as UTC midnight
// ("2026-11-12" passed to new Date) lands on the 11th and fails the test that read it. This proves the zone took effect.
describe("unit test time zone", () => {
  it("is America/Anchorage, nine hours behind UTC in November", () => {
    expect(new Date(2026, 10, 12).getTimezoneOffset()).toBe(540);
  });
});
