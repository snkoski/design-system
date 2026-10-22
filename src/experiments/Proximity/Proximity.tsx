import { useLayoutEffect, useRef } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "./proximity.css";
import { refresh, watch } from "./tracker";
import type { ColorSpace, Watcher } from "./tracker";

export type { ColorSpace };
export type ProximityFade = "in" | "out";

interface OwnProps {
  /** What changes as the mouse comes near. To take on the colors, draw it in `currentColor`. */
  children?: ReactNode;
  /**
   * How far away the mouse starts to count, in px from the nearest edge. Further than this, it's as if the mouse
   * weren't there; over it, it's as near as can be. Default: 240.
   */
  reach?: number;
  /**
   * Fade `out` to see-through as the mouse comes near, or start see-through and fade `in`. Default: no fading.
   * Don't fade out anything people need to read: at its faintest, its text fails contrast.
   */
  fade?: ProximityFade;
  /** How see-through it gets at its faintest, from 0 (gone) to 1 (not at all). Default: 0. */
  faintest?: number;
  /**
   * The colors it goes through as the mouse comes near, from far to near: two to go from one to the other, or
   * more to pass through each in turn. Any CSS colors. It sets `color`, so draw the content in `currentColor`.
   * Default: none, so it keeps its own color.
   */
  colors?: string[];
  /**
   * How the colors mix on the way between them. `srgb` mixes red, green, and blue, as paint on a screen does
   * (blue to red goes through purple); `oklch` keeps the in-between colors as bright as the ends; `hsl` goes
   * round the color wheel (blue to red goes through magenta). Default: `srgb`.
   */
  colorSpace?: ColorSpace;
  /** Applied to the element, so it's the place for layout classes such as size or margin. */
  className?: string;
  /** Reaches the element whose distance from the mouse is measured. */
  ref?: Ref<HTMLSpanElement>;
}

export type ProximityProps = OwnProps & Omit<HTMLAttributes<HTMLSpanElement>, keyof OwnProps>;

/**
 * Changes how see-through it is, or its color, by how close the mouse is: it can fade away as the mouse comes
 * near, fill in from nothing, or go from blue to red. Keyboard focus inside it counts as the mouse being right
 * over it, so faded-in content still appears for keyboard users. An experiment: not exported from the package
 * (see CLAUDE.md, Experiments).
 */
export function Proximity({ reach = 240, fade, faintest = 0, colors, colorSpace = "srgb", className, style, ref, children, ...rest }: ProximityProps) {
  const element = useRef<HTMLSpanElement | null>(null);
  const watcher = useRef<Watcher | null>(null);
  const colorList = colors ?? [];
  const colorKey = colorList.join("|");

  // A layout effect, so it's listening as soon as it's on the page: a pointer move in the same moment (a story's
  // play function, say) isn't lost before a passive effect would have run
  useLayoutEffect(() => {
    watcher.current = { element: element.current!, reach, colors: colorList, colorSpace };
    const stop = watch(watcher.current);
    return () => {
      stop();
      watcher.current = null;
    };
    // Subscribe once; changes to the settings are handled below
  }, []);

  useLayoutEffect(() => {
    if (!watcher.current) return;
    Object.assign(watcher.current, { reach, colors: colorList, colorSpace });
    refresh(watcher.current);
  }, [reach, colorKey, colorSpace]);

  const setRef = (node: HTMLSpanElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <span
      {...rest}
      ref={setRef}
      className={cx("proximity", className)}
      data-fade={fade}
      data-colored={colorList.length >= 2 || undefined}
      style={{ ...style, ...(fade && { "--proximity-faintest": Math.min(Math.max(faintest, 0), 1) }) } as CSSProperties}
    >
      {children}
    </span>
  );
}
