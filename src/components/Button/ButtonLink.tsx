import type { AnchorHTMLAttributes, Ref } from "react";
import { warnIfUnnamed } from "../../internal/warn";
import { Content, cx } from "./shared";
import type { IconOnly, SharedProps } from "./shared";

export type ButtonLinkProps = SharedProps &
  IconOnly &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | keyof SharedProps | "aria-label"> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

/**
 * A link that looks like a button. Renders a real `<a>`, so it navigates, opens in a
 * new tab, and is announced as a link. Links can't be disabled; remove it instead.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  iconOnly = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  // An icon-only button's children are a hidden icon, so only an aria-label can name it
  warnIfUnnamed(
    "ButtonLink",
    iconOnly ? undefined : children,
    rest,
    iconOnly ? "Give an icon-only button an aria-label that says what it does." : "Give it label text (children) or an aria-label.",
  );
  return (
    <a
      {...rest}
      className={cx("button", "sheen", className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
    >
      <Content iconStart={iconStart} iconEnd={iconEnd} iconOnly={iconOnly}>
        {children}
      </Content>
    </a>
  );
}
