import { useEffect } from "react";
import type { RefObject } from "react";

/** How long one loop of the sweep takes, in ms */
const PERIOD = 6000;

/**
 * While `on`, moves a pretend mouse in a figure eight over `target`, one pointermove a frame, so the canvas and the
 * elements get exactly the same work and can be compared without waving a real mouse (or on a phone).
 */
export function useSweep(on: boolean, target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const area = target.current?.getBoundingClientRect();
      if (!area) return;
      // Only the part on screen, so a grid bigger than the window is swept where you can see it
      const left = Math.max(area.left, 0);
      const top = Math.max(area.top, 0);
      const width = Math.min(area.right, window.innerWidth) - left;
      const height = Math.min(area.bottom, window.innerHeight) - top;
      if (width <= 0 || height <= 0) return;
      const phase = ((now - start) / PERIOD) * 2 * Math.PI;
      const x = left + width * (0.5 + 0.4 * Math.sin(phase));
      const y = top + height * (0.5 + 0.4 * Math.sin(phase * 2));
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on, target]);
}
