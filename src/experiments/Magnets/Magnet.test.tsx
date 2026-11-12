import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Bounce } from "@/experiments/Bounce/Bounce";
import { forces, separate } from "@/experiments/Magnets/forces";
import { Magnet } from "@/experiments/Magnets/Magnet";
import type { MagnetProps } from "@/experiments/Magnets/Magnet";

describe("forces", () => {
  const thing = (x: number, charge: number, size = 0) => ({ x, y: 0, width: size, height: size, charge });

  it("pulls opposite charges together", () => {
    const [a, b] = forces([thing(0, 1), thing(100, -1)]);
    expect(a!.ax).toBeCloseTo(600); // towards b, on the right
    expect(b!.ax).toBeCloseTo(-600); // towards a, on the left
    expect(a!.ay).toBeCloseTo(0);
  });

  it("pushes like charges apart, for negative charges as well as positive", () => {
    const [a, b] = forces([thing(0, 1), thing(100, 1)]);
    expect(a!.ax).toBeCloseTo(-600);
    expect(b!.ax).toBeCloseTo(600);
    expect(forces([thing(0, -1), thing(100, -1)])[0]!.ax).toBeCloseTo(-600);
  });

  it("is stronger for bigger charges, and weaker with the square of the distance", () => {
    expect(forces([thing(0, 2), thing(100, -3)])[0]!.ax).toBeCloseTo(3600);
    expect(forces([thing(0, 1), thing(200, -1)])[0]!.ax).toBeCloseTo(150);
  });

  it("adds up the pull of every other charge", () => {
    const [middle] = forces([thing(100, 1), thing(0, -1), thing(300, -1)]);
    expect(middle!.ax).toBeCloseTo(-600 + 150);
  });

  it("leaves neutral things alone, and doesn't let them affect others", () => {
    const [a, neutral] = forces([thing(0, 1), thing(100, 0)]);
    expect(a).toEqual({ ax: 0, ay: 0 });
    expect(neutral).toEqual({ ax: 0, ay: 0 });
  });

  it("measures between centers, and stops growing closer than touching", () => {
    // Two 40px things touch at 40px apart, center to center
    expect(forces([thing(0, 1, 40), thing(100, -1, 40)])[0]!.ax).toBeCloseTo(600);
    expect(forces([thing(0, 1, 40), thing(20, -1, 40)])[0]!.ax).toBeCloseTo(6_000_000 / 40 ** 2);
  });

  it("doesn't push things exactly on top of each other any way in particular", () => {
    expect(forces([thing(0, 1), thing(0, -1)])).toEqual([
      { ax: 0, ay: 0 },
      { ax: 0, ay: 0 },
    ]);
  });
});

describe("separate", () => {
  const solid = (x: number, vx: number, extra: object = {}) => ({ x, y: 0, width: 40, height: 40, vx, vy: 0, charge: 1, fixed: false, ...extra });

  it("moves overlapping things apart until they just touch, sharing the move", () => {
    const [a, b] = separate([solid(0, 0), solid(30, 0)]);
    expect(a!.x).toBeCloseTo(-5);
    expect(b!.x).toBeCloseTo(35);
  });

  it("stops them moving into each other, keeping their shared speed", () => {
    const [a, b] = separate([solid(0, 100), solid(30, -20)]);
    expect(a!.vx).toBeCloseTo(40);
    expect(b!.vx).toBeCloseTo(40);
  });

  it("leaves them moving apart alone", () => {
    const [a, b] = separate([solid(0, -10), solid(30, 10)]);
    expect([a!.vx, b!.vx]).toEqual([-10, 10]);
  });

  it("moves only the free one when the other is fixed", () => {
    const [fixed, free] = separate([solid(0, 0, { fixed: true }), solid(30, -50)]);
    expect(fixed!.x).toBe(0);
    expect(free!.x).toBeCloseTo(40);
    expect(free!.vx).toBeCloseTo(0);
  });

  it("leaves things that don't overlap, and neutral things, alone", () => {
    expect(separate([solid(0, 5), solid(50, -5)]).map(({ x, vx }) => [x, vx])).toEqual([
      [0, 5],
      [50, -5],
    ]);
    expect(separate([solid(0, 5), solid(30, -5, { charge: 0 })]).map(({ x }) => x)).toEqual([0, 30]);
  });
});

describe("Magnet", () => {
  const position = (element: HTMLElement) => element.style.transform.match(/-?[\d.]+/g)!.map(Number);

  // jsdom has no layout: a 200px by 100px window, and 20px magnets, so they have something to touch with (180px
  // of room across). Animation frames run on fake timers.
  const spies: { mockRestore: () => void }[] = [];
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    spies.push(vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(200));
    spies.push(vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(100));
    spies.push(vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(20));
    spies.push(vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(20));
  });
  afterEach(() => {
    vi.useRealTimers();
    spies.splice(0).forEach((spy) => spy.mockRestore()); // not restoreAllMocks: tests/setup.ts spies on console.warn
  });

  describe("rendering", () => {
    it("is a Bounce, with a charge of 1 by default, shown in data-charge", () => {
      const { container } = render(<Magnet />);
      const magnet = container.querySelector(".bounce");
      expect(magnet).toHaveAttribute("aria-hidden", "true");
      expect(magnet).toHaveAttribute("data-charge", "positive");
    });

    it("says whether its charge is positive, negative, or neutral", () => {
      const { container, rerender } = render(<Magnet charge={-2} />);
      expect(container.querySelector(".bounce")).toHaveAttribute("data-charge", "negative");
      rerender(<Magnet charge={0} />);
      expect(container.querySelector(".bounce")).toHaveAttribute("data-charge", "neutral");
    });

    it("passes Bounce props through, and forwards the ref", () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(<Magnet ref={ref} grabbable className="z-10" />);
      const magnet = container.querySelector(".bounce");
      expect(magnet).toHaveAttribute("data-grabbable");
      expect(magnet).toHaveClass("bounce", "z-10");
      expect(ref.current).toBe(magnet);
    });
  });

  describe("charges", () => {
  const twoApart = (charges: [number, number], extra: object = {}) => (
    <>
      <Magnet bounds="viewport" speed={0} startX={0.25} startY={0.5} charge={charges[0]} data-testid="a" />
      <Magnet bounds="viewport" speed={0} startX={0.75} startY={0.5} charge={charges[1]} data-testid="b" {...extra} />
    </>
  );
  const apart = (container: HTMLElement) => {
    const [a, b] = [...container.querySelectorAll<HTMLElement>(".bounce")].map((element) => position(element)[0]!);
    return b! - a!;
  };

  it("pulls opposite charges together until they touch", () => {
    const { container } = render(twoApart([1, -1]));
    expect(apart(container)).toBe(90);
    act(() => vi.advanceTimersByTime(500));
    expect(apart(container)).toBeCloseTo(20); // 20px balls, touching
  });

  it("pushes like charges apart", () => {
    const { container } = render(twoApart([1, 1]));
    act(() => vi.advanceTimersByTime(500));
    expect(apart(container)).toBeGreaterThan(100);
  });

  it("leaves neutral things where they are", () => {
    const { container } = render(twoApart([1, 0]));
    act(() => vi.advanceTimersByTime(500));
    expect(apart(container)).toBe(90);
  });

  it("still pulls while paused, like a fixed magnet", () => {
    const { container } = render(twoApart([1, -1], { paused: true }));
    act(() => vi.advanceTimersByTime(500));
    const [a, b] = [...container.querySelectorAll<HTMLElement>(".bounce")].map((element) => position(element)[0]!);
    expect(b).toBe(135);
    expect(a).toBeCloseTo(115); // touching it
  });

  it("only affects things in the same box", () => {
    const { container } = render(twoApart([1, -1]));
    const [, b] = container.querySelectorAll<HTMLElement>(".bounce");
    Object.defineProperty(b!, "offsetParent", { get: () => container });
    act(() => vi.advanceTimersByTime(500));
    expect(position(container.querySelector<HTMLElement>(".bounce")!)[0]).toBe(45);
  });

    it("ignores a plain Bounce", () => {
      const { container } = render(
        <>
          <Magnet bounds="viewport" speed={0} startX={0.25} startY={0.5} />
          <Bounce bounds="viewport" speed={0} startX={0.75} startY={0.5} />
        </>,
      );
      act(() => vi.advanceTimersByTime(500));
      const [magnet, plain] = [...container.querySelectorAll<HTMLElement>(".bounce")].map((element) => position(element)[0]);
      expect([magnet, plain]).toEqual([45, 135]);
    });

    it("follows a change of charge", () => {
      const pair = (right: number) => (
        <>
          <Magnet bounds="viewport" speed={0} startX={0.25} startY={0.5} />
          <Magnet bounds="viewport" speed={0} startX={0.75} startY={0.5} charge={right} />
        </>
      );
      const { container, rerender } = render(pair(1));
      act(() => vi.advanceTimersByTime(200));
      const [a, b] = [...container.querySelectorAll<HTMLElement>(".bounce")].map((element) => position(element)[0]!);
      expect(b! - a!).toBeGreaterThan(90); // like charges: apart
      rerender(pair(-1));
      act(() => vi.advanceTimersByTime(1000));
      const [c, d] = [...container.querySelectorAll<HTMLElement>(".bounce")].map((element) => position(element)[0]!);
      expect(d! - c!).toBeCloseTo(20); // opposites: touching
    });
  });

  it("types: takes every Bounce prop, and a charge", () => {
    expectTypeOf<MagnetProps["charge"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<MagnetProps["gravity"]>().toEqualTypeOf<number | undefined>();
  });
});
