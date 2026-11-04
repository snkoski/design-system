import { cx } from "./cx";

/** A padlock, drawn as Lucide's lock. Its line width comes from the CSS. */
function LockIcon() {
  return (
    <svg
      className="read-only-note__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * The "Read only" note every form control shows beside its label when it's read-only: a lock and the words, so people
 * can tell the field can't be changed before they try. Nothing else changes, so the field and its value stay at full
 * contrast. Hidden from screen readers, which already announce the control as read only; it's also left out of the
 * control's name. Place it inside the label, after the label's text. Internal: not exported from the package.
 */
export function ReadOnlyNote({ className }: { className?: string }) {
  return (
    <span className={cx("read-only-note", className)} aria-hidden="true">
      <LockIcon />
      Read only
    </span>
  );
}
