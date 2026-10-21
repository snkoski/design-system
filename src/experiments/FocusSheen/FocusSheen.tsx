import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../internal/cx";
import "../decoration.css";
import "./focus-sheen.css";

export interface FocusSheenProps extends HTMLAttributes<HTMLDivElement> {
  /** The controls that get the sheen when they're focused: any of our Buttons, Checkboxes, Switches, Radios, and Inputs. */
  children: ReactNode;
}

/**
 * Wrap controls in this, and a band of light sweeps across each one when it gets keyboard focus. Decorative:
 * the focus outline still shows focus, and with reduced motion it doesn't appear. An experiment: not exported
 * from the package (see CLAUDE.md, Experiments).
 */
export function FocusSheen({ className, children, ...rest }: FocusSheenProps) {
  return (
    <div {...rest} className={cx("focus-sheen", className)}>
      {children}
    </div>
  );
}
