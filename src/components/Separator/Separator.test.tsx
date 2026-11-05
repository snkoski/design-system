import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Separator } from "./Separator";
import type { SeparatorProps } from "./Separator";

/** The one separator on the page, found the way a screen reader finds it. */
function separator() {
  return screen.getByRole("separator");
}

describe("Separator", () => {
  describe("rendering", () => {
    it("renders an <hr> with its class", () => {
      render(<Separator />);
      expect(separator().tagName).toBe("HR");
      expect(separator()).toHaveClass("separator");
    });

    it("is horizontal by default", () => {
      render(<Separator />);
      expect(separator()).toHaveAttribute("aria-orientation", "horizontal");
      expect(separator()).toHaveAttribute("data-orientation", "horizontal");
    });

    it("maps orientation=vertical to aria-orientation and data-orientation", () => {
      render(<Separator orientation="vertical" />);
      expect(separator()).toHaveAttribute("aria-orientation", "vertical");
      expect(separator()).toHaveAttribute("data-orientation", "vertical");
    });

    it("never uses modifier classes", () => {
      render(<Separator orientation="vertical" />);
      expect(separator().className).toBe("separator");
    });

    it("merges a consumer className with its own", () => {
      render(<Separator className="my-4" />);
      expect(separator().className).toBe("separator my-4");
    });

    it("passes other props through to the element", () => {
      render(<Separator id="filters-end" title="End of filters" data-testid="line" />);
      expect(separator()).toHaveAttribute("id", "filters-end");
      expect(separator()).toHaveAttribute("title", "End of filters");
      expect(separator()).toHaveAttribute("data-testid", "line");
    });

    it("forwards its ref to the <hr>", () => {
      const ref = createRef<HTMLElement>();
      render(<Separator ref={ref} />);
      expect(ref.current).toBe(separator());
      expect(ref.current).toBeInstanceOf(HTMLHRElement);
    });

    it("is announced to screen readers and takes no focus", () => {
      const { container } = render(<Separator />);
      expect(separator()).not.toHaveAttribute("aria-hidden");
      expect(separator()).not.toHaveAttribute("tabindex");
      expect(container.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
    });

    it("keeps its role and orientation, and stays announced, whatever untyped attributes say", () => {
      const overrides = { role: "none", "aria-orientation": "vertical", "aria-hidden": "true" } as object;
      render(<Separator {...overrides} id="kept" />);
      expect(separator()).toHaveAttribute("id", "kept");
      expect(separator()).toHaveAttribute("role", "separator");
      expect(separator()).toHaveAttribute("aria-orientation", "horizontal");
      expect(separator()).not.toHaveAttribute("aria-hidden");
    });

    it("is the same <hr> in server HTML, before JavaScript runs", () => {
      const html = renderToString(<Separator orientation="vertical" />);
      expect(html).toMatch(/^<hr /);
      expect(html).toContain('class="separator"');
      expect(html).toContain('role="separator"');
      expect(html).toContain('aria-orientation="vertical"');
    });
  });

  describe("label", () => {
    it("renders a <div> separator with the words in the middle", () => {
      render(<Separator label="or" />);
      expect(separator().tagName).toBe("DIV");
      expect(separator()).toHaveClass("separator");
      expect(separator()).toHaveAttribute("aria-orientation", "horizontal");
      expect(separator()).toHaveAttribute("data-orientation", "horizontal");
      const words = separator().querySelector(".separator__label");
      expect(words).toBeInTheDocument();
      expect(words).toHaveTextContent("or");
    });

    it("hides the words from screen readers, which hear only the separator", () => {
      render(<Separator label="or" />);
      const words = separator().querySelector(".separator__label");
      expect(words).toHaveTextContent("or");
      expect(words).toHaveAttribute("aria-hidden", "true");
      expect(separator()).toHaveAccessibleName("");
      expect(separator()).not.toHaveAttribute("aria-hidden");
    });

    it("never uses modifier classes and merges a consumer className", () => {
      render(<Separator label="or" className="my-6" />);
      expect(separator().className).toBe("separator my-6");
    });

    it("forwards its ref to the <div>", () => {
      const ref = createRef<HTMLElement>();
      render(<Separator label="or" ref={ref} />);
      expect(ref.current).toBe(separator());
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("passes other props through to the <div>", () => {
      render(<Separator label="or" id="sign-in-or" data-testid="or-line" />);
      expect(separator()).toHaveAttribute("id", "sign-in-or");
      expect(separator()).toHaveAttribute("data-testid", "or-line");
    });

    it.each(["", "   "])("renders the plain <hr> for an empty label (%j)", (label) => {
      render(<Separator label={label} />);
      expect(separator().tagName).toBe("HR");
      expect(separator().childNodes).toHaveLength(0);
    });

    it("ignores a label on a vertical separator, from code the types don't check", () => {
      // @ts-expect-error a vertical separator can't have a label
      render(<Separator orientation="vertical" label="or" />);
      expect(separator().tagName).toBe("HR");
      expect(separator()).toHaveAttribute("aria-orientation", "vertical");
      expect(separator().childNodes).toHaveLength(0);
    });

    it("is in the server HTML with its words", () => {
      const html = renderToString(<Separator label="or" />);
      expect(html).toMatch(/^<div /);
      expect(html).toContain('role="separator"');
      expect(html).toContain('<span class="separator__label" aria-hidden="true">or</span>');
    });
  });

  describe("types", () => {
    it("only accepts the two orientations", () => {
      expectTypeOf<"horizontal">().toExtend<NonNullable<SeparatorProps["orientation"]>>();
      expectTypeOf<"vertical">().toExtend<NonNullable<SeparatorProps["orientation"]>>();
      // @ts-expect-error not an orientation
      <Separator orientation="diagonal" />;
    });

    it("takes a plain-text label, only when horizontal", () => {
      <Separator label="or" />;
      <Separator orientation="horizontal" label="or" />;
      // @ts-expect-error a vertical separator can't have a label
      <Separator orientation="vertical" label="or" />;
      // @ts-expect-error the label is plain text
      <Separator label={<strong>or</strong>} />;
    });

    it("accepts a label that may be undefined", () => {
      const maybe: string | undefined = undefined;
      <Separator label={maybe} />;
    });

    it("has no children, and can't change its element, role, or what screen readers hear", () => {
      // @ts-expect-error an <hr> has no children; use label
      <Separator>or</Separator>;
      // @ts-expect-error the element is fixed
      <Separator render={<div />} />;
      // @ts-expect-error the role is fixed
      <Separator role="none" />;
      // TypeScript doesn't check hyphenated JSX attributes against the props type, so passing these still
      // compiles; leaving them out of the type keeps them out of the docs and editor suggestions.
      expectTypeOf<SeparatorProps>().not.toHaveProperty("aria-orientation"); // orientation sets it
      expectTypeOf<SeparatorProps>().not.toHaveProperty("aria-hidden"); // a separator is always announced
    });

    it("takes a ref to an <hr> or any element", () => {
      <Separator ref={createRef<HTMLHRElement>()} />;
      <Separator ref={createRef<HTMLElement>()} />;
    });
  });
});
