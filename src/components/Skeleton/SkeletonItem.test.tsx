import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { SkeletonItem } from "./SkeletonItem";
import type { SkeletonItemProps, SkeletonShape } from "./SkeletonItem";

/** The item's element */
function item(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>(".skeleton-item");
  expect(element).toBeInTheDocument();
  expect(element!.tagName).toBe("SPAN");
  return element!;
}

const lines = (container: HTMLElement) => item(container).querySelectorAll(".skeleton-item__line");

describe("SkeletonItem", () => {
  describe("rendering", () => {
    it("is one line of text by default", () => {
      const { container } = render(<SkeletonItem />);
      expect(item(container)).toHaveAttribute("data-shape", "text");
      expect(lines(container)).toHaveLength(1);
    });

    it.each(["box", "circle"] as const)("maps shape=%s to data-shape, with no lines", (shape) => {
      const { container } = render(<SkeletonItem shape={shape} />);
      expect(item(container)).toHaveAttribute("data-shape", shape);
      expect(lines(container)).toHaveLength(0);
    });

    it("renders as many lines as asked", () => {
      const { container } = render(<SkeletonItem lines={3} />);
      expect(lines(container)).toHaveLength(3);
    });

    it.each([0, -2, 2.7, Number.NaN])("makes lines=%s a whole number of at least one", (count) => {
      const { container } = render(<SkeletonItem lines={count} />);
      expect(lines(container)).toHaveLength(Number.isNaN(count) || count < 1 ? 1 : Math.floor(count));
    });

    it("is hidden from screen readers, whatever is passed", () => {
      const overrides = { "aria-hidden": false } as object;
      const { container } = render(<SkeletonItem {...overrides} />);
      expect(item(container)).toHaveAttribute("aria-hidden", "true");
    });

    it("never uses modifier classes", () => {
      const { container } = render(<SkeletonItem shape="circle" />);
      expect(item(container).className).toBe("skeleton-item");
    });

    it("merges a consumer className with its own, for its size", () => {
      const { container } = render(<SkeletonItem shape="circle" className="size-10" />);
      expect(item(container).className).toBe("skeleton-item size-10");
    });

    it("passes other props through to the span", () => {
      const { container } = render(<SkeletonItem shape="box" id="thumbnail" data-testid="thumbnail" />);
      expect(item(container)).toHaveAttribute("id", "thumbnail");
      expect(item(container)).toHaveAttribute("data-testid", "thumbnail");
    });

    it("forwards its ref to the span", () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(<SkeletonItem ref={ref} />);
      expect(ref.current).toBe(item(container));
    });

    it("has no text and takes no focus", () => {
      const { container } = render(<SkeletonItem lines={2} />);
      expect(item(container)).toHaveTextContent(/^$/);
      expect(container.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
    });
  });

  describe("types", () => {
    it("only accepts the three shapes", () => {
      expectTypeOf<SkeletonShape>().toEqualTypeOf<"text" | "box" | "circle">();
      // @ts-expect-error not a shape
      <SkeletonItem shape="triangle" />;
    });

    it("only takes lines on text", () => {
      <SkeletonItem lines={2} />;
      <SkeletonItem shape="text" lines={2} />;
      // @ts-expect-error a box has no lines
      <SkeletonItem shape="box" lines={2} />;
      // @ts-expect-error a circle has no lines
      <SkeletonItem shape="circle" lines={2} />;
    });

    it("has no children or role, and is always hidden from screen readers", () => {
      // @ts-expect-error a shape has no content
      <SkeletonItem>Loading</SkeletonItem>;
      // @ts-expect-error a shape has no role
      <SkeletonItem role="img" />;
      expectTypeOf<SkeletonItemProps>().not.toHaveProperty("aria-hidden");
    });
  });
});
