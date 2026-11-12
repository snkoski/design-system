import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton, SkeletonItem } from "@/components/Skeleton";
import { cx } from "@/internal/cx";
import { measureShapes } from "@/experiments/AutoSkeleton/shapes";
import type { Shape } from "@/experiments/AutoSkeleton/shapes";
import "@/experiments/AutoSkeleton/auto-skeleton.css";

export interface AutoSkeletonProps {
  /**
   * While true, the children are drawn as a skeleton: give them placeholder data of a typical length. When false,
   * the children render as they are, with nothing around them.
   */
  loading: boolean;
  /** What's loading, as plain text that ends with an ellipsis: "Loading applications…". Announced, never shown. */
  label: string;
  /** Milliseconds to wait before showing and announcing the skeleton, as on `Skeleton`. Default: `0`. */
  delay?: number;
  /** The real content, the same while loading and once loaded: only its data changes. */
  children: ReactNode;
  /** Applied to the skeleton's outer `<div>` while loading. */
  className?: string;
}

/**
 * Draws a skeleton of whatever is inside it, automatically, instead of shapes built by hand. While `loading`, it
 * renders the real children (with placeholder data) invisibly, measures them, and draws a gray bar for every line
 * of text and a gray box for every image, control, and badge, keeping each card's or panel's own fill and edge.
 * Screen readers hear the label once, as with `Skeleton`. An experiment: not exported from the package (see
 * CLAUDE.md, Experiments).
 */
export function AutoSkeleton({ loading, children, ...rest }: AutoSkeletonProps) {
  if (!loading) return <>{children}</>;
  return <Loading {...rest}>{children}</Loading>;
}

function Loading({ label, delay, className, children }: Omit<AutoSkeletonProps, "loading">) {
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Measures before the first paint, then again whenever the content's size, its DOM, the theme, or the fonts
  // change. A layout effect, so the skeleton never shows empty for a frame.
  useLayoutEffect(() => {
    const root = content.current!;
    const origin = overlay.current!;
    let last = "";
    let frame = 0;
    const measure = () => {
      const next = measureShapes(root, origin);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setShapes(next);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();

    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : undefined;
    resize?.observe(root);
    const changes = new MutationObserver(schedule);
    changes.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
    const settings = new MutationObserver(schedule);
    settings.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-pointer", "data-density"] });
    const scheme = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : undefined;
    scheme?.addEventListener("change", schedule);
    // Images don't bubble their load event, so listen while it travels down
    root.addEventListener("load", schedule, true);
    let live = true;
    void document.fonts?.ready.then(() => live && schedule());

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      changes.disconnect();
      settings.disconnect();
      scheme?.removeEventListener("change", schedule);
      root.removeEventListener("load", schedule, true);
    };
  }, []);

  return (
    <Skeleton label={label} delay={delay} className={cx("auto-skeleton", className)}>
      {/* The real content: laid out, but invisible, out of the tab order, and hidden from screen readers */}
      <div ref={content} className="auto-skeleton__content" inert aria-hidden="true">
        {children}
      </div>
      <div ref={overlay} className="auto-skeleton__overlay" aria-hidden="true">
        {shapes.map((shape, index) => (
          <Drawn key={index} shape={shape} />
        ))}
      </div>
    </Skeleton>
  );
}

/** One measured shape: a copy of a container's look, or a gray SkeletonItem */
function Drawn({ shape }: { shape: Shape }) {
  const place: CSSProperties = { left: shape.x, top: shape.y, width: shape.width, height: shape.height };
  if (shape.kind === "frame") {
    return (
      <div
        className="auto-skeleton__frame"
        style={{
          ...place,
          background: shape.background,
          borderWidth: shape.borderWidth,
          borderStyle: shape.borderStyle,
          borderColor: shape.borderColor,
          borderRadius: shape.borderRadius,
          boxShadow: shape.boxShadow,
        }}
      />
    );
  }
  const borderRadius = shape.kind === "line" ? "var(--radius-sm)" : shape.borderRadius;
  return <SkeletonItem shape="box" className="auto-skeleton__shape" style={{ ...place, borderRadius }} />;
}
