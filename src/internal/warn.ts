import type { ReactNode } from "react";

const shown = new Set<string>();

/**
 * Prints a development warning, once per message per page load. Only for mistakes TypeScript can't catch
 * that leave something definitely broken, with nothing else on the page to show it. A consumer's production
 * build replaces `process.env.NODE_ENV`, so this does nothing there. Internal: not exported from the package.
 */
export function warn(component: string, message: string) {
  if (process.env.NODE_ENV === "production") return;
  const text = `[design-system] ${component}: ${message}`;
  if (shown.has(text)) return;
  shown.add(text);
  console.warn(text);
}

/** Forgets which warnings were shown, so tests start fresh. */
export function resetWarnings() {
  shown.clear();
}

/** Whether label content renders something: not empty, not only whitespace, and not only null, undefined, or booleans. */
export function hasContent(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") return false;
  if (typeof node === "string") return node.trim() !== "";
  if (Array.isArray(node)) return node.some(hasContent);
  return true; // a number, or an element: assume it renders something
}

/**
 * Warns when a control would have no accessible name. The props types already require a label or an
 * `aria-label`, but an empty string passes them, such as a label read from a CMS that came back empty.
 */
export function warnIfUnnamed(
  component: string,
  label: ReactNode,
  props: { "aria-label"?: string; "aria-labelledby"?: string },
  fix: string,
) {
  if (hasContent(label) || props["aria-label"]?.trim() || props["aria-labelledby"]?.trim()) return;
  warn(component, `has no accessible name, so screen readers announce it without one. ${fix}`);
}
