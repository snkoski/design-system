import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Bounce } from "./Bounce";
import type { BounceProps } from "./Bounce";
import { interact } from "./mover";
import type { Member } from "./mover";
import { step, velocity } from "./physics";

const float = { gravity: 0, bounciness: 1 };
const room = { width: 100, height: 50 };

describe("step", () => {
  it("moves by its velocity for the time given", () => {
    const { body, edges } = step({ x: 10, y: 10, vx: 20, vy: -10 }, room, 0.5, float);
    expect(body).toEqual({ x: 20, y: 5, vx: 20, vy: -10 });
    expect(edges).toEqual([]);
  });

  it("doesn't move in no time", () => {
    expect(step({ x: 10, y: 10, vx: 20, vy: 20 }, room, 0, float).body).toEqual({ x: 10, y: 10, vx: 20, vy: 20 });
  });

  it.each([
    ["left", { x: 5, y: 20, vx: -20, vy: 0 }, { x: 0, y: 20, vx: 20, vy: 0 }],
    ["right", { x: 95, y: 20, vx: 20, vy: 0 }, { x: 100, y: 20, vx: -20, vy: 0 }],
    ["top", { x: 50, y: 5, vx: 0, vy: -20 }, { x: 50, y: 0, vx: 0, vy: 20 }],
    ["bottom", { x: 50, y: 45, vx: 0, vy: 20 }, { x: 50, y: 50, vx: 0, vy: -20 }],
  ] as const)("bounces off the %s edge, staying inside", (edge, from, to) => {
    const { body, edges } = step(from, room, 0.5, float);
    expect(body).toEqual(to);
    expect(edges).toEqual([edge]);
  });

  it("reports both edges in a corner", () => {
    const { body, edges } = step({ x: 95, y: 45, vx: 20, vy: 20 }, room, 0.5, float);
    expect(body).toEqual({ x: 100, y: 50, vx: -20, vy: -20 });
    expect(edges).toEqual(["right", "bottom"]);
  });

  it("doesn't bounce again while already heading away from an edge", () => {
    const { body, edges } = step({ x: 0, y: 20, vx: 20, vy: 0 }, room, 0, float);
    expect(body.vx).toBe(20);
    expect(edges).toEqual([]);
  });

  it("keeps only part of its speed with less bounciness", () => {
    expect(step({ x: 95, y: 20, vx: 20, vy: 0 }, room, 0.5, { gravity: 0, bounciness: 0.5 }).body.vx).toBe(-10);
    expect(step({ x: 95, y: 20, vx: 20, vy: 0 }, room, 0.5, { gravity: 0, bounciness: 0 }).body.vx).toBe(-0);
  });

  it("speeds up downward under gravity", () => {
    const { body } = step({ x: 50, y: 0, vx: 0, vy: 0 }, room, 0.1, { gravity: 100, bounciness: 1 });
    expect(body.vy).toBeCloseTo(10);
    expect(body.y).toBeCloseTo(1);
  });

  it("rests on the floor under gravity, rather than bouncing every frame", () => {
    let body = { x: 50, y: 50, vx: 0, vy: 0 };
    for (let frame = 0; frame < 10; frame++) {
      const result = step(body, room, 1 / 60, { gravity: 1000, bounciness: 0.8 });
      expect(result.edges).toEqual([]);
      body = result.body;
    }
    expect(body).toEqual({ x: 50, y: 50, vx: 0, vy: 0 });
  });

  it("still bounces off the floor when it lands hard", () => {
    const { body, edges } = step({ x: 50, y: 49, vx: 0, vy: 400 }, room, 1 / 60, { gravity: 1000, bounciness: 0.5 });
    expect(edges).toEqual(["bottom"]);
    expect(body.vy).toBeLessThan(0);
  });

  it("sits still in a direction with no room to move", () => {
    const { body, edges } = step({ x: 0, y: 20, vx: 20, vy: 0 }, { width: 0, height: 50 }, 0.5, float);
    expect(body.x).toBe(0);
    expect(edges).toEqual([]);
  });
});

describe("step with friction", () => {
  it("slows down by itself", () => {
    const { body } = step({ x: 50, y: 20, vx: 20, vy: -10 }, room, 1, { gravity: 0, bounciness: 1, friction: Math.LN2 });
    expect(body.vx).toBeCloseTo(10); // friction ln 2 halves the speed each second
    expect(body.vy).toBeCloseTo(-5);
  });

  it("keeps its speed with no friction", () => {
    expect(step({ x: 50, y: 20, vx: 20, vy: 0 }, room, 1, { gravity: 0, bounciness: 1, friction: 0 }).body.vx).toBe(20);
  });
});

describe("velocity", () => {
  it("points right at 0 degrees and down at 90", () => {
    expect(velocity(100, 0).vx).toBeCloseTo(100);
    expect(velocity(100, 0).vy).toBeCloseTo(0);
    expect(velocity(100, 90).vx).toBeCloseTo(0);
    expect(velocity(100, 90).vy).toBeCloseTo(100);
  });

  it("treats a negative speed as 0", () => {
    expect(velocity(-100, 45)).toEqual({ vx: 0, vy: 0 });
  });
});

describe("Bounce", () => {
  const getBounce = (container: HTMLElement) => container.querySelector<HTMLElement>(".bounce")!;
  const position = (element: HTMLElement) => element.style.transform.match(/-?[\d.]+/g)!.map(Number);

  describe("rendering", () => {
    it("is a dot by default, hidden from screen readers", () => {
      const { container } = render(<Bounce />);
      expect(getBounce(container)).toHaveAttribute("aria-hidden", "true");
      expect(getBounce(container).querySelector(".bounce__dot")).toBeInTheDocument();
    });

    it("bounces what's inside it instead of the dot", () => {
      const { container } = render(<Bounce>🏀</Bounce>);
      expect(getBounce(container)).toHaveTextContent("🏀");
      expect(getBounce(container).querySelector(".bounce__dot")).not.toBeInTheDocument();
    });

    it("bounces inside its parent by default, or over the whole window", () => {
      const { container, rerender } = render(<Bounce />);
      expect(getBounce(container)).toHaveAttribute("data-bounds", "parent");
      rerender(<Bounce bounds="viewport" />);
      expect(getBounce(container)).toHaveAttribute("data-bounds", "viewport");
    });

    it("applies className next to its own class, passes other props through, and forwards the ref", () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(<Bounce ref={ref} className="z-10" data-testid="ball" />);
      expect(getBounce(container)).toHaveClass("bounce", "z-10");
      expect(getBounce(container)).toHaveAttribute("data-testid", "ball");
      expect(ref.current).toBe(getBounce(container));
    });
  });

  describe("moving", () => {
    // jsdom has no layout, so give the window a size, and run animation frames on fake timers
    const spies: { mockRestore: () => void }[] = [];
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
      spies.push(vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(200));
      spies.push(vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(100));
    });
    afterEach(() => {
      vi.useRealTimers();
      spies.splice(0).forEach((spy) => spy.mockRestore()); // not restoreAllMocks: tests/setup.ts spies on console.warn
    });

    it("starts where startX and startY put it", () => {
      const { container } = render(<Bounce bounds="viewport" startX={0.5} startY={1} />);
      expect(position(getBounce(container))).toEqual([100, 100]);
    });

    it("moves at its speed, in its direction", () => {
      const { container } = render(<Bounce bounds="viewport" speed={100} angle={0} startY={0.5} />);
      act(() => vi.advanceTimersByTime(1000));
      const [x, y] = position(getBounce(container));
      expect(x).toBeGreaterThan(90); // the first frame only sets the clock
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBe(50);
    });

    it("bounces off an edge, calling onBounce, and comes back", () => {
      const onBounce = vi.fn();
      const { container } = render(<Bounce bounds="viewport" speed={400} angle={0} startX={0.75} startY={0.5} onBounce={onBounce} />);
      act(() => vi.advanceTimersByTime(250));
      expect(onBounce).toHaveBeenCalledWith(["right"]);
      expect(position(getBounce(container))[0]).toBeLessThan(200);
    });

    it("holds still while paused, then carries on", () => {
      const { container, rerender } = render(<Bounce bounds="viewport" speed={100} angle={0} paused />);
      act(() => vi.advanceTimersByTime(500));
      expect(position(getBounce(container))).toEqual([0, 0]);
      rerender(<Bounce bounds="viewport" speed={100} angle={0} />);
      act(() => vi.advanceTimersByTime(500));
      expect(position(getBounce(container))[0]).toBeGreaterThan(40);
    });

    it("holds still with reduced motion", () => {
      const { container } = render(<Bounce bounds="viewport" speed={100} angle={0} style={{ "--experiment-decoration": "0" } as object} />);
      expect(getComputedStyle(getBounce(container)).getPropertyValue("--experiment-decoration")).toBe("0");
      act(() => vi.advanceTimersByTime(500));
      expect(position(getBounce(container))).toEqual([0, 0]);
    });

    describe("grabbing", () => {
      const point = (x: number, y: number) => ({ pointerId: 1, button: 0, clientX: x, clientY: y });

      it("isn't grabbable by default: the pointer doesn't move it", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} />);
        const ball = getBounce(container);
        expect(ball).not.toHaveAttribute("data-grabbable");
        fireEvent.pointerDown(ball, point(10, 10));
        fireEvent.pointerMove(ball, point(60, 40));
        expect(position(ball)).toEqual([0, 0]);
        expect(ball).not.toHaveAttribute("data-dragging");
      });

      it("follows the pointer while it's held, staying inside its box", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable />);
        const ball = getBounce(container);
        expect(ball).toHaveAttribute("data-grabbable");
        fireEvent.pointerDown(ball, point(10, 10));
        expect(ball).toHaveAttribute("data-dragging");
        fireEvent.pointerMove(ball, point(60, 40));
        expect(position(ball)).toEqual([50, 30]);
        fireEvent.pointerMove(ball, point(500, -50));
        expect(position(ball)).toEqual([200, 0]);
      });

      it("only drags with the main button, and only with the pointer that grabbed it", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, { ...point(10, 10), button: 2 });
        fireEvent.pointerMove(ball, point(60, 40));
        expect(position(ball)).toEqual([0, 0]);
        fireEvent.pointerDown(ball, point(10, 10));
        fireEvent.pointerMove(ball, { ...point(60, 40), pointerId: 2 });
        expect(position(ball)).toEqual([0, 0]);
      });

      it("isn't moved by the loop while it's held", () => {
        const { container } = render(<Bounce bounds="viewport" speed={100} angle={0} grabbable />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(10, 10));
        act(() => vi.advanceTimersByTime(500));
        expect(position(ball)).toEqual([0, 0]);
      });

      it("flies off at the speed it was thrown", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(0, 0));
        act(() => vi.advanceTimersByTime(50));
        fireEvent.pointerMove(ball, point(10, 0)); // 10px in 50ms: 200px per second, to the right
        fireEvent.pointerUp(ball, point(10, 0));
        expect(ball).not.toHaveAttribute("data-dragging");
        act(() => vi.advanceTimersByTime(250));
        const [x, y] = position(ball);
        expect(x).toBeGreaterThan(50);
        expect(x).toBeLessThan(70);
        expect(y).toBe(0);
      });

      it("drops where it's let go after holding still", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(0, 0));
        fireEvent.pointerMove(ball, point(40, 20));
        act(() => vi.advanceTimersByTime(300));
        fireEvent.pointerUp(ball, point(40, 20));
        act(() => vi.advanceTimersByTime(300));
        expect(position(ball)).toEqual([40, 20]);
      });

      it("drops where it's let go when it isn't throwable, however fast it was moving", () => {
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable throwable={false} />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(0, 0));
        act(() => vi.advanceTimersByTime(20));
        fireEvent.pointerMove(ball, point(40, 20));
        fireEvent.pointerUp(ball, point(40, 20));
        act(() => vi.advanceTimersByTime(300));
        expect(position(ball)).toEqual([40, 20]);
      });

      it("calls onClick when it's pressed and let go without dragging", () => {
        const onClick = vi.fn();
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable onClick={onClick} />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(10, 10));
        fireEvent.pointerMove(ball, point(13, 11)); // a little wobble is still a click
        fireEvent.pointerUp(ball, point(13, 11));
        fireEvent.click(ball);
        expect(onClick).toHaveBeenCalledOnce();
      });

      it("doesn't count letting go after a drag as a click, but counts the next click", () => {
        const onClick = vi.fn();
        const { container } = render(<Bounce bounds="viewport" speed={0} grabbable onClick={onClick} />);
        const ball = getBounce(container);
        fireEvent.pointerDown(ball, point(10, 10));
        fireEvent.pointerMove(ball, point(60, 40));
        fireEvent.pointerUp(ball, point(60, 40));
        fireEvent.click(ball);
        expect(position(ball)).toEqual([50, 30]);
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.pointerDown(ball, point(60, 40));
        fireEvent.pointerUp(ball, point(60, 40));
        fireEvent.click(ball);
        expect(onClick).toHaveBeenCalledOnce();
      });

      it("still calls pointer handlers passed in", () => {
        const onPointerDown = vi.fn();
        const { container } = render(<Bounce bounds="viewport" grabbable onPointerDown={onPointerDown} />);
        fireEvent.pointerDown(getBounce(container), point(0, 0));
        expect(onPointerDown).toHaveBeenCalledOnce();
      });
    });

    describe("interactions", () => {
      // What Magnets uses to act between movers; Bounce on its own adds none
      let leave = () => {};
      afterEach(() => leave());

      it("lets an interaction push movers, until it's removed", () => {
        leave = interact({ push: (members) => members.map(() => ({ ax: 400, ay: 0 })) });
        const { container } = render(<Bounce bounds="viewport" speed={0} />);
        act(() => vi.advanceTimersByTime(250));
        const pushedTo = position(getBounce(container))[0]!;
        expect(pushedTo).toBeGreaterThan(5);
        leave();
        act(() => vi.advanceTimersByTime(250));
        expect(position(getBounce(container))[0]).toBeGreaterThan(pushedTo); // still moving at the speed it reached
        const { container: later } = render(<Bounce bounds="viewport" speed={0} />);
        act(() => vi.advanceTimersByTime(250));
        expect(position(getBounce(later))).toEqual([0, 0]);
      });

      it("gives it the movers in each box, saying which are fixed", () => {
        const seen: Member[][] = [];
        leave = interact({ push: (members) => (seen.push(members), members.map(() => ({ ax: 0, ay: 0 }))) });
        const { container } = render(
          <>
            <Bounce bounds="viewport" speed={0} startX={0.5} />
            <Bounce bounds="viewport" speed={0} paused />
          </>,
        );
        act(() => vi.advanceTimersByTime(20));
        const [moving, paused] = container.querySelectorAll<HTMLElement>(".bounce");
        expect(seen.at(-1)!.map(({ element, x, fixed }) => ({ element, x, fixed }))).toEqual([
          { element: moving, x: 100, fixed: false },
          { element: paused, x: 0, fixed: true },
        ]);
      });

      it("lets an interaction settle where movers end up, inside their box, without moving fixed ones", () => {
        leave = interact({ settle: (members) => members.map(({ vx, vy }) => ({ x: 1000, y: 30, vx, vy })) });
        const { container } = render(
          <>
            <Bounce bounds="viewport" speed={0} />
            <Bounce bounds="viewport" speed={0} paused />
          </>,
        );
        act(() => vi.advanceTimersByTime(20));
        const [moving, paused] = container.querySelectorAll<HTMLElement>(".bounce");
        expect(position(moving!)).toEqual([200, 30]);
        expect(position(paused!)).toEqual([0, 0]);
      });
    });

    it("stops the animation loop when the last one goes", () => {
      const { unmount } = render(<Bounce bounds="viewport" />);
      expect(vi.getTimerCount()).toBe(1);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it("types: children and every setting are optional", () => {
    expectTypeOf<{}>().toExtend<BounceProps>();
    expectTypeOf<BounceProps["bounds"]>().toEqualTypeOf<"parent" | "viewport" | undefined>();
  });
});
