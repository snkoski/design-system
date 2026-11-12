import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Progress } from "@/components/Progress/Progress";
import type { ProgressProps } from "@/components/Progress/Progress";

const label = "Uploading resume.pdf…";

/** The outer element: the one that takes className, ref, style, and other props. */
function outer(container: HTMLElement) {
  const element = container.firstElementChild as HTMLElement | null;
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass("progress");
  return element!;
}

/** The fill, and the position it's drawn at (0 to 100), read from the custom property the CSS uses. */
function fill(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>(".progress__fill");
  expect(element).toBeInTheDocument();
  return Number(element!.style.getPropertyValue("--bar-value"));
}

/** The status region screen readers hear the label from, once. */
function status(container: HTMLElement) {
  const regions = container.querySelectorAll('[role="status"]');
  expect(regions).toHaveLength(1);
  return regions[0] as HTMLElement;
}

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

/** Lets the announcement through: it waits at least 100ms after the bar appears, or for the delay. */
function announce(ms = 100) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Progress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders a progress bar named by its visible label", () => {
      const { container } = render(<Progress label={label} value={40} />);
      expect(screen.getByRole("progressbar", { name: label })).toBeInTheDocument();
      const visible = container.querySelector(".progress__label");
      expect(visible).toHaveClass("bar__label");
      expect(visible).toHaveTextContent(label);
      expect(visible).not.toHaveClass("visually-hidden");
    });

    it("puts the shared bar classes next to its own on every part", () => {
      const { container } = render(<Progress label={label} value={40} description="About a minute left." />);
      expect(outer(container)).toHaveClass("bar", "progress");
      expect(screen.getByRole("progressbar")).toHaveClass("bar__bar", "progress__bar");
      expect(container.querySelector(".progress__value")).toHaveClass("bar__value");
      expect(container.querySelector(".progress__track")).toHaveClass("bar__track");
      expect(container.querySelector(".progress__fill")).toHaveClass("bar__fill");
      expect(container.querySelector(".progress__description")).toHaveClass("bar__description");
    });

    it("sets the value, min, and max for screen readers", () => {
      render(<Progress label="Importing contacts…" value={3} min={1} max={10} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "3");
      expect(bar).toHaveAttribute("aria-valuemin", "1");
      expect(bar).toHaveAttribute("aria-valuemax", "10");
    });

    it("defaults to a range of 0 to 100", () => {
      render(<Progress label={label} value={40} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    it("shows the value as a percent by default, and announces the same words", () => {
      const { container } = render(<Progress label="Importing contacts…" value={3} max={10} />);
      expect(container.querySelector(".progress__value")).toHaveTextContent(/^30%$/);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "30%");
    });

    it("shows and announces valueText instead of the percent", () => {
      const { container } = render(<Progress label="Importing contacts…" value={3} max={10} valueText="3 of 10 files" />);
      expect(container.querySelector(".progress__value")).toHaveTextContent(/^3 of 10 files$/);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3 of 10 files");
    });

    it("treats an empty valueText as not given", () => {
      const { container } = render(<Progress label={label} value={40} valueText="" />);
      expect(container.querySelector(".progress__value")).toHaveTextContent(/^40%$/);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "40%");
    });

    it("hides the shown value from screen readers, which hear it as the bar's value instead", () => {
      const { container } = render(<Progress label={label} value={40} />);
      const value = container.querySelector(".progress__value");
      expect(value).toHaveTextContent("40%");
      expect(value).toHaveAttribute("aria-hidden", "true");
    });

    it("draws the fill at the value's place in the range", () => {
      const { container } = render(<Progress label="Importing contacts…" value={3} max={10} />);
      expect(fill(container)).toBe(30);
    });

    it("clamps a value outside the range to its ends", () => {
      const { container, rerender } = render(<Progress label={label} value={140} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      expect(fill(container)).toBe(100);
      rerender(<Progress label={label} value={-10} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
      expect(fill(container)).toBe(0);
    });

    it("marks a bar that's under way and one that's done, from Base UI", () => {
      const { rerender } = render(<Progress label={label} value={40} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-progressing");
      rerender(<Progress label="Uploaded resume.pdf" value={100} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-complete");
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("data-progressing");
    });

    it("defaults to the md size, and sets data-size", () => {
      const { container, rerender } = render(<Progress label={label} value={40} />);
      expect(outer(container)).toHaveAttribute("data-size", "md");
      rerender(<Progress label={label} value={40} size="sm" />);
      expect(outer(container)).toHaveAttribute("data-size", "sm");
    });

    it("has no tone", () => {
      const { container } = render(<Progress label={label} value={40} />);
      expect(outer(container)).not.toHaveAttribute("data-tone");
    });

    it("never uses modifier classes", () => {
      const { container } = render(<Progress label={label} value={null} size="sm" hideLabel delay={200} />);
      const classes = [...container.querySelectorAll("*")].flatMap((element) => [...element.classList]);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes.filter((name) => name.includes("--"))).toEqual([]);
    });

    it("takes no focus", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(
        <>
          <Progress label={label} value={40} description="About a minute left." />
          <button type="button">After</button>
        </>,
      );
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("tabindex");
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });
  });

  describe("when it doesn't know how long", () => {
    it("leaves out the value, and Base UI marks it indeterminate", () => {
      render(<Progress label="Loading applications…" value={null} />);
      const bar = screen.getByRole("progressbar", { name: "Loading applications…" });
      expect(bar).not.toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("data-indeterminate");
    });

    it("shows no value and announces none, instead of Base UI's English words", () => {
      const { container } = render(<Progress label="Loading applications…" value={null} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toBeInTheDocument();
      expect(container.querySelector(".progress__value")).not.toBeInTheDocument();
      expect(bar).not.toHaveAttribute("aria-valuetext");
      expect(container).not.toHaveTextContent("indeterminate");
    });

    it("shows and announces valueText when it's given", () => {
      const { container } = render(<Progress label="Importing contacts…" value={null} valueText="Starting…" />);
      expect(container.querySelector(".progress__value")).toHaveTextContent(/^Starting…$/);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Starting…");
    });

    it("gives the fill no position, so the CSS can slide it", () => {
      const { container } = render(<Progress label="Loading applications…" value={null} />);
      const element = container.querySelector<HTMLElement>(".progress__fill");
      expect(element).toBeInTheDocument();
      expect(element!.style.getPropertyValue("--bar-value")).toBe("");
      expect(element!.style.width).toBe("");
    });

    it("treats a value that isn't a finite number as unknown, as Base UI does", () => {
      const { rerender } = render(<Progress label={label} value={Number.NaN} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-indeterminate");
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuetext");
      rerender(<Progress label={label} value={Infinity} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-indeterminate");
    });

    it("starts filling once it has a value", () => {
      const { container, rerender } = render(<Progress label={label} value={null} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-indeterminate");
      rerender(<Progress label={label} value={25} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).not.toHaveAttribute("data-indeterminate");
      expect(bar).toHaveAttribute("aria-valuenow", "25");
      expect(fill(container)).toBe(25);
    });
  });

  describe("description", () => {
    it("describes the bar, from outside it", () => {
      const { container } = render(<Progress label={label} value={40} description="About a minute left." />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAccessibleDescription("About a minute left.");
      const description = container.querySelector(".progress__description");
      expect(description?.tagName).toBe("P");
      expect(bar).not.toContainElement(description as HTMLElement);
      expect(outer(container)).toContainElement(description as HTMLElement);
    });

    it("renders no description and no link to one when it isn't given", () => {
      const { container } = render(<Progress label={label} value={40} />);
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-describedby");
      expect(container.querySelector(".progress__description")).not.toBeInTheDocument();
    });
  });

  describe("hideLabel", () => {
    it("hides the label and value from view, but the bar keeps its name and value", () => {
      const { container } = render(<Progress label={label} value={40} hideLabel />);
      const bar = screen.getByRole("progressbar", { name: label });
      expect(bar).toHaveAttribute("aria-valuetext", "40%");
      expect(container.querySelector(".progress__label")).toHaveClass("visually-hidden");
      expect(container.querySelector(".progress__value")).toHaveClass("visually-hidden");
    });

    it("still announces the label", () => {
      const { container } = render(<Progress label={label} value={40} hideLabel />);
      announce();
      expect(status(container)).toHaveTextContent(label);
    });

    it("shows the label by default", () => {
      const { container } = render(<Progress label={label} value={40} />);
      expect(container.querySelector(".progress__label")).not.toHaveClass("visually-hidden");
      expect(container.querySelector(".progress__value")).not.toHaveClass("visually-hidden");
    });
  });

  describe("announcing", () => {
    it("has one status region, outside the bar, which starts empty and then gets the label", () => {
      const { container } = render(<Progress label={label} value={40} />);
      const region = status(container);
      expect(screen.getByRole("progressbar")).not.toContainElement(region);
      expect(region).toHaveClass("visually-hidden");
      expect(region).toHaveTextContent("");
      announce();
      expect(region).toHaveTextContent(label);
    });

    it("waits at least 100ms after appearing, so screen readers see the region before its text", () => {
      const { container } = render(<Progress label={label} value={40} />);
      announce(99);
      expect(status(container)).toHaveTextContent("");
      announce(1);
      expect(status(container)).toHaveTextContent(label);
    });

    it("announces a new label after it changes, but not a new value", () => {
      const { container, rerender } = render(<Progress label={label} value={40} />);
      announce();
      rerender(<Progress label={label} value={80} />);
      expect(status(container)).toHaveTextContent(new RegExp(`^${label}$`));
      rerender(<Progress label="Uploaded resume.pdf" value={100} />);
      expect(status(container)).toHaveTextContent(/^Uploaded resume\.pdf$/);
    });

    it("sends the name and value in the server HTML, with the status region empty", () => {
      const host = serverHtml(<Progress label={label} value={40} valueText="2 of 5 MB" description="About a minute left." />);
      const bar = host.querySelector('[role="progressbar"]');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveAccessibleName(label);
      expect(bar).toHaveAccessibleDescription("About a minute left.");
      expect(bar).toHaveAttribute("aria-valuenow", "40");
      expect(bar).toHaveAttribute("aria-valuetext", "2 of 5 MB");
      expect(host.querySelector(".progress__label")).toHaveTextContent(label);
      expect(status(host)).toHaveTextContent("");
    });

    it("hydrates the server HTML without a mismatch, then announces", () => {
      const element = <Progress label={label} value={40} description="About a minute left." />;
      const host = serverHtml(element);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, element);
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
      expect(host.querySelector('[role="progressbar"]')).toHaveAccessibleName(label);
      expect(status(host)).toHaveTextContent("");
      announce();
      expect(status(host)).toHaveTextContent(label);
    });
  });

  describe("delay", () => {
    it("shows straight away by default, with no delay attribute or style", () => {
      const { container } = render(<Progress label={label} value={40} />);
      expect(outer(container)).not.toHaveAttribute("data-delayed");
      expect(outer(container).style.getPropertyValue("--progress-delay")).toBe("");
    });

    it("passes the delay to the CSS, which hides the bar until it's over", () => {
      const { container } = render(<Progress label={label} value={40} delay={400} />);
      expect(outer(container)).toHaveAttribute("data-delayed");
      expect(outer(container).style.getPropertyValue("--progress-delay")).toBe("400ms");
    });

    it("announces only after the delay", () => {
      const { container } = render(<Progress label={label} value={40} delay={400} />);
      announce(399);
      expect(status(container)).toHaveTextContent("");
      announce(1);
      expect(status(container)).toHaveTextContent(label);
    });

    it("keeps the delay it started with when the prop changes", () => {
      const { container, rerender } = render(<Progress label={label} value={40} delay={400} />);
      rerender(<Progress label={label} value={40} delay={0} />);
      expect(outer(container).style.getPropertyValue("--progress-delay")).toBe("400ms");
    });

    it("treats a negative delay as none", () => {
      const { container } = render(<Progress label={label} value={40} delay={-50} />);
      expect(outer(container)).not.toHaveAttribute("data-delayed");
      announce();
      expect(status(container)).toHaveTextContent(label);
    });

    it("keeps a consumer's style next to the delay", () => {
      const { container } = render(<Progress label={label} value={40} delay={400} style={{ maxWidth: "20rem" }} />);
      expect(outer(container).style.maxWidth).toBe("20rem");
      expect(outer(container).style.getPropertyValue("--progress-delay")).toBe("400ms");
    });
  });

  describe("props", () => {
    it("forwards a ref to the outer div", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<Progress ref={ref} label={label} value={40} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(outer(container));
    });

    it("merges a consumer's className", () => {
      const { container } = render(<Progress label={label} value={40} className="w-64" />);
      expect(outer(container)).toHaveClass("bar", "progress", "w-64");
    });

    it("passes other props through to the outer div", () => {
      const { container } = render(<Progress label={label} value={40} id="upload" data-testid="progress" title="Upload" />);
      const root = outer(container);
      expect(root).toHaveAttribute("id", "upload");
      expect(root).toHaveAttribute("data-testid", "progress");
      expect(root).toHaveAttribute("title", "Upload");
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty", () => {
      render(<Progress label="" value={40} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        '[design-system] Progress: has an empty label, so it doesn\'t say what\'s under way and screen readers announce nothing. Give it a label such as "Uploading resume.pdf…".',
      ]);
    });

    it("warns when the label is only spaces", () => {
      render(<Progress label="   " value={40} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(takeWarnings()).toHaveLength(1);
    });
  });

  describe("types", () => {
    it("requires a label and a value, which can be null", () => {
      expectTypeOf<{ value: number }>().not.toExtend<ProgressProps>();
      expectTypeOf<{ label: string }>().not.toExtend<ProgressProps>();
      expectTypeOf<{ label: string; value: number }>().toExtend<ProgressProps>();
      expectTypeOf<{ label: string; value: null }>().toExtend<ProgressProps>();
    });

    it("takes the label as plain text only", () => {
      expectTypeOf<{ label: ReactElement; value: number }>().not.toExtend<ProgressProps>();
      expectTypeOf<{ label: string; value: string }>().not.toExtend<ProgressProps>();
    });

    it("has no children, role, naming, value, live-region, or hiding props", () => {
      expectTypeOf<ProgressProps>().not.toHaveProperty("children");
      expectTypeOf<ProgressProps>().not.toHaveProperty("role");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-label");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-labelledby");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-describedby");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-valuetext");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-valuenow");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-valuemin");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-valuemax");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-hidden");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-live");
      expectTypeOf<ProgressProps>().not.toHaveProperty("aria-busy");
    });

    it("has no tone", () => {
      expectTypeOf<ProgressProps>().not.toHaveProperty("tone");
    });

    it("only takes the two sizes", () => {
      expectTypeOf<{ label: string; value: number; size: "lg" }>().not.toExtend<ProgressProps>();
    });
  });
});
