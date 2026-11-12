import { render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { approach, barAngle, catchUp, fadeAlpha, nearestHalfTurn, step } from "@/experiments/LookAtCanvas/field";
import { LookAtCanvas } from "@/experiments/LookAtCanvas/LookAtCanvas";

describe("field math", () => {
  it("stands a bar on end toward the pointer, clockwise from up", () => {
    expect(barAngle(0, -10)).toBe(0); // above
    expect(barAngle(10, 0)).toBe(90); // to the right
    expect(barAngle(0, 10)).toBe(180); // below
    expect(barAngle(-10, 0)).toBe(270); // to the left
  });

  it("has no angle when the pointer is on the bar's center", () => {
    expect(barAngle(0, 0)).toBeNull();
  });

  it("never turns a bar more than a quarter turn, since it looks the same half way round", () => {
    expect(nearestHalfTurn(0, 270)).toBe(-90);
    expect(nearestHalfTurn(0, 180)).toBe(0);
    expect(nearestHalfTurn(170, -170)).toBe(190);
    expect(nearestHalfTurn(720, 45)).toBe(765);
  });

  it("snaps with no turn duration, and is 95% of the way there after it", () => {
    expect(catchUp(16, 0)).toBe(1);
    expect(catchUp(120, 120)).toBeCloseTo(0.95, 2);
  });

  it("turns the same amount whatever the frame rate", () => {
    const twoShort = 1 - (1 - catchUp(8, 120)) ** 2;
    expect(twoShort).toBeCloseTo(catchUp(16, 120), 10);
  });

  it("turns each bar from its own center, and reports when they've all arrived", () => {
    const angles = new Float32Array(2);
    const layout = { columns: 2, rows: 1, pitch: 20 };
    // Bars at x 10 and 30; the pointer below and between them
    expect(step(angles, layout, { x: 20, y: 20 }, 1)).toBe(false);
    expect(angles[0]).toBeCloseTo(-45, 4);
    expect(angles[1]).toBeCloseTo(45, 4);
    expect(step(angles, layout, { x: 20, y: 20 }, 1)).toBe(true);
  });

  it("turns part of the way with a smaller amount", () => {
    const angles = new Float32Array([10]); // not upright: a quarter turn could go either way
    step(angles, { columns: 1, rows: 1, pitch: 20 }, { x: 40, y: 10 }, 0.5);
    expect(angles[0]).toBeCloseTo(50, 4);
  });

  it("turns nothing before the pointer has moved, and a bar the pointer is on as it was", () => {
    const angles = new Float32Array([10, 30]);
    expect(step(angles, { columns: 2, rows: 1, pitch: 20 }, null, 1)).toBe(true);
    expect([...angles]).toEqual([10, 30]);
    step(angles, { columns: 2, rows: 1, pitch: 20 }, { x: 30, y: 10 }, 1);
    expect(angles[1]).toBeCloseTo(30, 4);
    expect(angles[0]).toBeCloseTo(90, 4);
  });
});

describe("closeness and fading", () => {
  // Two 20px cells side by side, from x 0 to 40
  const layout = { columns: 2, rows: 1, pitch: 20 };

  it("measures each bar's closeness from the edge of its cell, as Proximity does", () => {
    const levels = new Float32Array(2);
    expect(approach(levels, layout, { x: 10, y: 10 }, 100, 1)).toBe(false);
    expect(levels[0]).toBe(1); // over the first cell
    expect(levels[1]).toBeCloseTo(0.9, 5); // 10px from the second cell's left edge
    approach(levels, layout, { x: 90, y: 10 }, 100, 1);
    expect(levels[1]).toBeCloseTo(0.5, 5); // 50px past the second cell's right edge
    expect(levels[0]).toBeCloseTo(0.3, 5); // 70px past the first's
  });

  it("moves part of the way with a smaller amount, and reports when it's arrived", () => {
    const levels = new Float32Array(2);
    approach(levels, layout, { x: 10, y: 10 }, 0, 0.5);
    expect(levels[0]).toBeCloseTo(0.5, 5);
    expect(levels[1]).toBe(0); // out of reach
    expect(approach(levels, layout, { x: 10, y: 10 }, 0, 1)).toBe(false);
    expect(approach(levels, layout, { x: 10, y: 10 }, 0, 1)).toBe(true);
  });

  it("heads back to nothing when the pointer leaves", () => {
    const levels = new Float32Array([1, 0.5]);
    approach(levels, layout, null, 100, 1);
    expect([...levels]).toEqual([0, 0]);
  });

  it("fades out, fades in, or doesn't fade, down to the faintest", () => {
    expect(fadeAlpha(1, "out", 0.2)).toBeCloseTo(0.2);
    expect(fadeAlpha(0, "out", 0.2)).toBe(1);
    expect(fadeAlpha(0, "in", 0.2)).toBeCloseTo(0.2);
    expect(fadeAlpha(1, "in", 0.2)).toBe(1);
    expect(fadeAlpha(0.5, "in", 0)).toBe(0.5);
    expect(fadeAlpha(1, undefined, 0.2)).toBe(1);
    expect(fadeAlpha(1, "out", -1)).toBe(0); // the faintest is kept between 0 and 1
  });
});

describe("LookAtCanvas", () => {
  // jsdom has no canvas drawing; with no context the loop draws nothing
  const spies: { mockRestore: () => void }[] = [];
  beforeEach(() => {
    spies.push(vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null));
  });
  afterEach(() => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
  });

  it("is one canvas, hidden from screen readers", () => {
    const { container } = render(<LookAtCanvas />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("look-at-canvas");
  });

  it("sizes itself from the grid, in rem", () => {
    const { container } = render(<LookAtCanvas columns={10} rows={4} pitch={2} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.width).toBe("20rem");
    expect(canvas.style.height).toBe("8rem");
  });

  it("defaults to the dense bar grid's size", () => {
    const { container } = render(<LookAtCanvas />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.width).toBe("49.5rem");
    expect(canvas.style.height).toBe("30.25rem");
  });

  it("passes a color to its CSS, and nothing without one", () => {
    const { container, rerender } = render(<LookAtCanvas color="var(--ink)" />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.getPropertyValue("--look-at-canvas-color")).toBe("var(--ink)");
    rerender(<LookAtCanvas />);
    expect(canvas).toBeInTheDocument();
    expect(canvas.style.getPropertyValue("--look-at-canvas-color")).toBe("");
  });

  it("merges className, passes other props through, and forwards its ref", () => {
    const ref = createRef<HTMLCanvasElement>();
    const { container } = render(<LookAtCanvas ref={ref} className="m-4" data-testid="field" style={{ opacity: 0.5 }} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toHaveClass("look-at-canvas", "m-4");
    expect(canvas).toHaveAttribute("data-testid", "field");
    expect(canvas.style.opacity).toBe("0.5");
    expect(ref.current).toBe(canvas);
  });

  it("stops listening when it unmounts", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    spies.push(remove);
    const { unmount } = render(<LookAtCanvas />);
    unmount();
    expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
  });
});
