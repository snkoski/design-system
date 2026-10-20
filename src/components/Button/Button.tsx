import { Button as BaseButton } from "@base-ui/react/button";
import type { Ref } from "react";
import { warnIfUnnamed } from "../../internal/warn";
import { Content, cx } from "./shared";
import type { IconOnly, SharedProps } from "./shared";

export type ButtonProps = SharedProps &
  IconOnly &
  Omit<BaseButton.Props, "className" | "render" | "nativeButton" | keyof SharedProps | "aria-label"> & {
    /** Shows a spinner and blocks clicks, but keeps the button focusable so keyboard users don't lose their place. */
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

/**
 * Triggers an action. For navigation, use `ButtonLink`, which renders a real `<a>`.
 * Built on Base UI's Button for consistent keyboard and disabled behavior.
 */
export function Button({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  iconOnly = false,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  // An icon-only button's children are a hidden icon, so only an aria-label can name it
  warnIfUnnamed(
    "Button",
    iconOnly ? undefined : children,
    rest,
    iconOnly ? "Give an icon-only button an aria-label that says what it does." : "Give it label text (children) or an aria-label.",
  );
  return (
    <BaseButton
      {...rest}
      className={cx("button", className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
    >
      <Content iconStart={iconStart} iconEnd={iconEnd} iconOnly={iconOnly} loading={loading}>
        {children}
      </Content>
    </BaseButton>
  );
}
