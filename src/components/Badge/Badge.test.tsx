import { render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Badge } from "./Badge";
import type { BadgeProps, BadgeSize, BadgeTone } from "./Badge";

/** The badge's own element, found by its words */
function badge(words = "Offer") {
  const element = screen.getByText(words).closest<HTMLElement>(".badge");
  expect(element).not.toBeNull();
  expect(element!.tagName).toBe("SPAN");
  return element!;
}

describe("Badge", () => {
  describe("rendering", () => {
    it("renders a span with its words", () => {
      render(<Badge>Offer</Badge>);
      expect(badge()).toHaveClass("badge");
      expect(badge()).toHaveTextContent(/^Offer$/);
      // The words have their own span, so they can wrap when the badge is wider than its container
      expect(screen.getByText("Offer")).toHaveClass("badge__label");
    });

    it("defaults to the neutral tone and the md size", () => {
      render(<Badge>Offer</Badge>);
      expect(badge()).toHaveAttribute("data-tone", "neutral");
      expect(badge()).toHaveAttribute("data-size", "md");
    });

    it.each(["neutral", "success", "warning", "danger"] as const)("maps tone=%s to data-tone", (tone) => {
      render(<Badge tone={tone}>Offer</Badge>);
      expect(badge()).toHaveAttribute("data-tone", tone);
    });

    it.each(["sm", "md"] as const)("maps size=%s to data-size", (size) => {
      render(<Badge size={size}>Offer</Badge>);
      expect(badge()).toHaveAttribute("data-size", size);
    });

    it("never uses modifier classes", () => {
      render(<Badge tone="danger" size="sm" icon={<Check />}>Offer</Badge>);
      expect(badge().className).toBe("badge");
    });

    it("merges a consumer className with its own", () => {
      render(<Badge className="ml-2">Offer</Badge>);
      expect(badge().className).toBe("badge ml-2");
    });

    it("passes other props through to the span", () => {
      render(<Badge id="status" title="Application status" data-testid="status" aria-describedby="status-help">Offer</Badge>);
      expect(badge()).toHaveAttribute("id", "status");
      expect(badge()).toHaveAttribute("title", "Application status");
      expect(badge()).toHaveAttribute("data-testid", "status");
      expect(badge()).toHaveAttribute("aria-describedby", "status-help");
    });

    it("forwards its ref to the span", () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Badge ref={ref}>Offer</Badge>);
      expect(ref.current).toBe(badge());
    });

    it("is plain text: no role, no focus, nothing to press", () => {
      const { container } = render(<Badge tone="success">Offer</Badge>);
      expect(badge()).not.toHaveAttribute("role");
      expect(badge()).not.toHaveAttribute("tabindex");
      expect(badge()).not.toHaveAttribute("aria-live");
      expect(container.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
    });

    it("renders numbers, and text mixed with numbers", () => {
      const count = 3;
      render(
        <>
          <Badge>{count} new</Badge>
          <Badge>{12}</Badge>
        </>,
      );
      expect(badge("3 new")).toHaveTextContent(/^3 new$/);
      expect(badge("12")).toHaveTextContent(/^12$/);
    });

    it("is the same span in server HTML, before JavaScript runs", () => {
      const html = renderToString(<Badge tone="warning" size="sm">Needs review</Badge>);
      expect(html).toMatch(/^<span /);
      expect(html).toContain('class="badge"');
      expect(html).toContain('data-tone="warning"');
      expect(html).toContain('data-size="sm"');
      expect(html).toContain("Needs review");
    });
  });

  describe("icon", () => {
    it("renders the icon before the words, hidden from screen readers", () => {
      render(<Badge tone="success" icon={<Check data-testid="icon" />}>Offer</Badge>);
      const icon = badge().firstElementChild as HTMLElement;
      expect(icon).toHaveClass("badge__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toContainElement(screen.getByTestId("icon"));
      expect(badge().lastChild?.textContent).toBe("Offer");
    });

    it("leaves the words as the only text", () => {
      render(<Badge icon={<Check />}>Offer</Badge>);
      expect(badge()).toHaveTextContent(/^Offer$/);
    });

    it("renders no icon wrapper without an icon", () => {
      render(<Badge>Offer</Badge>);
      expect(badge()).toHaveTextContent("Offer");
      expect(badge().querySelector(".badge__icon")).toBeNull();
    });
  });

  describe("types", () => {
    it("requires words, as text or numbers", () => {
      <Badge>Offer</Badge>;
      <Badge>{3}</Badge>;
      <Badge>{3} new</Badge>;
      // @ts-expect-error a badge needs words
      <Badge />;
      // @ts-expect-error only text and numbers, so nothing like a link ends up inside
      <Badge><a href="/offers">Offer</a></Badge>;
      // @ts-expect-error not a boolean
      <Badge>{true}</Badge>;
    });

    it("only accepts known tones and sizes", () => {
      expectTypeOf<BadgeTone>().toEqualTypeOf<"neutral" | "success" | "warning" | "danger">();
      expectTypeOf<BadgeSize>().toEqualTypeOf<"sm" | "md">();
      // @ts-expect-error not a tone
      <Badge tone="info">Offer</Badge>;
      // @ts-expect-error not a size
      <Badge size="lg">Offer</Badge>;
    });

    it("can't be made focusable or given a role", () => {
      // @ts-expect-error a badge is never focusable
      <Badge tabIndex={0}>Offer</Badge>;
      // @ts-expect-error a badge is plain text
      <Badge role="status">Offer</Badge>;
    });

    it("leaves out the attributes that would make it live or rename it", () => {
      // TypeScript doesn't check hyphenated JSX attributes, so these are checked on the props type
      expectTypeOf<BadgeProps>().not.toHaveProperty("aria-live");
      expectTypeOf<BadgeProps>().not.toHaveProperty("aria-atomic");
      expectTypeOf<BadgeProps>().not.toHaveProperty("aria-label");
      expectTypeOf<BadgeProps>().not.toHaveProperty("aria-labelledby");
    });
  });
});
