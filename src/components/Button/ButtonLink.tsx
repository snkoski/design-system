import type { AnchorHTMLAttributes, Ref } from "react";
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
  return (
    <a
      {...rest}
      className={cx("button", className)}
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
