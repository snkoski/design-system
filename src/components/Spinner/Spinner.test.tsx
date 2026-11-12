import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Spinner } from "@/components/Spinner/Spinner";
import type { SpinnerProps } from "@/components/Spinner/Spinner";

const label = "Loading applications…";

/** The visible label: the label text that isn't inside the status region. */
function visibleLabel(container: HTMLElement) {
  const element = container.querySelector(".spinner__label");
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(label);
  return element as HTMLElement;
}

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

/** Lets the announcement through: it waits at least 100ms after the spinner appears, or for the delay. */
function announce(ms = 100) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Spinner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders a span with the drawing and a visible label", () => {
      const { container } = render(<Spinner label={label} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.tagName).toBe("SPAN");
      expect(root).toHaveClass("spinner");
      expect(root.querySelector("svg")).toBeInTheDocument();
      expect(visibleLabel(container)).not.toHaveClass("visually-hidden");
    });

    it("defaults to the md size", () => {
      const { container } = render(<Spinner label={label} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["sm", "md", "lg"] as const)("maps size=%s to data-size", (size) => {
      const { container } = render(<Spinner label={label} size={size} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never uses modifier classes", () => {
      const { container } = render(<Spinner label={label} size="lg" hideLabel delay={300} />);
      expect(container.firstElementChild?.className).toBe("spinner");
    });

    it("hides the drawing from screen readers", () => {
      const { container } = render(<Spinner label={label} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("spinner-graphic", "spinner__graphic");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });

    it("takes no focus", () => {
      const { container } = render(<Spinner label={label} />);
      expect(container.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
      expect(container.firstElementChild).toBeInTheDocument();
    });
  });

  describe("announcing", () => {
    it("has one status region, which starts empty and then gets the label", () => {
      render(<Spinner label={label} />);
      const status = screen.getByRole("status");
      expect(status).toHaveClass("visually-hidden");
      expect(status).toHaveTextContent("");
      announce();
      expect(screen.getByRole("status")).toHaveTextContent(label);
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    it("waits at least 100ms after appearing, so screen readers see the region before its text", () => {
      render(<Spinner label={label} />);
      announce(99);
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(1);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("hides the visible label from screen readers once JavaScript runs, so the label is read once", () => {
      const { container } = render(<Spinner label={label} />);
      expect(visibleLabel(container)).toHaveAttribute("aria-hidden", "true");
      announce();
      expect(visibleLabel(container)).toHaveAttribute("aria-hidden", "true");
    });

    it("sends the label in the server HTML, readable without JavaScript, with the status region empty", () => {
      const host = serverHtml(<Spinner label={label} />);
      const visible = visibleLabel(host);
      expect(visible).not.toHaveAttribute("aria-hidden");
      const status = host.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent("");
    });

    it("hydrates the server HTML without a mismatch, then hides the visible label from screen readers", () => {
      const host = serverHtml(<Spinner label={label} />);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, <Spinner label={label} />);
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      expect(visibleLabel(host)).toHaveAttribute("aria-hidden", "true");
      expect(host.querySelector('[role="status"]')).toHaveTextContent("");
      announce();
      expect(host.querySelector('[role="status"]')).toHaveTextContent(label);
    });

    it("announces a new label after it changes", () => {
      const { rerender } = render(<Spinner label={label} />);
      announce();
      rerender(<Spinner label="Loading page 2…" />);
      expect(screen.getByRole("status")).toHaveTextContent("Loading page 2…");
    });

    it("stops waiting when it's removed before announcing", () => {
      const { unmount } = render(<Spinner label={label} delay={500} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("delay", () => {
    it("shows straight away by default, with no delay attribute or style", () => {
      const { container } = render(<Spinner label={label} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass("spinner");
      expect(root).not.toHaveAttribute("data-delayed");
      expect(root.style.getPropertyValue("--spinner-delay")).toBe("");
    });

    it("passes the delay to the CSS, which hides the spinner until it's over", () => {
      const { container } = render(<Spinner label={label} delay={400} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute("data-delayed");
      expect(root.style.getPropertyValue("--spinner-delay")).toBe("400ms");
    });

    it("announces only after the delay", () => {
      render(<Spinner label={label} delay={400} />);
      announce(399);
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(1);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("keeps the delay it started with when the prop changes", () => {
      const { container, rerender } = render(<Spinner label={label} delay={400} />);
      rerender(<Spinner label={label} delay={0} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute("data-delayed");
      expect(root.style.getPropertyValue("--spinner-delay")).toBe("400ms");
      announce(399);
      expect(screen.getByRole("status")).toHaveTextContent("");
      announce(1);
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("treats a negative delay as none", () => {
      const { container } = render(<Spinner label={label} delay={-200} />);
      expect(container.firstElementChild).not.toHaveAttribute("data-delayed");
      announce();
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("keeps a consumer's style next to the delay", () => {
      const { container } = render(<Spinner label={label} delay={250} style={{ color: "red" }} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.color).toBe("red");
      expect(root.style.getPropertyValue("--spinner-delay")).toBe("250ms");
    });
  });

  describe("hideLabel", () => {
    it("hides the label from view but still announces it", () => {
      const { container } = render(<Spinner label={label} hideLabel />);
      expect(visibleLabel(container)).toHaveClass("spinner__label", "visually-hidden");
      announce();
      expect(screen.getByRole("status")).toHaveTextContent(label);
    });

    it("keeps the hidden label readable in the server HTML", () => {
      const host = serverHtml(<Spinner label={label} hideLabel />);
      expect(visibleLabel(host)).not.toHaveAttribute("aria-hidden");
    });

    it("shows the label when hideLabel is false", () => {
      const { container } = render(<Spinner label={label} hideLabel={false} />);
      expect(visibleLabel(container)).not.toHaveClass("visually-hidden");
    });
  });

  describe("props", () => {
    it("forwards a ref to the outer span", () => {
      const ref = createRef<HTMLSpanElement>();
      const { container } = render(<Spinner ref={ref} label={label} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current).toBe(container.firstElementChild);
    });

    it("merges a consumer's className", () => {
      const { container } = render(<Spinner label={label} className="mx-auto" />);
      expect(container.firstElementChild).toHaveClass("spinner", "mx-auto");
    });

    it("passes other props through", () => {
      const { container } = render(<Spinner label={label} id="list-loading" data-testid="spinner" title="Loading" />);
      const root = container.firstElementChild;
      expect(root).toHaveAttribute("id", "list-loading");
      expect(root).toHaveAttribute("data-testid", "spinner");
      expect(root).toHaveAttribute("title", "Loading");
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty", () => {
      render(<Spinner label="" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        '[design-system] Spinner: has an empty label, so it doesn\'t say what\'s loading and screen readers announce nothing. Give it a label such as "Loading projects…".',
      ]);
    });

    it("warns when the label is only spaces", () => {
      render(<Spinner label="   " />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(takeWarnings()).toHaveLength(1);
    });
  });

  describe("types", () => {
    it("requires a label", () => {
      expectTypeOf<{ size: "md" }>().not.toExtend<SpinnerProps>();
      expectTypeOf<{ label: string }>().toExtend<SpinnerProps>();
    });

    it("takes the label as plain text only", () => {
      expectTypeOf<{ label: ReactElement }>().not.toExtend<SpinnerProps>();
      expectTypeOf<{ label: number }>().not.toExtend<SpinnerProps>();
    });

    it("has no children, role, live-region, naming, or hiding props", () => {
      expectTypeOf<SpinnerProps>().not.toHaveProperty("children");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("role");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-live");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-label");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-labelledby");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-atomic");
      expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-hidden");
    });

    it("only takes the three sizes", () => {
      expectTypeOf<{ label: string; size: "xl" }>().not.toExtend<SpinnerProps>();
    });
  });
});
