import { useLayoutEffect, useRef, useState } from "react";
import { measureShapes } from "@/experiments/AutoSkeleton/shapes";
import type { Shape } from "@/experiments/AutoSkeleton/shapes";
import { ApplicationList, applications } from "@/experiments/AutoSkeleton/sample";
import "@/experiments/AutoSkeleton/explain.css";

const names = { frame: "Container, kept as it is", box: "Token or control, one gray shape", line: "Line of text, one bar" };

/**
 * A real card, loaded and visible, with each shape the measuring code finds outlined on top of it: the same
 * measureShapes the skeleton runs.
 */
export function Measured() {
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  useLayoutEffect(() => {
    const measure = () => setShapes(measureShapes(content.current!, overlay.current!));
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(content.current!);
    void document.fonts.ready.then(measure);
    return () => resize.disconnect();
  }, []);

  return (
    <div className="explain-measured">
      <div className="explain-measured__stage">
        <div ref={content}>
          <ApplicationList applications={applications.slice(0, 1)} />
        </div>
        <div ref={overlay} className="explain-measured__overlay" aria-hidden="true">
          {shapes.map((shape, index) => (
            <span
              key={index}
              className="explain-measured__shape"
              data-kind={shape.kind}
              style={{
                left: shape.x,
                top: shape.y,
                width: shape.width,
                height: shape.height,
                borderRadius: shape.kind === "line" ? "var(--radius-sm)" : shape.borderRadius,
              }}
            />
          ))}
        </div>
      </div>
      <ul className="explain-measured__key">
        {(["frame", "box", "line"] as const).map((kind) => (
          <li key={kind}>
            <span className="explain-measured__swatch" data-kind={kind} aria-hidden="true" />
            {names[kind]}: {shapes.filter((shape) => shape.kind === kind).length}
          </li>
        ))}
      </ul>
    </div>
  );
}
