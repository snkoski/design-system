import { vi } from "vitest";

/**
 * Returns the console warnings shown so far in this test and clears them. tests/setup.ts fails any test
 * that leaves a warning behind, so a test that expects one takes it with this and asserts on it.
 */
export function takeWarnings(): string[] {
  const spy = vi.mocked(console.warn);
  const messages = spy.mock.calls.map((args) => args.map(String).join(" "));
  spy.mockClear();
  return messages;
}
