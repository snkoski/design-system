import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Spin } from "@/experiments/Spin/Spin";
import type { SpinProps } from "@/experiments/Spin/Spin";

const getSpin = (name = "Spin") => screen.getByRole("button", { name });
const angleOf = (element: HTMLElement) => element.style.getPropertyValue("--spin-angle");

describe("Spin", () => {
  describe("rendering", () => {
    it("is a button named Spin, with the content hidden from screen readers", () => {
      render(<Spin>🌭</Spin>);
      const content = getSpin().querySelector(".spin__content");
      expect(content).toHaveTextContent("🌭");
      expect(content).toHaveAttribute("aria-hidden", "true");
      expect(getSpin()).toHaveAttribute("type", "button");
    });

    it("can be named with label", () => {
      render(<Spin label="Spin the hot dog">🌭</Spin>);
      expect(getSpin("Spin the hot dog")).toBeInTheDocument();
    });

    it("starts upright, and still", () => {
      render(<Spin>🌭</Spin>);
      expect(angleOf(getSpin())).toBe("0deg");
    });

    it("applies className next to its own class, and passes other props through", () => {
      render(
        <Spin className="size-12" data-testid="spinner">
          🌭
        </Spin>,
      );
      expect(getSpin()).toHaveClass("spin", "size-12");
      expect(screen.getByTestId("spinner")).toBe(getSpin());
    });

    it("forwards ref to the button", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Spin ref={ref}>🌭</Spin>);
      expect(ref.current).toBe(getSpin());
    });
  });

  describe("spinning", () => {
    it("spins speed × duration turns on a click: 2 turns a second for a second is 2 turns", async () => {
      const user = userEvent.setup();
      render(<Spin>🌭</Spin>);
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("720deg");
      expect(getSpin().style.getPropertyValue("--spin-duration")).toBe("1000ms");
    });

    it("uses the speed and duration it's given", async () => {
      const user = userEvent.setup();
      render(
        <Spin speed={3} duration={2000}>
          🌭
        </Spin>,
      );
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe(`${6 * 360}deg`);
      expect(getSpin().style.getPropertyValue("--spin-duration")).toBe("2000ms");
    });

    it("adds more spin when clicked again, from where it was heading", async () => {
      const user = userEvent.setup();
      render(<Spin>🌭</Spin>);
      await user.click(getSpin());
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("1440deg");
    });

    it("spins the other way with direction counterclockwise", async () => {
      const user = userEvent.setup();
      render(<Spin direction="counterclockwise">🌭</Spin>);
      expect(getSpin()).toHaveAttribute("data-direction", "counterclockwise");
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("-720deg");
    });

    it("lands upright by default, rounding up to whole turns, in either direction", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Spin speed={1.5} duration={1000}>
          🌭
        </Spin>,
      );
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("720deg");
      rerender(
        <Spin speed={1.5} duration={1000} direction="counterclockwise">
          🌭
        </Spin>,
      );
      await user.click(getSpin());
      // From 720, back 1.5 turns (540) reaches 180; the next upright angle that way is 0
      expect(angleOf(getSpin())).toBe("0deg");
    });

    it("stops wherever the spin ends with upright off", async () => {
      const user = userEvent.setup();
      render(
        <Spin speed={1.5} duration={1000} upright={false}>
          🌭
        </Spin>,
      );
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("540deg");
    });

    it("sets the easing when it's given, and leaves the default otherwise", () => {
      const { rerender } = render(<Spin>🌭</Spin>);
      expect(getSpin().style.getPropertyValue("--spin-ease")).toBe("");
      rerender(<Spin easing="linear">🌭</Spin>);
      expect(getSpin().style.getPropertyValue("--spin-ease")).toBe("linear");
    });

    it("treats a negative speed or duration as none", async () => {
      const user = userEvent.setup();
      render(
        <Spin speed={-2} duration={-500}>
          🌭
        </Spin>,
      );
      await user.click(getSpin());
      expect(angleOf(getSpin())).toBe("0deg");
      expect(getSpin().style.getPropertyValue("--spin-duration")).toBe("0ms");
    });

    it("spins with Space and Enter, like any button", async () => {
      const user = userEvent.setup();
      render(<Spin>🌭</Spin>);
      await user.tab();
      expect(getSpin()).toHaveFocus();
      await user.keyboard(" ");
      expect(angleOf(getSpin())).toBe("720deg");
      await user.keyboard("{Enter}");
      expect(angleOf(getSpin())).toBe("1440deg");
    });

    it("still calls the consumer's onClick", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Spin onClick={onClick}>🌭</Spin>);
      await user.click(getSpin());
      expect(onClick).toHaveBeenCalledOnce();
      expect(angleOf(getSpin())).toBe("720deg");
    });

    it("spins each one on its own", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Spin label="First">🌭</Spin>
          <Spin label="Second">🦄</Spin>
        </>,
      );
      await user.click(getSpin("Second"));
      expect(angleOf(getSpin("First"))).toBe("0deg");
      expect(angleOf(getSpin("Second"))).toBe("720deg");
    });
  });

  describe("types", () => {
    it("takes numbers for speed and duration, and a direction", () => {
      expectTypeOf<SpinProps["speed"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<SpinProps["duration"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<SpinProps["direction"]>().toEqualTypeOf<"clockwise" | "counterclockwise" | undefined>();
    });

    it("requires content to spin", () => {
      expectTypeOf<object>().not.toExtend<SpinProps>();
    });
  });
});
