import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Proximity } from "./Proximity";
import type { ProximityProps } from "./Proximity";
import { closeness, colorAt, forgetPointer } from "./tracker";

afterEach(forgetPointer);

/** jsdom has no layout, so place an element by hand: a 40px square from (100, 100) to (140, 140) */
function place(element: Element) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40, x: 100, y: 100,
    toJSON: () => ({}),
  } as DOMRect);
}

function movePointer(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
  });
}

const proximityOf = (element: HTMLElement) => element.style.getPropertyValue("--proximity");
const colorOf = (element: HTMLElement) => element.style.getPropertyValue("--proximity-color");

function renderPlaced(props: Partial<ProximityProps> = {}) {
  const view = render(
    <Proximity data-testid="near" {...props}>
      <span>Dot</span>
    </Proximity>,
  );
  const element = screen.getByTestId("near");
  place(element);
  return { ...view, element };
}

describe("closeness", () => {
  const box = { left: 100, top: 100, right: 140, bottom: 140 };

  it("is 1 over the element and on its edge", () => {
    expect(closeness(box, { x: 120, y: 120 }, 200)).toBe(1);
    expect(closeness(box, { x: 140, y: 120 }, 200)).toBe(1);
  });

  it("falls off in a straight line from the nearest edge, to 0 at the reach and beyond", () => {
    expect(closeness(box, { x: 190, y: 120 }, 200)).toBeCloseTo(0.75); // 50px right of the right edge
    expect(closeness(box, { x: 120, y: 0 }, 200)).toBeCloseTo(0.5); // 100px above the top
    expect(closeness(box, { x: 340, y: 120 }, 200)).toBe(0);
    expect(closeness(box, { x: 900, y: 900 }, 200)).toBe(0);
  });

  it("measures from a corner diagonally", () => {
    expect(closeness(box, { x: 170, y: 180 }, 100)).toBeCloseTo(0.5); // 30 across and 40 down: 50px away
  });

  it("only counts over the element when the reach is 0", () => {
    expect(closeness(box, { x: 120, y: 120 }, 0)).toBe(1);
    expect(closeness(box, { x: 141, y: 120 }, 0)).toBe(0);
  });
});

describe("colorAt", () => {
  it("mixes from the first color to the last", () => {
    expect(colorAt(["blue", "red"], 0, "srgb")).toBe("color-mix(in srgb, blue, red 0%)");
    expect(colorAt(["blue", "red"], 0.25, "srgb")).toBe("color-mix(in srgb, blue, red 25%)");
    expect(colorAt(["blue", "red"], 1, "srgb")).toBe("color-mix(in srgb, blue, red 100%)");
  });

  it("passes through each color in between, at even steps", () => {
    const stops = ["blue", "green", "red"];
    expect(colorAt(stops, 0.25, "srgb")).toBe("color-mix(in srgb, blue, green 50%)");
    expect(colorAt(stops, 0.5, "srgb")).toBe("color-mix(in srgb, green, red 0%)");
    expect(colorAt(stops, 0.75, "srgb")).toBe("color-mix(in srgb, green, red 50%)");
    expect(colorAt(stops, 1, "srgb")).toBe("color-mix(in srgb, green, red 100%)");
  });

  it("mixes in the color space it's given", () => {
    expect(colorAt(["blue", "red"], 0.5, "oklch")).toBe("color-mix(in oklch, blue, red 50%)");
    expect(colorAt(["blue", "red"], 0.5, "hsl")).toBe("color-mix(in hsl, blue, red 50%)");
  });

  it("keeps the amount between 0 and 1", () => {
    expect(colorAt(["blue", "red"], 2, "srgb")).toBe("color-mix(in srgb, blue, red 100%)");
    expect(colorAt(["blue", "red"], -1, "srgb")).toBe("color-mix(in srgb, blue, red 0%)");
  });

  it("is null with fewer than two colors", () => {
    expect(colorAt([], 0.5, "srgb")).toBeNull();
    expect(colorAt(["blue"], 0.5, "srgb")).toBeNull();
  });
});

describe("Proximity", () => {
  describe("rendering", () => {
    it("wraps its content, which stays readable by screen readers", () => {
      const { element } = renderPlaced();
      expect(element).toHaveClass("proximity");
      expect(element).toHaveTextContent("Dot");
      expect(element).not.toHaveAttribute("aria-hidden");
    });

    it("has no fade and no colors by default", () => {
      const { element } = renderPlaced();
      expect(element).not.toHaveAttribute("data-fade");
      expect(element).not.toHaveAttribute("data-colored");
      movePointer(120, 120);
      expect(proximityOf(element)).toBe("1");
      expect(colorOf(element)).toBe("");
    });

    it("says which way it fades, and how faint it gets, kept between 0 and 1", () => {
      const { element, rerender } = renderPlaced({ fade: "out", faintest: 0.2 });
      expect(element).toHaveAttribute("data-fade", "out");
      expect(element.style.getPropertyValue("--proximity-faintest")).toBe("0.2");
      rerender(
        <Proximity data-testid="near" fade="in" faintest={3}>
          <span>Dot</span>
        </Proximity>,
      );
      expect(element).toHaveAttribute("data-fade", "in");
      expect(element.style.getPropertyValue("--proximity-faintest")).toBe("1");
    });

    it("passes other props through, merges className and style, and forwards the ref", () => {
      const ref = createRef<HTMLSpanElement>();
      const { element } = renderPlaced({ ref, className: "size-12", title: "Near", style: { margin: "1rem" } });
      expect(element).toHaveClass("proximity", "size-12");
      expect(element).toHaveAttribute("title", "Near");
      expect(element.style.margin).toBe("1rem");
      expect(ref.current).toBe(element);
    });
  });

  describe("following the pointer", () => {
    it("starts at 0, before the pointer has moved", () => {
      const { element } = renderPlaced();
      expect(proximityOf(element)).toBe("0");
    });

    it("rises as the pointer comes near, by its reach", () => {
      const { element } = renderPlaced({ reach: 100 });
      movePointer(300, 120);
      expect(proximityOf(element)).toBe("0");
      movePointer(190, 120);
      expect(proximityOf(element)).toBe("0.5");
      movePointer(120, 120);
      expect(proximityOf(element)).toBe("1");
    });

    it("goes back to 0 when the pointer leaves the window", () => {
      const { element } = renderPlaced();
      movePointer(120, 120);
      expect(proximityOf(element)).toBe("1");
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerout", { relatedTarget: null }));
      });
      expect(proximityOf(element)).toBe("0");
    });

    it("stays put when the pointer only moves from one element to another", () => {
      const { element } = renderPlaced();
      movePointer(120, 120);
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerout", { relatedTarget: document.body }));
      });
      expect(proximityOf(element)).toBe("1");
    });

    it("follows a change of reach straight away", () => {
      const { element, rerender } = renderPlaced({ reach: 100 });
      movePointer(190, 120);
      expect(proximityOf(element)).toBe("0.5");
      rerender(
        <Proximity data-testid="near" reach={200}>
          <span>Dot</span>
        </Proximity>,
      );
      expect(proximityOf(element)).toBe("0.75");
    });

    it("updates every one on the page from the one pointer", () => {
      render(
        <>
          <Proximity data-testid="a" reach={100} />
          <Proximity data-testid="b" reach={100} />
        </>,
      );
      const [a, b] = [screen.getByTestId("a"), screen.getByTestId("b")];
      place(a);
      vi.spyOn(b, "getBoundingClientRect").mockReturnValue({ left: 300, top: 100, right: 340, bottom: 140, width: 40, height: 40, x: 300, y: 100, toJSON: () => ({}) } as DOMRect);
      movePointer(120, 120);
      expect(proximityOf(a)).toBe("1");
      expect(proximityOf(b)).toBe("0");
    });
  });

  describe("colors", () => {
    it("goes from the first color to the last as the pointer comes near", () => {
      const { element } = renderPlaced({ colors: ["blue", "red"], reach: 100 });
      expect(element).toHaveAttribute("data-colored");
      movePointer(300, 120);
      expect(colorOf(element)).toBe("color-mix(in srgb, blue, red 0%)");
      movePointer(190, 120);
      expect(colorOf(element)).toBe("color-mix(in srgb, blue, red 50%)");
      movePointer(120, 120);
      expect(colorOf(element)).toBe("color-mix(in srgb, blue, red 100%)");
    });

    it("mixes in the color space it's given, and follows a change of it", () => {
      const { element, rerender } = renderPlaced({ colors: ["blue", "red"], colorSpace: "oklch" });
      movePointer(120, 120);
      expect(colorOf(element)).toBe("color-mix(in oklch, blue, red 100%)");
      rerender(
        <Proximity data-testid="near" colors={["blue", "red"]} colorSpace="hsl">
          <span>Dot</span>
        </Proximity>,
      );
      expect(colorOf(element)).toBe("color-mix(in hsl, blue, red 100%)");
    });

    it("follows a change of colors, and keeps its own color with fewer than two", () => {
      const { element, rerender } = renderPlaced({ colors: ["blue", "red"] });
      movePointer(120, 120);
      rerender(
        <Proximity data-testid="near" colors={["green", "red"]}>
          <span>Dot</span>
        </Proximity>,
      );
      expect(colorOf(element)).toBe("color-mix(in srgb, green, red 100%)");
      rerender(
        <Proximity data-testid="near" colors={["green"]}>
          <span>Dot</span>
        </Proximity>,
      );
      expect(element).not.toHaveAttribute("data-colored");
      expect(colorOf(element)).toBe("");
    });
  });

  describe("keyboard focus", () => {
    it("counts focus inside as the pointer right over it, and lets go when focus leaves", () => {
      render(
        <>
          <Proximity data-testid="near" colors={["blue", "red"]}>
            <button type="button">Inside</button>
          </Proximity>
          <button type="button">Outside</button>
        </>,
      );
      const element = screen.getByTestId("near");
      place(element);
      expect(proximityOf(element)).toBe("0");
      act(() => screen.getByRole("button", { name: "Inside" }).focus());
      expect(proximityOf(element)).toBe("1");
      expect(colorOf(element)).toBe("color-mix(in srgb, blue, red 100%)");
      act(() => screen.getByRole("button", { name: "Outside" }).focus());
      expect(proximityOf(element)).toBe("0");
    });
  });

  it("stops listening once it's gone", () => {
    const { element, unmount } = renderPlaced();
    unmount();
    movePointer(120, 120);
    expect(proximityOf(element)).toBe("0");
  });

  it("types: fade is in or out, and colorSpace one of three", () => {
    expectTypeOf<ProximityProps["fade"]>().toEqualTypeOf<"in" | "out" | undefined>();
    expectTypeOf<ProximityProps["colorSpace"]>().toEqualTypeOf<"srgb" | "oklch" | "hsl" | undefined>();
    expectTypeOf<ProximityProps["colors"]>().toEqualTypeOf<string[] | undefined>();
  });
});
