import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Meter } from "@/components/Meter/Meter";
import type { MeterProps } from "@/components/Meter/Meter";

const label = "Topics done";

/** The outer element: the one that takes className, ref, and other props. */
function outer(container: HTMLElement) {
  const element = container.firstElementChild as HTMLElement | null;
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass("meter");
  return element!;
}

/** The fill, and the position it's drawn at (0 to 100), read from the custom property the CSS uses. */
function fill(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>(".meter__fill");
  expect(element).toBeInTheDocument();
  return Number(element!.style.getPropertyValue("--bar-value"));
}

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

describe("Meter", () => {
  describe("rendering", () => {
    it("renders a meter named by its visible label", () => {
      const { container } = render(<Meter label={label} value={12} max={20} />);
      const meter = screen.getByRole("meter", { name: label });
      expect(meter).toBeInTheDocument();
      const visible = container.querySelector(".meter__label");
      expect(visible).toHaveClass("bar__label");
      expect(visible).toHaveTextContent(label);
      expect(visible).toBeVisible();
    });

    it("puts the shared bar classes next to its own on every part", () => {
      const { container } = render(<Meter label={label} value={12} max={20} description="Keep going." />);
      expect(outer(container)).toHaveClass("bar", "meter");
      expect(screen.getByRole("meter")).toHaveClass("bar__bar", "meter__bar");
      expect(container.querySelector(".meter__value")).toHaveClass("bar__value");
      expect(container.querySelector(".meter__track")).toHaveClass("bar__track");
      expect(container.querySelector(".meter__fill")).toHaveClass("bar__fill");
      expect(container.querySelector(".meter__description")).toHaveClass("bar__description");
    });

    it("sets the value, min, and max for screen readers", () => {
      render(<Meter label={label} value={12} min={2} max={20} />);
      const meter = screen.getByRole("meter");
      expect(meter).toHaveAttribute("aria-valuenow", "12");
      expect(meter).toHaveAttribute("aria-valuemin", "2");
      expect(meter).toHaveAttribute("aria-valuemax", "20");
    });

    it("defaults to a range of 0 to 100", () => {
      render(<Meter label={label} value={60} />);
      const meter = screen.getByRole("meter");
      expect(meter).toHaveAttribute("aria-valuemin", "0");
      expect(meter).toHaveAttribute("aria-valuemax", "100");
    });

    it("shows the value as a percent by default, and announces the same words", () => {
      const { container } = render(<Meter label={label} value={12} max={20} />);
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^60%$/);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "60%");
    });

    it("shows and announces valueText instead of the percent", () => {
      const { container } = render(<Meter label={label} value={12} max={20} valueText="12 of 20" />);
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^12 of 20$/);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "12 of 20");
    });

    it("treats an empty valueText as not given", () => {
      const { container } = render(<Meter label={label} value={12} max={20} valueText="" />);
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^60%$/);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "60%");
    });

    it("hides the shown value from screen readers, which hear it as the meter's value instead", () => {
      const { container } = render(<Meter label={label} value={12} max={20} valueText="12 of 20" />);
      const value = container.querySelector(".meter__value");
      expect(value).toHaveTextContent("12 of 20");
      expect(value).toHaveAttribute("aria-hidden", "true");
    });

    it("draws the fill at the value's place in the range", () => {
      const { container } = render(<Meter label={label} value={12} max={20} />);
      expect(fill(container)).toBe(60);
    });

    it("clamps a value above the range to the maximum", () => {
      const { container } = render(<Meter label={label} value={25} max={20} />);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "20");
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^100%$/);
      expect(fill(container)).toBe(100);
    });

    it("clamps a value below the range to the minimum", () => {
      const { container } = render(<Meter label={label} value={-5} max={20} />);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^0%$/);
      expect(fill(container)).toBe(0);
    });

    it("draws an empty fill when the range is empty", () => {
      const { container } = render(<Meter label={label} value={5} min={10} max={10} />);
      expect(screen.getByRole("meter")).toBeInTheDocument();
      expect(fill(container)).toBe(0);
      expect(container.querySelector(".meter__value")).toHaveTextContent(/^0%$/);
    });

    it("defaults to the neutral tone and the md size", () => {
      const { container } = render(<Meter label={label} value={12} max={20} />);
      expect(outer(container)).toHaveAttribute("data-tone", "neutral");
      expect(outer(container)).toHaveAttribute("data-size", "md");
    });

    it.each(["neutral", "success", "warning", "danger"] as const)("sets data-tone for the %s tone", (tone) => {
      const { container } = render(<Meter label={label} value={12} max={20} tone={tone} />);
      expect(outer(container)).toHaveAttribute("data-tone", tone);
    });

    it.each(["sm", "md"] as const)("sets data-size for the %s size", (size) => {
      const { container } = render(<Meter label={label} value={12} max={20} size={size} />);
      expect(outer(container)).toHaveAttribute("data-size", size);
    });

    it("never uses modifier classes", () => {
      const { container } = render(<Meter label={label} value={12} max={20} tone="warning" size="sm" />);
      const classes = [...container.querySelectorAll("*")].flatMap((element) => [...element.classList]);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes.filter((name) => name.includes("--"))).toEqual([]);
    });

    it("takes no focus", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Meter label={label} value={12} max={20} description="Keep going." />
          <button type="button">After</button>
        </>,
      );
      expect(screen.getByRole("meter")).not.toHaveAttribute("tabindex");
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });
  });

  describe("description", () => {
    it("describes the meter, from outside it", () => {
      const { container } = render(
        <Meter label="Storage used" value={4.6} max={5} valueText="4.6 of 5 GB" tone="warning" description="Almost full. Delete old files to make room." />,
      );
      const meter = screen.getByRole("meter", { name: "Storage used" });
      expect(meter).toHaveAccessibleDescription("Almost full. Delete old files to make room.");
      const description = container.querySelector(".meter__description");
      expect(description?.tagName).toBe("P");
      expect(description).toBeVisible();
      // A meter's children are presentational in ARIA, so the description sits beside it, not inside
      expect(meter).not.toContainElement(description as HTMLElement);
      expect(outer(container)).toContainElement(description as HTMLElement);
    });

    it("renders no description and no link to one when it isn't given", () => {
      const { container } = render(<Meter label={label} value={12} max={20} />);
      expect(screen.getByRole("meter")).not.toHaveAttribute("aria-describedby");
      expect(container.querySelector(".meter__description")).not.toBeInTheDocument();
    });
  });

  describe("server rendering", () => {
    it("sends the name and the value in the server HTML, before JavaScript runs", () => {
      const host = serverHtml(<Meter label={label} value={12} max={20} valueText="12 of 20" description="Keep going." />);
      const meter = host.querySelector('[role="meter"]');
      expect(meter).toBeInTheDocument();
      expect(meter).toHaveAccessibleName(label);
      expect(meter).toHaveAccessibleDescription("Keep going.");
      expect(meter).toHaveAttribute("aria-valuenow", "12");
      expect(meter).toHaveAttribute("aria-valuetext", "12 of 20");
      expect(host.querySelector(".meter__value")).toHaveTextContent("12 of 20");
    });

    it("hydrates the server HTML without a mismatch", () => {
      const element = <Meter label={label} value={12} max={20} description="Keep going." />;
      const host = serverHtml(element);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, element);
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
      expect(host.querySelector('[role="meter"]')).toHaveAccessibleName(label);
    });
  });

  describe("props", () => {
    it("forwards a ref to the outer div", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<Meter ref={ref} label={label} value={12} max={20} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(outer(container));
    });

    it("merges a consumer's className", () => {
      const { container } = render(<Meter label={label} value={12} max={20} className="w-64" />);
      expect(outer(container)).toHaveClass("bar", "meter", "w-64");
    });

    it("passes other props through to the outer div", () => {
      const { container } = render(<Meter label={label} value={12} max={20} id="topics" data-testid="meter" title="Topics" />);
      const root = outer(container);
      expect(root).toHaveAttribute("id", "topics");
      expect(root).toHaveAttribute("data-testid", "meter");
      expect(root).toHaveAttribute("title", "Topics");
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty", () => {
      render(<Meter label="" value={12} max={20} />);
      expect(screen.getByRole("meter")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        '[design-system] Meter: has an empty label, so screen readers can\'t tell what it measures. Give it a label such as "Topics done".',
      ]);
    });

    it("warns when the label is only spaces", () => {
      render(<Meter label="   " value={12} max={20} />);
      expect(screen.getByRole("meter")).toBeInTheDocument();
      expect(takeWarnings()).toHaveLength(1);
    });
  });

  describe("types", () => {
    it("requires a label and a value", () => {
      expectTypeOf<{ value: number }>().not.toExtend<MeterProps>();
      expectTypeOf<{ label: string }>().not.toExtend<MeterProps>();
      expectTypeOf<{ label: string; value: number }>().toExtend<MeterProps>();
    });

    it("takes the label as plain text only, and the value as a number only", () => {
      expectTypeOf<{ label: ReactElement; value: number }>().not.toExtend<MeterProps>();
      expectTypeOf<{ label: string; value: null }>().not.toExtend<MeterProps>();
      expectTypeOf<{ label: string; value: string }>().not.toExtend<MeterProps>();
    });

    it("has no children, role, naming, value, live-region, or hiding props", () => {
      expectTypeOf<MeterProps>().not.toHaveProperty("children");
      expectTypeOf<MeterProps>().not.toHaveProperty("role");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-label");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-labelledby");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-describedby");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-valuetext");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-valuenow");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-valuemin");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-valuemax");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-hidden");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-live");
      expectTypeOf<MeterProps>().not.toHaveProperty("aria-busy");
    });

    it("has no Progress-only props", () => {
      expectTypeOf<MeterProps>().not.toHaveProperty("hideLabel");
      expectTypeOf<MeterProps>().not.toHaveProperty("delay");
    });

    it("only takes the four tones and the two sizes", () => {
      expectTypeOf<{ label: string; value: number; tone: "info" }>().not.toExtend<MeterProps>();
      expectTypeOf<{ label: string; value: number; size: "lg" }>().not.toExtend<MeterProps>();
    });
  });
});
