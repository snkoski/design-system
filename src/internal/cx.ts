/** Joins class names, skipping empty ones. Internal: not exported from the package. */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
