import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Button } from "../Button";
import type { ButtonProps, ButtonVariant } from "../Button";

/** Leaves a prop out of each branch of a union, so Button's icon-only branch still requires an `aria-label` */
type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type DialogCloseProps = Without<ButtonProps, "variant"> & {
  /** Visual weight. Default: `secondary`, because Cancel is never the primary button. */
  variant?: ButtonVariant;
};

/**
 * A `Button` that closes the `Dialog` or `AlertDialog` it's in, such as "Cancel". It takes every Button prop, and is
 * `secondary` unless you say otherwise, because Cancel is never the primary button.
 */
export function DialogClose({ variant = "secondary", ...props }: DialogCloseProps) {
  // AlertDialog's Close is this same part, so one component closes both
  return <BaseDialog.Close render={<Button variant={variant} {...props} />} />;
}
