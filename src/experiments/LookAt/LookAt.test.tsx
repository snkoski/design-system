import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { LookAt } from "./LookAt";
import type { LookAtProps } from "./LookAt";
import { forgetPointer } from "./tracker";

afterEach(forgetPointer);

/** jsdom has no layout, so place an element by hand: a 40px square with its center at (x, y) */
function place(element: Element, x: number, y: number) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: x - 20, top: y - 20, right: x + 20, bottom: y + 20, width: 40, height: 40, x: x - 20, y: y - 20,
    toJSON: () => ({}),
  } as DOMRect);
}

function movePointer(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
  });
}

const angleOf = (element: Element) => (element as HTMLElement).style.getPropertyValue("--look-angle");
/** Which way it faces, from 0 (up) to 359 degrees: -90deg and 270deg both face left */
const facing = (element: Element) => ((parseFloat(angleOf(element)) % 360) + 360) % 360;

function renderAt(x: number, y: number, props: Partial<LookAtProps> = {}) {
  const view = render(
    <LookAt data-testid="look" {...props}>
      <svg />
    </LookAt>,
  );
  const element = screen.getByTestId("look");
  place(element, x, y);
  return { ...view, element };
}

describe("LookAt", () => {
  describe("rendering", () => {
    it("wraps the content in the part that turns", () => {
      const { container } = render(
        <LookAt>
          <svg data-testid="arrow" />
        </LookAt>,
      );
      const pointer = container.querySelector(".look-at > .look-at__pointer");
      expect(pointer).toBeInTheDocument();
      expect(pointer).toContainElement(screen.getByTestId("arrow"));
    });

    it("is hidden from screen readers, because the turning is decoration", () => {
      const { container } = render(
        <LookAt>
          <svg />
        </LookAt>,
      );
      expect(container.firstElementChild).toHaveClass("look-at");
      expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    });

    it("faces toward the mouse by default, as data-direction", () => {
      const { element } = renderAt(100, 100);
      expect(element).toHaveAttribute("data-direction", "toward");
    });

    it("maps direction to data-direction", () => {
      const { element } = renderAt(100, 100, { direction: "away" });
      expect(element).toHaveAttribute("data-direction", "away");
    });

    it("applies className to the outer element, next to its own class", () => {
      const { element } = renderAt(100, 100, { className: "size-10" });
      expect(element).toHaveClass("look-at", "size-10");
    });

    it("forwards ref to the outer element", () => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <LookAt ref={ref} data-testid="look">
          <svg />
        </LookAt>,
      );
      expect(ref.current).toBe(screen.getByTestId("look"));
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <LookAt direction="away">
          <svg />
        </LookAt>,
      );
      expect(container.querySelector(".look-at__pointer")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/look-at--/);
    });
  });

  describe("aiming", () => {
    it("doesn't turn before the mouse has moved", () => {
      const { element } = renderAt(100, 100);
      expect(element).toHaveClass("look-at");
      expect(angleOf(element)).toBe("");
    });

    it("turns content drawn pointing up to face the mouse on every side", () => {
      const { element } = renderAt(100, 100);
      movePointer(100, 0); // above
      expect(angleOf(element)).toBe("0deg");
      movePointer(200, 100); // right
      expect(angleOf(element)).toBe("90deg");
      movePointer(100, 200); // below
      expect(angleOf(element)).toBe("180deg");
      movePointer(0, 100); // left: the short way from below, so 270, not -90
      expect(angleOf(element)).toBe("270deg");
    });

    it("faces away from the mouse with direction away", () => {
      const { element } = renderAt(100, 100, { direction: "away" });
      movePointer(200, 100); // right of it, so it points left
      expect(facing(element)).toBe(270);
    });

    it("turns the short way round when the mouse crosses behind it", () => {
      const { element } = renderAt(100, 100);
      movePointer(0, 99); // just above the left: almost -90
      const before = parseFloat(angleOf(element));
      movePointer(0, 101); // just below the left
      const after = parseFloat(angleOf(element));
      expect(Math.abs(after - before)).toBeLessThan(5);
    });

    it("keeps facing the same way when the mouse is exactly on its center", () => {
      const { element } = renderAt(100, 100);
      movePointer(200, 100);
      movePointer(100, 100);
      expect(angleOf(element)).toBe("90deg");
    });

    it("faces the last known mouse position as soon as it appears", () => {
      const first = renderAt(100, 100);
      movePointer(300, 100);
      expect(angleOf(first.element)).toBe("90deg");
      const later = render(
        <LookAt data-testid="later">
          <svg />
        </LookAt>,
      );
      const element = later.getByTestId("later");
      place(element, 300, 300);
      movePointer(300, 100); // the pointer was already at (300, 100); a new move confirms the first aim came from it
      expect(angleOf(element)).toBe("0deg");
    });

    it("turns again when direction changes, from where it was", () => {
      const { element, rerender } = renderAt(100, 100);
      movePointer(200, 100);
      expect(angleOf(element)).toBe("90deg");
      rerender(
        <LookAt data-testid="look" direction="away">
          <svg />
        </LookAt>,
      );
      expect(element).toHaveAttribute("data-direction", "away");
      expect(Math.abs(parseFloat(angleOf(element)) - 90)).toBe(180);
    });

    it("re-aims when the page scrolls under a still mouse", () => {
      const { element } = renderAt(100, 100);
      movePointer(200, 100);
      expect(angleOf(element)).toBe("90deg");
      place(element, 300, 100); // scrolling moved it to the right of the mouse
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(facing(element)).toBe(270);
    });
  });

  describe("in a grid", () => {
    it("points each one its own way: with the mouse between two, they face each other", () => {
      render(
        <>
          <LookAt data-testid="left">
            <svg />
          </LookAt>
          <LookAt data-testid="right">
            <svg />
          </LookAt>
        </>,
      );
      place(screen.getByTestId("left"), 100, 100);
      place(screen.getByTestId("right"), 300, 100);
      movePointer(200, 100);
      expect(facing(screen.getByTestId("left"))).toBe(90);
      expect(facing(screen.getByTestId("right"))).toBe(270);
    });

    it("points all four corners of a grid in toward a mouse in the middle", () => {
      const corners = [
        ["top-left", 0, 0, 135],
        ["top-right", 200, 0, 225],
        ["bottom-left", 0, 200, 45],
        ["bottom-right", 200, 200, 315],
      ] as const;
      render(
        <>
          {corners.map(([name]) => (
            <LookAt key={name} data-testid={name}>
              <svg />
            </LookAt>
          ))}
        </>,
      );
      for (const [name, x, y] of corners) place(screen.getByTestId(name), x, y);
      movePointer(100, 100);
      for (const [name, , , angle] of corners) expect(facing(screen.getByTestId(name)), name).toBe(angle);
    });

    it("shares one pointer listener between every LookAt, and removes it when the last one goes", () => {
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const { unmount } = render(
        <>
          {Array.from({ length: 50 }, (_, index) => (
            <LookAt key={index}>
              <svg />
            </LookAt>
          ))}
        </>,
      );
      expect(add.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(1);
      expect(remove.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(0);
      unmount();
      expect(remove.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(1);
    });

    it("stops aiming a LookAt once it's removed, while the others carry on", () => {
      const { rerender } = render(
        <>
          <LookAt data-testid="stays">
            <svg />
          </LookAt>
          <LookAt data-testid="goes">
            <svg />
          </LookAt>
        </>,
      );
      const goes = screen.getByTestId("goes");
      place(screen.getByTestId("stays"), 100, 100);
      place(goes, 300, 100);
      rerender(
        <LookAt data-testid="stays">
          <svg />
        </LookAt>,
      );
      movePointer(200, 100);
      expect(angleOf(screen.getByTestId("stays"))).toBe("90deg");
      expect(angleOf(goes)).toBe("");
    });
  });

  describe("types", () => {
    it("takes toward or away", () => {
      expectTypeOf<LookAtProps["direction"]>().toEqualTypeOf<"toward" | "away" | undefined>();
    });

    it("requires content to turn", () => {
      expectTypeOf<object>().not.toExtend<LookAtProps>();
      expectTypeOf<{ children: string }>().toExtend<LookAtProps>();
    });

    it("takes className as a string", () => {
      expectTypeOf<LookAtProps["className"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
