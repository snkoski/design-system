import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { warnIfUnnamed } from "../../internal/warn";
import { Frame } from "./shared";
import type { SharedProps } from "./shared";

export type DialogProps = SharedProps & {
  /** The buttons at the bottom, right-aligned with the primary button last. Use `DialogClose` for "Cancel". */
  actions?: ReactNode;
  /** The close button's accessible name, for translation. Default: `"Close"`. */
  closeLabel?: string;
};

/**
 * A window over the page for a short task, such as editing a profile. It closes with Escape, its close button, or a
 * click outside it. For a confirmation that needs an answer in words, use `AlertDialog`.
 * Built on Base UI's Dialog, which keeps focus inside it, hides the rest of the page from screen readers, stops the
 * page scrolling, and returns focus to the trigger when it closes.
 */
export function Dialog({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  size = "md",
  closeLabel = "Close",
  ...rest
}: DialogProps) {
  warnIfUnnamed("Dialog", rest.title, rest, "Give it a title that says what it's for.");
  return (
    <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <Frame {...rest} size={size} closeLabel={closeLabel} />
    </BaseDialog.Root>
  );
}
