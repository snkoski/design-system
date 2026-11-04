import { Button as BaseButton } from "@base-ui/react/button";
import type { Ref } from "react";
import { warnIfUnnamed } from "../../internal/warn";
import { Content, cx } from "./shared";
import type { ButtonVariant, IconOnly, SharedProps } from "./shared";

/**
 * Danger is only for a secondary or ghost button with a visible label: a primary button keeps its neutral fill, and an
 * icon-only button has no words to say what will be lost.
 */
type Toned =
  | {
      /**
       * `danger` marks an action that destroys or loses something, such as "Delete project": red words, icon, and edge,
       * with no fill. Only on `secondary` and `ghost` buttons with label text. Default: `neutral`.
       */
      tone?: "neutral";
    }
  | {
      /**
       * `danger` marks an action that destroys or loses something, such as "Delete project": red words, icon, and edge,
       * with no fill. Only on `secondary` and `ghost` buttons with label text. Default: `neutral`.
       */
      tone: "danger";
      /** Danger works on `secondary` and `ghost` only. */
      variant: Exclude<ButtonVariant, "primary">;
      /** Danger needs label text, so an icon-only button can't be danger. */
      iconOnly?: false;
    };

export type ButtonProps = SharedProps &
  IconOnly &
  Toned &
  Omit<BaseButton.Props, "className" | "render" | "nativeButton" | keyof SharedProps | "aria-label" | "tone"> & {
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
  shape = "rectangle",
  tone = "neutral",
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
      data-shape={shape}
      data-tone={tone}
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
