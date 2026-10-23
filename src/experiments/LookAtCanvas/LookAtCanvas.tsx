import { useEffect, useLayoutEffect, useRef } from "react";
import type { CanvasHTMLAttributes, Ref } from "react";
import { cx } from "../../internal/cx";
import type { ProximityFade } from "../Proximity/Proximity";
import { colorAt } from "../Proximity/tracker";
import type { ColorSpace } from "../Proximity/tracker";
import "../decoration.css";
import "./look-at-canvas.css";
import { approach, catchUp, fadeAlpha, step } from "./field";

/**
 * How many steps of closeness the colors and fading are drawn in. Every bar at the same step is drawn together,
 * so a frame is at most this many strokes however many bars there are, and the eye can't see steps this small.
 */
const LEVELS = 32;

/** Below this opacity, a bar can't be seen at all (less than one step of 256), so it isn't drawn */
const INVISIBLE = 1 / 256;

interface OwnProps {
  /** How many bars across. Default: 36. */
  columns?: number;
  /** How many bars down. Default: 22. */
  rows?: number;
  /** The distance between neighboring bars' centers, in rem. Default: 1.375 (22px). */
  pitch?: number;
  /** Each bar's thickness, in rem. Default: 0.1875 (3px). */
  barWidth?: number;
  /** Each bar's length, end to end, in rem; with `emoji`, the emoji's size. Default: 1 (16px). */
  barLength?: number;
  /**
   * Draw this emoji instead of a bar, such as 🌭. It's turned by `emojiTurn` first, to stand it on end, and the
   * colors don't reach it (an emoji has its own), but fading does.
   */
  emoji?: string;
  /**
   * How far to turn the emoji, in degrees clockwise, so it stands on end the way a bar does. Apple's hot dog lies
   * on a diagonal, top left to bottom right, so it takes 45. Default: 0.
   */
  emojiTurn?: number;
  /**
   * Roughly how long each turn takes, in milliseconds: after this long a bar is 95% of the way round. 0 snaps
   * straight to the mouse; longer ones trail behind it. Colors and fading follow at the same pace. Default: 120
   * (`--duration-fast`, like LookAt).
   */
  turnDuration?: number;
  /** The bars' color, as any CSS color, when they have no `colors`. Default: `var(--action)`, like LookAt's bar grid. */
  color?: string;
  /**
   * How far away the mouse starts to count for `colors` and `fade`, in px from the nearest edge of a bar's cell, as
   * Proximity measures it. Default: 240.
   */
  reach?: number;
  /** Fade the bars `out` to see-through as the mouse comes near, or start see-through and fade `in`, as Proximity does. Default: no fading. */
  fade?: ProximityFade;
  /** How see-through the bars get at their faintest, from 0 (gone) to 1 (not at all). Default: 0. */
  faintest?: number;
  /**
   * The colors the bars go through as the mouse comes near, from far to near, as Proximity's `colors`: two to go
   * from one to the other, or more to pass through each in turn. Any CSS colors, tokens included. Default: none,
   * so every bar is `color`.
   */
  colors?: string[];
  /** How the colors mix on the way between them: `srgb`, `oklch`, or `hsl`, as Proximity's `colorSpace`. Default: `srgb`. */
  colorSpace?: ColorSpace;
  /** Applied to the canvas, so it's the place for layout classes such as margin. Its size comes from the grid. */
  className?: string;
  /** Reaches the canvas. */
  ref?: Ref<HTMLCanvasElement>;
}

export type LookAtCanvasProps = OwnProps & Omit<CanvasHTMLAttributes<HTMLCanvasElement>, keyof OwnProps | "children">;

/** `emoji` drawn once, turned by `turn` degrees, on a square canvas `size` CSS px across with room to turn it */
function stamp(emoji: string, turn: number, size: number, density: number) {
  const box = Math.ceil(size * 1.5 * density);
  const image = document.createElement("canvas");
  image.width = box;
  image.height = box;
  const context = image.getContext("2d");
  if (!context) return null;
  context.translate(box / 2, box / 2);
  context.rotate((turn * Math.PI) / 180);
  context.font = `${size * density}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, 0, 0);
  return { image, size: box / density };
}

/**
 * LookAt's bar grid drawn on one canvas, rather than as an element per bar: every bar stands on end toward the
 * mouse. There's nothing to measure but the canvas itself, bars are drawn together, and it only draws while bars
 * are still turning, so it stays smooth with thousands of them. It can draw an emoji in place of each bar, and
 * change the bars' color or fade them by how close the mouse is, as Proximity does. Decorative and hidden from
 * screen readers; with reduced motion the bars stay pointing up, though colors and fading still follow the mouse.
 * An experiment: not exported from the package (see CLAUDE.md, Experiments).
 */
export function LookAtCanvas({
  columns = 36,
  rows = 22,
  pitch = 1.375,
  barWidth = 0.1875,
  barLength = 1,
  emoji,
  emojiTurn = 0,
  turnDuration = 120,
  color,
  reach = 240,
  fade,
  faintest = 0,
  colors,
  colorSpace = "srgb",
  className,
  style,
  ref,
  ...rest
}: LookAtCanvasProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const current = { columns, rows, pitch, barWidth, barLength, emoji, emojiTurn, turnDuration, reach, fade, faintest, colors: colors ?? [], colorSpace };
  // The latest settings, for the drawing loop to read without restarting
  const settings = useRef(current);
  // Starts the loop when something changes; set by the effect below
  const wake = useRef(() => {});

  useEffect(() => {
    settings.current = current;
    wake.current();
  });

  // A layout effect, so it's listening as soon as it's on the page: a pointer move in the same moment (a story's
  // play function, say) isn't lost before a passive effect would have run, as LookAt does
  useLayoutEffect(() => {
    const surface = canvas.current!;
    let angles = new Float32Array(0);
    let levels = new Float32Array(0); // each bar's closeness to the pointer, from 0 to 1
    let pointer: { x: number; y: number } | null = null; // in viewport px
    let frame = 0;
    let last: number | null = null; // the previous frame's time, while the loop runs
    let visible = true;
    let theme = 0; // counts theme and motion switches, so colors are worked out again after one
    let palette = { key: "", strokes: [] as string[] };
    let emojiStamp: { key: string; drawn: ReturnType<typeof stamp> } = { key: "", drawn: null };

    /** Any CSS color, tokens and color-mix() included, as the browser works it out on the canvas */
    const resolve = (css: string) => {
      const own = surface.style.color;
      surface.style.color = css;
      const resolved = getComputedStyle(surface).color;
      surface.style.color = own;
      return resolved;
    };

    const draw = (now: number) => {
      frame = 0;
      const context = surface.getContext("2d");
      if (!context) return;
      const { columns, rows, pitch, barWidth, barLength, emoji, emojiTurn, turnDuration, reach, fade, faintest, colors, colorSpace } = settings.current;
      const count = columns * rows;
      if (angles.length !== count) angles = new Float32Array(count);
      if (levels.length !== count) levels = new Float32Array(count);
      const colored = colors.length >= 2 && !emoji;
      const near = colored || Boolean(fade); // whether closeness matters at all

      // Read everything first: one element to measure, however many bars there are
      const area = surface.getBoundingClientRect();
      const look = getComputedStyle(surface);
      const base = look.color;
      const decoration = Number(look.getPropertyValue("--experiment-decoration")) || 0; // 0 with reduced motion
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const density = window.devicePixelRatio || 1;
      const layout = { columns, rows, pitch: pitch * rem };
      const paletteKey = `${theme}/${base}/${colorSpace}/${colored ? colors.join("|") : ""}`;
      if (palette.key !== paletteKey) {
        const strokes = Array.from({ length: LEVELS }, (_, level) => (colored ? resolve(colorAt(colors, level / (LEVELS - 1), colorSpace)!) : base));
        palette = { key: paletteKey, strokes };
      }
      const stampKey = emoji ? `${emoji}/${emojiTurn}/${barLength * rem}/${density}` : "";
      if (emojiStamp.key !== stampKey) emojiStamp = { key: stampKey, drawn: emoji ? stamp(emoji, emojiTurn, barLength * rem, density) : null };

      const elapsed = last === null ? 1000 / 60 : now - last;
      const at = pointer && { x: pointer.x - area.left, y: pointer.y - area.top };
      const amount = catchUp(elapsed, turnDuration);
      const turned = step(angles, layout, at, amount);
      const arrived = near ? approach(levels, layout, at, reach, amount) : true;

      // Then draw, at the screen's pixel density so the bars stay sharp
      const width = Math.round(area.width * density);
      const height = Math.round(area.height * density);
      if (surface.width !== width) surface.width = width;
      if (surface.height !== height) surface.height = height;
      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, area.width, area.height);
      if (emojiStamp.drawn) {
        // Each emoji is the same image, stamped turned: much cheaper than drawing the text every time
        const { image, size } = emojiStamp.drawn;
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const index = row * columns + column;
            const alpha = fadeAlpha(near ? levels[index]! : 0, fade, faintest);
            if (alpha < INVISIBLE) continue; // faded right out: nothing to stamp
            const turn = (angles[index]! * decoration * Math.PI) / 180;
            const [cos, sin] = [Math.cos(turn) * density, Math.sin(turn) * density];
            context.globalAlpha = alpha;
            context.setTransform(cos, sin, -sin, cos, (column + 0.5) * layout.pitch * density, (row + 0.5) * layout.pitch * density);
            context.drawImage(image, -size / 2, -size / 2, size, size);
          }
        }
        context.globalAlpha = 1;
      } else {
        // Bars at the same closeness share a color and opacity, so each step is one path, stroked once
        const paths: (Path2D | undefined)[] = [];
        // The round caps add half the width at each end, so the line itself is that much shorter
        const half = ((barLength - barWidth) * rem) / 2;
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const index = row * columns + column;
            const turn = (angles[index]! * decoration * Math.PI) / 180;
            const x = (column + 0.5) * layout.pitch;
            const y = (row + 0.5) * layout.pitch;
            const dx = Math.sin(turn) * half;
            const dy = -Math.cos(turn) * half;
            const path = (paths[near ? Math.round(levels[index]! * (LEVELS - 1)) : 0] ??= new Path2D());
            path.moveTo(x - dx, y - dy);
            path.lineTo(x + dx, y + dy);
          }
        }
        context.lineWidth = barWidth * rem;
        context.lineCap = "round";
        paths.forEach((path, bucket) => {
          const alpha = fadeAlpha(bucket / (LEVELS - 1), fade, faintest);
          if (!path || alpha < INVISIBLE) return;
          context.strokeStyle = palette.strokes[bucket]!;
          context.globalAlpha = alpha;
          context.stroke(path);
        });
        context.globalAlpha = 1;
      }

      if (turned && arrived) {
        last = null; // rest until something changes
      } else {
        last = now;
        frame = requestAnimationFrame(draw);
      }
    };

    wake.current = () => {
      if (!frame && visible) frame = requestAnimationFrame(draw);
    };
    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      wake.current();
    };
    // The pointer left the window: nothing is near it any more
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return; // just moving from one element to another
      pointer = null;
      wake.current();
    };
    const onChange = () => wake.current();
    const onTheme = () => {
      theme++;
      wake.current();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("scroll", onChange, { passive: true, capture: true });
    window.addEventListener("resize", onChange, { passive: true });
    // A theme or motion switch changes the colors or turns the bars off, without the pointer moving
    const attributes = new MutationObserver(onTheme);
    attributes.observe(document.documentElement, { subtree: true, attributeFilter: ["data-theme", "data-motion"] });
    const media = ["(prefers-color-scheme: dark)", "(prefers-reduced-motion: reduce)"].map((query) => window.matchMedia?.(query));
    media.forEach((list) => list?.addEventListener("change", onTheme));
    const resized = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onChange);
    resized?.observe(surface);
    // Off screen, it doesn't draw at all
    const seen =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry!.isIntersecting;
            if (visible) wake.current();
            else if (frame) {
              cancelAnimationFrame(frame);
              frame = 0;
              last = null;
            }
          });
    seen?.observe(surface);
    wake.current();

    return () => {
      cancelAnimationFrame(frame);
      wake.current = () => {};
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onChange, { capture: true });
      window.removeEventListener("resize", onChange);
      attributes.disconnect();
      media.forEach((list) => list?.removeEventListener("change", onTheme));
      resized?.disconnect();
      seen?.disconnect();
    };
  }, []);

  const setRef = (node: HTMLCanvasElement | null) => {
    canvas.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <canvas
      {...rest}
      ref={setRef}
      className={cx("look-at-canvas", className)}
      aria-hidden="true"
      style={{
        ...style,
        width: `${columns * pitch}rem`,
        height: `${rows * pitch}rem`,
        ...(color && { "--look-at-canvas-color": color }),
      }}
    />
  );
}
