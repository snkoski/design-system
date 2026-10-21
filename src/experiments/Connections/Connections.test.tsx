import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Connections } from "./Connections";
import type { ConnectionsProps } from "./Connections";
import { gap, lines, toPixels } from "./lines";

const scale = { width: 1000, height: 500, rem: 16 };
const box = (left: number, top: number, size = 10) => ({ left, top, width: size, height: size });

describe("toPixels", () => {
  it.each([
    [120, 120],
    ["120px", 120],
    ["10vw", 100],
    ["10vh", 50],
    ["10vmin", 50],
    ["10vmax", 100],
    ["2rem", 32],
    ["2.5vw", 25],
    ["120" as never, 120],
  ] as const)("reads %s as %spx", (distance, px) => {
    expect(toPixels(distance, scale)).toBe(px);
  });

  it("treats negative and unreadable distances as 0", () => {
    expect(toPixels(-5, scale)).toBe(0);
    expect(toPixels("-5vw", scale)).toBe(0);
    expect(toPixels("lots" as never, scale)).toBe(0);
  });
});

describe("gap", () => {
  it("measures between the nearest edges", () => {
    expect(gap(box(0, 0), box(30, 0))).toBe(20);
    expect(gap(box(0, 0), box(0, 25))).toBe(15);
    expect(gap(box(0, 0), box(13, 14))).toBe(5); // a 3, 4, 5 triangle between the corners
  });

  it("is 0 when they touch or overlap", () => {
    expect(gap(box(0, 0), box(10, 0))).toBe(0);
    expect(gap(box(0, 0), box(5, 5))).toBe(0);
  });
});

describe("lines", () => {
  it("joins the centers of boxes closer than the distance, and not ones further away", () => {
    const found = lines([box(0, 0), box(30, 0), box(300, 0)], 50);
    expect(found).toEqual([{ from: { x: 5, y: 5 }, to: { x: 35, y: 5 }, strength: 0.6 }]);
  });

  it("joins every close pair", () => {
    expect(lines([box(0, 0), box(20, 0), box(0, 20)], 50)).toHaveLength(3);
  });

  it("is strongest when they touch, and draws nothing at exactly the distance", () => {
    expect(lines([box(0, 0), box(10, 0)], 50)[0]!.strength).toBe(1);
    expect(lines([box(0, 0), box(60, 0)], 50)).toEqual([]);
  });

  it("draws nothing with no distance", () => {
    expect(lines([box(0, 0), box(10, 0)], 0)).toEqual([]);
  });
});

describe("Connections", () => {
  /** A canvas context that records the lines drawn on it */
  function fakeContext() {
    const drawn: { from: number[]; to: number[]; alpha: number }[] = [];
    let from: number[] = [];
    let to: number[] = [];
    const context = {
      globalAlpha: 1,
      setTransform: vi.fn(),
      clearRect: vi.fn(() => drawn.splice(0)),
      beginPath: vi.fn(),
      moveTo: vi.fn((x: number, y: number) => (from = [x, y])),
      lineTo: vi.fn((x: number, y: number) => (to = [x, y])),
      stroke: vi.fn(() => drawn.push({ from, to, alpha: context.globalAlpha })),
    };
    return { context, drawn };
  }

  let drawn: ReturnType<typeof fakeContext>["drawn"];
  const spies: { mockRestore: () => void }[] = [];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    const fake = fakeContext();
    drawn = fake.drawn;
    // jsdom has no canvas drawing and no layout
    spies.push(vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fake.context as never));
  });
  afterEach(() => {
    vi.useRealTimers();
    spies.splice(0).forEach((spy) => spy.mockRestore()); // not restoreAllMocks: tests/setup.ts spies on console.warn
  });

  /** Puts each `.bounce` inside at a left position, 10px square */
  function place(container: HTMLElement, lefts: number[]) {
    container.querySelectorAll<HTMLElement>(".bounce").forEach((element, index) => {
      spies.push(vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left: lefts[index]!, top: 0, width: 10, height: 10 } as DOMRect));
    });
  }

  const three = (
    <>
      <span className="bounce" />
      <span className="bounce" />
      <span className="bounce" />
    </>
  );

  it("is a box with a canvas behind its children, hidden from screen readers", () => {
    const { container } = render(<Connections>{three}</Connections>);
    const root = container.querySelector(".connections")!;
    expect(root.firstElementChild).toHaveClass("connections__lines");
    expect(root.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelectorAll(".bounce")).toHaveLength(3);
  });

  it("draws a line between the things that are close, and none to the one far away", () => {
    const { container } = render(<Connections distance={50}>{three}</Connections>);
    place(container, [0, 30, 500]);
    act(() => vi.advanceTimersByTime(20));
    expect(drawn).toEqual([{ from: [5, 5], to: [35, 5], alpha: 0.6 }]);
  });

  it("follows them as they move", () => {
    const { container } = render(<Connections distance={50}>{three}</Connections>);
    place(container, [0, 30, 500]);
    act(() => vi.advanceTimersByTime(20));
    spies.splice(-3).forEach((spy) => spy.mockRestore());
    place(container, [0, 300, 330]);
    act(() => vi.advanceTimersByTime(20));
    expect(drawn).toEqual([{ from: [305, 5], to: [335, 5], alpha: 0.6 }]);
  });

  it("measures window-relative distances against the window", () => {
    vi.stubGlobal("innerWidth", 1000);
    const { container } = render(<Connections distance="5vw">{three}</Connections>);
    place(container, [0, 30, 500]);
    act(() => vi.advanceTimersByTime(20));
    expect(drawn).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it("draws lines at full strength without fade", () => {
    const { container } = render(
      <Connections distance={50} fade={false}>
        {three}
      </Connections>,
    );
    place(container, [0, 30, 500]);
    act(() => vi.advanceTimersByTime(20));
    expect(drawn).toEqual([{ from: [5, 5], to: [35, 5], alpha: 1 }]);
  });

  it("connects whatever the selector finds", () => {
    const { container } = render(
      <Connections distance={50} selector="[data-dot]">
        <span data-dot className="bounce" />
        <span data-dot className="bounce" />
        <span className="bounce" />
      </Connections>,
    );
    place(container, [0, 30, 40]);
    act(() => vi.advanceTimersByTime(20));
    expect(drawn).toEqual([{ from: [5, 5], to: [35, 5], alpha: 0.6 }]);
  });

  it("sets the line color", () => {
    const { container } = render(<Connections color="red" />);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--connections-color")).toBe("red");
  });

  it("applies className next to its own class, passes other props through, and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Connections ref={ref} className="h-96" data-testid="sky" />);
    expect(container.firstElementChild).toHaveClass("connections", "h-96");
    expect(container.firstElementChild).toHaveAttribute("data-testid", "sky");
    expect(ref.current).toBe(container.firstElementChild);
  });

  it("stops drawing when it goes", () => {
    const { unmount } = render(<Connections />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("types: distance takes px or a length with a unit", () => {
    expectTypeOf<"15vw">().toExtend<NonNullable<ConnectionsProps["distance"]>>();
    expectTypeOf<120>().toExtend<NonNullable<ConnectionsProps["distance"]>>();
    expectTypeOf<"15 percent">().not.toExtend<NonNullable<ConnectionsProps["distance"]>>();
  });
});
