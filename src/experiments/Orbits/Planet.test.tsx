import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Bounce } from "../Bounce/Bounce";
import { collide, G, orbitVelocity, pulls } from "./gravity";
import { Planet } from "./Planet";
import type { PlanetProps } from "./Planet";
import { Star } from "./Star";
import type { StarProps } from "./Star";

describe("pulls", () => {
  const thing = (x: number, mass: number, size = 0) => ({ x, y: 0, width: size, height: size, mass });

  it("pulls each towards the other, by the other's mass", () => {
    const [light, heavy] = pulls([thing(0, 1), thing(100, 10)]);
    expect(light!.ax).toBeCloseTo((G * 10) / 100 ** 2); // towards the heavy one, on the right
    expect(heavy!.ax).toBeCloseTo(-G / 100 ** 2); // towards the light one, on the left, and ten times less
    expect(light!.ay).toBeCloseTo(0);
  });

  it("weakens with the square of the distance", () => {
    expect(pulls([thing(0, 1), thing(200, 10)])[0]!.ax).toBeCloseTo((G * 10) / 200 ** 2);
  });

  it("pulls everything just as fast, whatever its own mass", () => {
    const fall = (mass: number) => pulls([thing(0, mass), thing(100, 50)])[0]!.ax;
    expect(fall(0.1)).toBeCloseTo(fall(20));
  });

  it("adds up the pull of everything else", () => {
    const [middle] = pulls([thing(100, 1), thing(0, 4), thing(300, 4)]);
    expect(middle!.ax).toBeCloseTo((-G * 4) / 100 ** 2 + (G * 4) / 200 ** 2);
  });

  it("leaves massless things out, both ways", () => {
    const [a, massless] = pulls([thing(0, 1), thing(100, 0)]);
    expect(a).toEqual({ ax: 0, ay: 0 });
    expect(massless).toEqual({ ax: 0, ay: 0 });
  });

  it("measures between centers, and stops growing closer than touching", () => {
    // Two 40px things touch at 40px apart, center to center
    expect(pulls([thing(0, 1, 40), thing(100, 1, 40)])[0]!.ax).toBeCloseTo(G / 100 ** 2);
    expect(pulls([thing(0, 1, 40), thing(20, 1, 40)])[0]!.ax).toBeCloseTo(G / 40 ** 2);
  });

  it("doesn't pull things exactly on top of each other any way in particular", () => {
    expect(pulls([thing(0, 1), thing(0, 1)])).toEqual([
      { ax: 0, ay: 0 },
      { ax: 0, ay: 0 },
    ]);
  });
});

describe("collide", () => {
  const solid = (x: number, vx: number, extra: object = {}) => ({ x, y: 0, width: 40, height: 40, vx, vy: 0, mass: 1, fixed: false, ...extra });

  it("moves overlapping things apart until they just touch, the lighter one further", () => {
    const [light, heavy] = collide([solid(0, 0), solid(30, 0, { mass: 3 })]);
    expect(light!.x).toBeCloseTo(-7.5);
    expect(heavy!.x).toBeCloseTo(32.5);
  });

  it("bounces them off each other, softly, and the light one off the heavy one faster", () => {
    // Closing at 300px a second; half of that comes back out, as they bounce apart
    const [light, heavy] = collide([solid(0, 300, { mass: 1 }), solid(30, 0, { mass: 2 })]);
    expect(heavy!.vx - light!.vx).toBeCloseTo(150);
    expect(light!.vx).toBeCloseTo(0); // stopped dead
    expect(heavy!.vx).toBeCloseTo(150);
    // Momentum is kept
    expect(light!.vx * 1 + heavy!.vx * 2).toBeCloseTo(300);
  });

  it("doesn't bounce them when they meet slowly, so they can rest on each other", () => {
    const [a, b] = collide([solid(0, 50), solid(30, 0)]);
    expect(a!.vx).toBeCloseTo(25);
    expect(b!.vx).toBeCloseTo(25);
  });

  it("leaves them moving apart alone", () => {
    const [a, b] = collide([solid(0, -10), solid(30, 10)]);
    expect([a!.vx, b!.vx]).toEqual([-10, 10]);
  });

  it("moves only the free one when the other is fixed, however light the fixed one is", () => {
    const [star, planet] = collide([solid(0, 0, { fixed: true, mass: 0.1 }), solid(30, -300)]);
    expect(star!.x).toBe(0);
    expect(star!.vx).toBe(0);
    expect(planet!.x).toBeCloseTo(40);
    expect(planet!.vx).toBeCloseTo(150); // bounced back at half speed
  });

  it("leaves things that don't overlap, and massless things, alone", () => {
    expect(collide([solid(0, 5), solid(50, -5)]).map(({ x, vx }) => [x, vx])).toEqual([
      [0, 5],
      [50, -5],
    ]);
    expect(collide([solid(0, 5), solid(30, -5, { mass: 0 })]).map(({ x }) => x)).toEqual([0, 30]);
  });
});

describe("orbitVelocity", () => {
  const body = (x: number, y: number, mass: number, extra: object = {}) => ({ x, y, width: 0, height: 0, vx: 0, vy: 0, mass, fixed: false, ...extra });

  it("goes round at the speed of a circular orbit, at right angles to the star", () => {
    const star = body(0, 0, 100);
    const planet = body(200, 0, 1);
    // On the right of the star: clockwise goes down the screen, counterclockwise goes up
    expect(orbitVelocity(planet, [star, planet], "clockwise")).toEqual({ vx: expect.closeTo(0), vy: expect.closeTo(150) });
    expect(orbitVelocity(planet, [star, planet], "counterclockwise")).toEqual({ vx: expect.closeTo(0), vy: expect.closeTo(-150) });
  });

  it("orbits whatever pulls hardest, not whatever is closest or heaviest", () => {
    const star = body(0, 0, 100);
    const planet = body(400, 0, 25, { vx: 0, vy: -100 });
    const moon = body(450, 0, 0.1);
    // The planet pulls at 25 / 50² and the star at 100 / 450²: it goes round the planet, carried along with it
    const velocity = orbitVelocity(moon, [star, planet, moon], "counterclockwise")!;
    expect(velocity.vx).toBeCloseTo(0);
    expect(velocity.vy).toBeCloseTo(-100 - Math.sqrt((G * 25) / 50));
  });

  it("is null when nothing has mass to orbit", () => {
    const planet = body(200, 0, 1);
    expect(orbitVelocity(planet, [planet, body(0, 0, 0)], "clockwise")).toBeNull();
  });
});

describe("Planet and Star", () => {
  const centerOf = (element: Element) => {
    const [x, y] = (element as HTMLElement).style.transform.match(/-?[\d.]+/g)!.map(Number);
    return { x: x! + 20, y: y! + 20 };
  };
  const apart = (a: Element, b: Element) => Math.hypot(centerOf(a).x - centerOf(b).x, centerOf(a).y - centerOf(b).y);

  // jsdom has no layout: a 600px square window, and 40px things, so they have something to touch with (560px of
  // room each way). Animation frames run on fake timers.
  const spies: { mockRestore: () => void }[] = [];
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    spies.push(vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(600));
    spies.push(vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600));
    spies.push(vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(40));
    spies.push(vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40));
  });
  afterEach(() => {
    vi.useRealTimers();
    spies.splice(0).forEach((spy) => spy.mockRestore()); // not restoreAllMocks: tests/setup.ts spies on console.warn
  });

  // The star in the middle, at (300, 300); the planet `startX` across, on the same line
  const system = (planet: PlanetProps = {}, star: StarProps = {}) => (
    <>
      <Star bounds="viewport" startX={0.5} startY={0.5} data-testid="star" {...star} />
      <Planet bounds="viewport" speed={0} startX={0.75} startY={0.5} data-testid="planet" {...planet} />
    </>
  );
  const parts = (container: HTMLElement) => [...container.querySelectorAll(".bounce")] as [Element, Element];

  describe("rendering", () => {
    it("are both a Bounce, hidden from screen readers", () => {
      const { container } = render(system());
      const [star, planet] = parts(container);
      expect(star).toHaveClass("bounce");
      expect(star).toHaveAttribute("aria-hidden", "true");
      expect(planet).toHaveClass("bounce");
      expect(planet).toHaveAttribute("aria-hidden", "true");
    });

    it("makes the star grabbable by default, and lets that be turned off", () => {
      const { container, rerender } = render(system());
      expect(parts(container)[0]).toHaveAttribute("data-grabbable");
      rerender(system({}, { grabbable: false }));
      expect(parts(container)[0]).not.toHaveAttribute("data-grabbable");
    });

    it("passes Bounce props through, and forwards the ref", () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(<Planet ref={ref} grabbable className="z-10" />);
      const planet = container.querySelector(".bounce");
      expect(planet).toHaveAttribute("data-grabbable");
      expect(planet).toHaveClass("bounce", "z-10");
      expect(ref.current).toBe(planet);
    });
  });

  describe("gravity", () => {
    it("pulls a planet that starts still straight into the star, where it comes to rest touching it", () => {
      const { container } = render(system());
      const [star, planet] = parts(container);
      expect(apart(star, planet)).toBe(140);
      act(() => vi.advanceTimersByTime(3000));
      expect(apart(star, planet)).toBeCloseTo(40, 0); // 40px things, touching
      expect(centerOf(star)).toEqual({ x: 300, y: 300 }); // the star hasn't moved
    });

    it("puts a planet with an orbit in a circular orbit, the way it says", () => {
      const { container } = render(system({ orbit: "counterclockwise" }));
      const [star, planet] = parts(container);
      // At 140px from a mass of 100, a quarter of the way round takes π × 140 ÷ 2 ÷ 179px a second, about 1.2s
      const quarter = (Math.PI * 140) / 2 / Math.sqrt((G * 100) / 140);
      act(() => vi.advanceTimersByTime(quarter * 1000));
      expect(Math.abs(apart(star, planet) - 140)).toBeLessThan(5);
      expect(Math.abs(centerOf(planet).x - 300)).toBeLessThan(10); // straight above the star
      expect(centerOf(planet).y).toBeLessThan(200);
    });

    it("goes the other way round clockwise", () => {
      const { container } = render(system({ orbit: "clockwise" }));
      act(() => vi.advanceTimersByTime(500));
      expect(centerOf(parts(container)[1]).y).toBeGreaterThan(330);
    });

    it("pulls one planet towards another, harder the heavier the other one is", () => {
      const pair = (mass: number) => (
        <>
          <Planet bounds="viewport" speed={0} startX={0.25} startY={0.5} />
          <Planet bounds="viewport" speed={0} startX={0.75} startY={0.5} mass={mass} />
        </>
      );
      const moved = (mass: number) => {
        const { container, unmount } = render(pair(mass));
        act(() => vi.advanceTimersByTime(300));
        const x = centerOf(container.querySelector(".bounce")!).x;
        unmount();
        return x - 160;
      };
      const [light, heavy] = [moved(1), moved(20)];
      expect(light).toBeGreaterThan(0);
      expect(heavy).toBeGreaterThan(light * 10);
    });

    it("ignores a plain Bounce, and doesn't pull it", () => {
      const { container } = render(
        <>
          <Star bounds="viewport" startX={0.5} startY={0.5} />
          <Bounce bounds="viewport" speed={0} startX={0.75} startY={0.5} />
        </>,
      );
      act(() => vi.advanceTimersByTime(500));
      const [, plain] = parts(container);
      expect(centerOf(plain).x).toBe(440);
    });

    it("only pulls things in the same box", () => {
      const { container } = render(system());
      const [star] = parts(container);
      Object.defineProperty(star, "offsetParent", { get: () => container });
      act(() => vi.advanceTimersByTime(500));
      expect(centerOf(parts(container)[1]).x).toBe(440);
    });

    it("follows a change of mass", () => {
      const { container, rerender } = render(system({}, { mass: 0 }));
      act(() => vi.advanceTimersByTime(300));
      expect(centerOf(parts(container)[1]).x).toBe(440); // a massless star pulls nothing
      rerender(system({}, { mass: 100 }));
      act(() => vi.advanceTimersByTime(500));
      expect(centerOf(parts(container)[1]).x).toBeLessThan(430);
    });

    it("holds still while paused, though it still pulls others", () => {
      const { container } = render(
        <>
          <Planet bounds="viewport" speed={0} startX={0.25} startY={0.5} mass={50} paused />
          <Planet bounds="viewport" speed={0} startX={0.75} startY={0.5} />
        </>,
      );
      act(() => vi.advanceTimersByTime(1000));
      const [held, free] = parts(container);
      expect(centerOf(held).x).toBe(160);
      expect(centerOf(free).x).toBeLessThan(430);
    });
  });

  it("types: a planet takes every Bounce prop, a mass, and an orbit; a star takes no props for moving", () => {
    expectTypeOf<PlanetProps["mass"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PlanetProps["orbit"]>().toEqualTypeOf<"clockwise" | "counterclockwise" | undefined>();
    expectTypeOf<PlanetProps["gravity"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<StarProps>().not.toHaveProperty("speed");
    expectTypeOf<StarProps>().not.toHaveProperty("orbit");
    expectTypeOf<StarProps>().not.toHaveProperty("paused");
    expectTypeOf<StarProps["mass"]>().toEqualTypeOf<number | undefined>();
  });
});
