import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import type { SkeletonProps } from "@/components/Skeleton/Skeleton";
import { SkeletonItem } from "@/components/Skeleton/SkeletonItem";

const label = "Loading applications…";

/** The skeleton's outer element */
function root(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>(".skeleton");
  expect(element).toBeInTheDocument();
  return element!;
}

/** The hidden copy of the label that's in the HTML from the start */
function hiddenLabel(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>(".skeleton__label");
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(label);
  return element!;
}

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

/** Lets the announcement through: it waits at least 100ms after the skeleton appears, or for the delay. */
function announce(ms = 100) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const shapes = (
  <>
    <SkeletonItem shape="circle" />
    <SkeletonItem lines={2} />
  </>
);

describe("Skeleton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders a div with the shapes inside", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(root(container).tagName).toBe("DIV");
      expect(root(container).querySelectorAll(".skeleton-item")).toHaveLength(2);
    });

    it("never uses modifier classes", () => {
      const { container } = render(<Skeleton label={label} delay={300}>{shapes}</Skeleton>);
      expect(root(container).className).toBe("skeleton");
    });

    it("merges a consumer className with its own, for the layout of the shapes", () => {
      const { container } = render(<Skeleton label={label} className="grid gap-3">{shapes}</Skeleton>);
      expect(root(container).className).toBe("skeleton grid gap-3");
    });

    it("passes other props through to the div", () => {
      const { container } = render(<Skeleton label={label} id="loading" data-testid="loading" title="Applications">{shapes}</Skeleton>);
      expect(root(container)).toHaveAttribute("id", "loading");
      expect(root(container)).toHaveAttribute("data-testid", "loading");
      expect(root(container)).toHaveAttribute("title", "Applications");
    });

    it("forwards its ref to the div", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<Skeleton label={label} ref={ref}>{shapes}</Skeleton>);
      expect(ref.current).toBe(root(container));
    });

    it("never shows its label: both copies are visually hidden", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(hiddenLabel(container)).toHaveClass("visually-hidden");
      expect(screen.getByRole("status")).toHaveClass("visually-hidden", "skeleton__status");
    });

    it("takes no focus and isn't busy", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(root(container)).not.toHaveAttribute("aria-busy");
      expect(container.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
    });
  });

  describe("announcing", () => {
    it("puts the label in the server HTML, with an empty status region", () => {
      const host = serverHtml(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(hiddenLabel(host)).not.toHaveAttribute("aria-hidden");
      const status = host.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent("");
    });

    it("hydrates without a mismatch, then hides the copy and fills the status region", () => {
      const host = serverHtml(<Skeleton label={label}>{shapes}</Skeleton>);
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      onTestFinished(() => error.mockRestore());
      let app: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        app = hydrateRoot(host, <Skeleton label={label}>{shapes}</Skeleton>);
      });
      onTestFinished(() => act(() => app!.unmount()));
      expect(error).not.toHaveBeenCalled();
      expect(hiddenLabel(host)).toHaveAttribute("aria-hidden", "true");
      expect(host.querySelector('[role="status"]')).toHaveTextContent("");
      announce();
      expect(host.querySelector('[role="status"]')).toHaveTextContent(label);
    });

    it("hides the copy at once and announces the label after 100ms", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(hiddenLabel(container)).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(99);
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(1);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("says it once: the shapes are hidden from screen readers", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      announce();
      const items = container.querySelectorAll(".skeleton-item");
      expect(items).toHaveLength(2);
      items.forEach((item) => expect(item).toHaveAttribute("aria-hidden", "true"));
    });

    it("announces a new label when it changes", () => {
      const { rerender } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      announce();
      rerender(<Skeleton label="Loading contacts…">{shapes}</Skeleton>);
      expect(screen.getByRole("status")).toHaveTextContent("Loading contacts…");
    });
  });

  describe("delay", () => {
    it("has no delay by default", () => {
      const { container } = render(<Skeleton label={label}>{shapes}</Skeleton>);
      expect(root(container)).not.toHaveAttribute("data-delayed");
      expect(root(container).style.getPropertyValue("--skeleton-delay")).toBe("");
    });

    it("sets data-delayed and --skeleton-delay, and waits for the delay to announce", () => {
      const { container } = render(<Skeleton label={label} delay={400}>{shapes}</Skeleton>);
      expect(root(container)).toHaveAttribute("data-delayed");
      expect(root(container).style.getPropertyValue("--skeleton-delay")).toBe("400ms");
      announce(399);
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(1);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("keeps the delay it started with when the prop changes", () => {
      const { container, rerender } = render(<Skeleton label={label} delay={400}>{shapes}</Skeleton>);
      rerender(<Skeleton label={label} delay={2000}>{shapes}</Skeleton>);
      expect(root(container).style.getPropertyValue("--skeleton-delay")).toBe("400ms");
      announce(400);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("keeps a consumer's style alongside the delay", () => {
      const { container } = render(<Skeleton label={label} delay={300} style={{ minHeight: "10rem" }}>{shapes}</Skeleton>);
      expect(root(container).style.minHeight).toBe("10rem");
      expect(root(container).style.getPropertyValue("--skeleton-delay")).toBe("300ms");
    });

    it("counts a negative delay as none", () => {
      const { container } = render(<Skeleton label={label} delay={-200}>{shapes}</Skeleton>);
      expect(root(container)).not.toHaveAttribute("data-delayed");
      announce();
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });
  });

  describe("dev warnings", () => {
    it("warns about an empty label", () => {
      const { container } = render(<Skeleton label="  ">{shapes}</Skeleton>);
      expect(root(container)).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        '[design-system] Skeleton: has an empty label, so screen readers hear nothing while it loads. Give it a label such as "Loading projects…".',
      ]);
    });
  });

  describe("types", () => {
    it("requires a plain-text label", () => {
      // @ts-expect-error a skeleton needs a label
      <Skeleton>{shapes}</Skeleton>;
      // @ts-expect-error the label is plain text
      <Skeleton label={<b>Loading</b>}>{shapes}</Skeleton>;
      expectTypeOf<SkeletonProps["label"]>().toEqualTypeOf<string>();
    });

    it("can't be given a role", () => {
      // @ts-expect-error the skeleton's role is fixed
      <Skeleton label={label} role="progressbar" />;
    });

    it("leaves out the attributes that would change what screen readers hear", () => {
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-live");
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-atomic");
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-busy");
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-label");
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-labelledby");
      expectTypeOf<SkeletonProps>().not.toHaveProperty("aria-hidden");
    });
  });
});
