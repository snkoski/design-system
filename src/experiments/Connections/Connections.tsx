import { useEffect, useRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "./connections.css";
import { lines, toPixels } from "./lines";
import type { Box, Distance } from "./lines";

export type { Distance };

interface OwnProps {
  /** The things to connect, such as Bounce elements, and anything else on the page. */
  children?: ReactNode;
  /**
   * How close two things get before a line joins them, measured between their nearest edges: a number of px, or
   * a length relative to the window or text, such as `"15vw"`, `"10vh"`, `"12vmin"`, or `"8rem"`. Default: 120.
   */
  distance?: Distance;
  /** The line's color, as any CSS color. Default: `var(--border-strong)`, a gray in every theme. */
  color?: string;
  /** The line's thickness, in px. Default: 1.5. */
  lineWidth?: number;
  /** Fade each line in as the two get closer, rather than showing it all at once. Default: `true`. */
  fade?: boolean;
  /** Which elements inside to connect, as a CSS selector. Default: `.bounce`, every Bounce. */
  selector?: string;
  /** Applied to the box. It's positioned, so a Bounce inside bounces around it: give it a size. */
  className?: string;
  /** Reaches the box. */
  ref?: Ref<HTMLDivElement>;
}

export type ConnectionsProps = OwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof OwnProps>;

/**
 * A box that draws a thin line between any two things inside it that come within `distance` of each other,
 * following them as they move. The lines are drawn behind them, are decorative, and are hidden from screen
 * readers. An experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function Connections({
  children,
  distance = 120,
  color,
  lineWidth = 1.5,
  fade = true,
  selector = ".bounce",
  className,
  style,
  ref,
  ...rest
}: ConnectionsProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  // The latest settings, for the drawing loop to read without restarting
  const settings = useRef({ distance, lineWidth, fade, selector });

  useEffect(() => {
    settings.current = { distance, lineWidth, fade, selector };
  });

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const container = box.current;
      const surface = canvas.current;
      const context = surface?.getContext("2d");
      if (!container || !surface || !context) return;
      const { distance, lineWidth, fade, selector } = settings.current;

      // Read everything first
      const area = container.getBoundingClientRect();
      const boxes: Box[] = [...container.querySelectorAll(selector)].map((element) => {
        const at = element.getBoundingClientRect();
        return { left: at.left - area.left, top: at.top - area.top, width: at.width, height: at.height };
      });
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const reach = toPixels(distance, { width: window.innerWidth, height: window.innerHeight, rem });
      const stroke = getComputedStyle(surface).color;

      // Then draw, at the screen's pixel density so lines stay sharp
      const density = window.devicePixelRatio || 1;
      const width = Math.round(area.width * density);
      const height = Math.round(area.height * density);
      if (surface.width !== width) surface.width = width;
      if (surface.height !== height) surface.height = height;
      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, area.width, area.height);
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      lines(boxes, reach).forEach(({ from, to, strength }) => {
        context.globalAlpha = fade ? strength : 1;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      });
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setRef = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div {...rest} ref={setRef} className={cx("connections", className)} style={{ ...style, ...(color && { "--connections-color": color }) }}>
      <canvas ref={canvas} className="connections__lines" aria-hidden="true" />
      {children}
    </div>
  );
}
