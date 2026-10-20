import { describe, expect, it, vi } from "vitest";
import { takeWarnings } from "../../tests/warnings";
import { hasContent, warn, warnIfUnnamed } from "./warn";

describe("warn", () => {
  it("prints the message with the package and component name", () => {
    warn("Checkbox", "something is wrong.");
    expect(takeWarnings()).toEqual(["[design-system] Checkbox: something is wrong."]);
  });

  it("prints each message once, however often it's called", () => {
    warn("Checkbox", "something is wrong.");
    warn("Checkbox", "something is wrong.");
    warn("Checkbox", "something else is wrong.");
    expect(takeWarnings()).toEqual([
      "[design-system] Checkbox: something is wrong.",
      "[design-system] Checkbox: something else is wrong.",
    ]);
  });

  it("prints nothing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      warn("Checkbox", "something is wrong.");
    } finally {
      vi.unstubAllEnvs();
    }
    expect(takeWarnings()).toEqual([]);
    warn("Checkbox", "something is wrong.");
    expect(takeWarnings()).toHaveLength(1);
  });
});

describe("hasContent", () => {
  it("counts text, numbers, and elements as content", () => {
    expect(hasContent("Design")).toBe(true);
    expect(hasContent(0)).toBe(true);
    expect(hasContent(<strong>Design</strong>)).toBe(true);
    expect(hasContent(["", "Design"])).toBe(true);
  });

  it("doesn't count empty or whitespace text, null, undefined, booleans, or arrays of them", () => {
    expect(hasContent("")).toBe(false);
    expect(hasContent("  \n")).toBe(false);
    expect(hasContent(null)).toBe(false);
    expect(hasContent(undefined)).toBe(false);
    expect(hasContent(false)).toBe(false);
    expect(hasContent(true)).toBe(false);
    expect(hasContent(["", null, false])).toBe(false);
  });
});

describe("warnIfUnnamed", () => {
  it("warns when there is no label content, aria-label, or aria-labelledby", () => {
    warnIfUnnamed("Input", "", { "aria-label": " " }, "Give it a label.");
    expect(takeWarnings()).toEqual([
      "[design-system] Input: has no accessible name, so screen readers announce it without one. Give it a label.",
    ]);
  });

  it("stays quiet when any of them names the control", () => {
    warnIfUnnamed("Input", "Email", {}, "Give it a label.");
    warnIfUnnamed("Input", "", { "aria-label": "Email" }, "Give it a label.");
    warnIfUnnamed("Input", undefined, { "aria-labelledby": "email-heading" }, "Give it a label.");
    expect(takeWarnings()).toEqual([]);
  });
});
