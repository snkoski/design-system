import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import { resetWarnings } from "../src/internal/warn";
import { takeWarnings } from "./warnings";

// Every warning must be expected: a test that causes one takes it with takeWarnings() and asserts on it.
// Anything left over fails the test, so warnings from us, Base UI, or React can't creep in unnoticed.
beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  // Testing Library only cleans up on its own when the test runner exposes globals
  cleanup();
  const unexpected = takeWarnings();
  resetWarnings();
  expect(unexpected, "the test caused console warnings it didn't take with takeWarnings()").toEqual([]);
});
