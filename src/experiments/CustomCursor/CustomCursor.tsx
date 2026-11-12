import { isValidElement, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "@/internal/cx";
import { clampSize, cursorValue, drawText, hotspotFor, isImageUrl, svgToDataUrl } from "@/experiments/CustomCursor/cursorImage";
import type { Hotspot } from "@/experiments/CustomCursor/cursorImage";
import "@/experiments/CustomCursor/custom-cursor.css";

export type { Hotspot };

/**
 * Every page-wide cursor currently wanted, most recent last. Only one can show, so the most recently set one
 * wins, and when it goes, the one before it comes back, rather than the page losing its cursor.
 */
const pageCursors: Array<{ value: string; overControls: "keep" | "replace" }> = [];

function showTopPageCursor() {
  const html = document.documentElement;
  const top = pageCursors.at(-1);
  if (top) {
    html.style.setProperty("--custom-cursor", top.value);
    html.setAttribute("data-custom-cursor", top.overControls);
  } else {
    html.style.removeProperty("--custom-cursor");
    html.removeAttribute("data-custom-cursor");
  }
}

export interface CustomCursorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * What the cursor looks like: an emoji or a little text ("🌭", "👀"), an SVG icon element (`<Star />`), or an
   * image address. Without it, the cursor is the normal one.
   */
  cursor?: string | ReactElement;
  /** The cursor's width and height in CSS pixels. Browsers ignore cursors bigger than 128. Default: 32. */
  size?: number;
  /** The point of the cursor that clicks: its center, its top-left corner, or exact pixels. Default: `center`. */
  hotspot?: Hotspot;
  /** The color of text and icons. Default: the text color where the cursor is used. */
  color?: string;
  /** `children`: only over what's inside. `page`: over the whole page, while this is mounted. Default: `children`. */
  scope?: "children" | "page";
  /**
   * Over buttons, links, and disabled controls: `keep` their own cursor (the hand, not-allowed), so it stays
   * clear what can be clicked, or `replace` it with this one too. Default: `keep`.
   */
  overControls?: "keep" | "replace";
  /** Called with the CSS cursor value each time it changes (null for the normal cursor), for showing a preview. */
  onCursorChange?: (value: string | null) => void;
  /** What the cursor applies to, when `scope` is `children`. */
  children?: ReactNode;
}

/**
 * Changes what the mouse cursor looks like, over its children or the whole page. It sets the real CSS cursor to an
 * image made from your emoji, icon, or picture, so the cursor never lags behind the mouse and falls back to the
 * normal one if the image can't be used. An experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function CustomCursor({
  cursor,
  size = 32,
  hotspot = "center",
  color,
  scope = "children",
  overControls = "keep",
  onCursorChange,
  className,
  style,
  children,
  ...rest
}: CustomCursorProps) {
  const root = useRef<HTMLDivElement>(null);
  const iconHolder = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState<string | null>(null);
  const px = clampSize(size);
  const spotKey = typeof hotspot === "string" ? hotspot : `${hotspot.x},${hotspot.y}`;

  // Make the image after render, on the client: it needs a canvas, and the icon rendered in the DOM
  useLayoutEffect(() => {
    if (cursor === undefined || cursor === "") return setValue(null);
    const ink = color ?? getComputedStyle(root.current ?? document.documentElement).color;
    const spot = hotspotFor(hotspot, px);
    if (typeof cursor === "string") {
      if (isImageUrl(cursor)) return setValue(cursorValue(cursor, null, spot));
      const oneX = drawText(cursor, px, 1, ink);
      const twoX = drawText(cursor, px, 2, ink);
      return setValue(oneX ? cursorValue(oneX, twoX, spot) : null);
    }
    const svg = iconHolder.current?.querySelector("svg");
    setValue(svg ? cursorValue(svgToDataUrl(svg, px, ink), null, spot) : null);
    // hotspot is an object a caller may recreate each render; spotKey is its stable form
  }, [cursor, px, spotKey, color]);

  useLayoutEffect(() => {
    onCursorChange?.(value);
    // Only when the value changes, not when a caller passes a new callback each render
  }, [value]);

  // Page scope: put the cursor on <html> while mounted, on top of any other page cursor, and step back after
  useLayoutEffect(() => {
    if (scope !== "page" || !value) return;
    const entry = { value, overControls };
    pageCursors.push(entry);
    showTopPageCursor();
    return () => {
      pageCursors.splice(pageCursors.indexOf(entry), 1);
      showTopPageCursor();
    };
  }, [scope, value, overControls]);

  const own = scope === "children" && value;
  return (
    <div
      {...rest}
      ref={root}
      className={cx("custom-cursor", className)}
      data-custom-cursor={own ? overControls : undefined}
      style={own ? { ...style, ["--custom-cursor" as string]: value } : style}
    >
      {isValidElement(cursor) && (
        <span ref={iconHolder} className="custom-cursor__icon" aria-hidden="true">
          {cursor}
        </span>
      )}
      {children}
    </div>
  );
}
