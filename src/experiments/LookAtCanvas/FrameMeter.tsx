import { useEffect, useRef } from "react";

/** How often the reading updates, in ms */
const WINDOW = 500;

/**
 * Frames per second, and the slowest frame, over the last half second. It counts animation frames, so anything
 * that keeps the main thread busy (measuring hundreds of elements, say) shows up as fewer frames and slow ones.
 * Updates its text directly, not through React, so it doesn't add renders of its own to what it measures.
 */
export function FrameMeter() {
  const output = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let start = previous;
    let frames = 0;
    let worst = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      worst = Math.max(worst, now - previous);
      previous = now;
      frames++;
      if (now - start < WINDOW) return;
      const fps = Math.round((frames * 1000) / (now - start));
      if (output.current) output.current.textContent = `${fps} fps · slowest frame ${Math.round(worst)} ms`;
      start = now;
      frames = 0;
      worst = 0;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span ref={output} style={{ fontVariantNumeric: "tabular-nums" }}>
      Measuring…
    </span>
  );
}
