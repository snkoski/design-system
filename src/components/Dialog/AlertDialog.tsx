import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";
import { warnIfUnnamed } from "../../internal/warn";
import { Frame } from "./shared";
import type { SharedProps } from "./shared";

export type AlertDialogProps = SharedProps & {
  /** The answers: "Cancel" as a `DialogClose`, then the action, last. Required: they're the only way to answer. */
  actions: Exclude<ReactNode, undefined | null | boolean>;
};

/**
 * A dialog that asks for an answer before going on, such as confirming something that can't be undone. It closes with
 * Escape or one of its own buttons, never a click outside it, and has no close button: the choice is always in words.
 * Built on Base UI's AlertDialog.
 */
export function AlertDialog({ trigger, open, defaultOpen, onOpenChange, onOpenChangeComplete, size = "sm", ...rest }: AlertDialogProps) {
  warnIfUnnamed("AlertDialog", rest.title, rest, "Give it a title that asks the question.");
  return (
    <BaseAlertDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      {trigger && <BaseAlertDialog.Trigger render={trigger} />}
      <Frame {...rest} size={size} />
    </BaseAlertDialog.Root>
  );
}
