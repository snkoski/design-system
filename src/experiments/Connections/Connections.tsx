import { useEffect, useRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import "./connections.css";
import { lines, toPixels } from "./lines";
import type { Box, Distance } from "./lines";
import { mixPaint, parseRgb, toCss } from "./paint";
import type { Rgb } from "./paint";

export type { Distance };
export type ConnectionsBlend = "paint" | "light";

/** How many color stops a paint gradient gets: enough that it curves through the mixed colors smoothly */
export const PAINT_STOPS = 12;

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
  /**
   * Color each line with the colors of the two things it joins, as a gradient that mixes them: each thing's color
   * comes from its `--connection-color` CSS property (a thing without one uses `color`). `paint` mixes like paint,
   * so red and blue make purple in the middle and blue and yellow make green; `light` mixes like light on a
   * screen, where blue and yellow make gray. Default: off, so every line is `color`.
   */
  blend?: ConnectionsBlend;
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

/** Any CSS color as RGB, using the canvas to read it: a canvas gives back every color it accepts as #rrggbb or rgba() */
function rgb(context: CanvasRenderingContext2D, css: string): Rgb | null {
  context.fillStyle = "#000";
  context.fillStyle = css; // an unreadable color leaves it black
  const read = String(context.fillStyle);
  return parseRgb(read) ?? null;
}

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
  blend,
  selector = ".bounce",
  className,
  style,
  ref,
  ...rest
}: ConnectionsProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  // The latest settings, for the drawing loop to read without restarting
  const settings = useRef({ distance, lineWidth, fade, blend, selector });

  useEffect(() => {
    settings.current = { distance, lineWidth, fade, blend, selector };
  });

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const container = box.current;
      const surface = canvas.current;
      const context = surface?.getContext("2d");
      if (!container || !surface || !context) return;
      const { distance, lineWidth, fade, blend, selector } = settings.current;

      // Read everything first
      const area = container.getBoundingClientRect();
      const elements = [...container.querySelectorAll(selector)];
      const boxes: Box[] = elements.map((element) => {
        const at = element.getBoundingClientRect();
        return { left: at.left - area.left, top: at.top - area.top, width: at.width, height: at.height };
      });
      const colors = blend ? elements.map((element) => getComputedStyle(element).getPropertyValue("--connection-color").trim()) : [];
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
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      const fallback = rgb(context, stroke);
      lines(boxes, reach).forEach(({ from, to, strength, between: [a, b] }) => {
        context.globalAlpha = fade ? strength : 1;
        if (blend) {
          const [start, end] = [rgb(context, colors[a] || stroke) ?? fallback, rgb(context, colors[b] || stroke) ?? fallback];
          const gradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
          if (start && end && blend === "paint") {
            for (let stop = 0; stop <= PAINT_STOPS; stop++) gradient.addColorStop(stop / PAINT_STOPS, toCss(mixPaint(start, end, stop / PAINT_STOPS)));
          } else {
            gradient.addColorStop(0, start ? toCss(start) : stroke);
            gradient.addColorStop(1, end ? toCss(end) : stroke);
          }
          context.strokeStyle = gradient;
        } else {
          context.strokeStyle = stroke;
        }
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
