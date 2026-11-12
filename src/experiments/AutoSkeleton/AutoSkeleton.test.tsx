import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { AutoSkeleton } from "@/experiments/AutoSkeleton/AutoSkeleton";
import { classify, isToken, mergeBars } from "@/experiments/AutoSkeleton/shapes";
import type { Line } from "@/experiments/AutoSkeleton/shapes";

const label = "Loading applications…";

function Content() {
  return (
    <article>
      <h3>Senior frontend engineer</h3>
      <button type="button">View</button>
    </article>
  );
}

describe("AutoSkeleton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the content as it is when not loading, with nothing around it", () => {
    const { container } = render(
      <AutoSkeleton loading={false} label={label}>
        <Content />
      </AutoSkeleton>,
    );
    expect(container.firstElementChild?.tagName).toBe("ARTICLE");
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("while loading, keeps the content in the page but inert and hidden from screen readers", () => {
    const { container } = render(
      <AutoSkeleton loading label={label}>
        <Content />
      </AutoSkeleton>,
    );
    const content = container.querySelector<HTMLElement>(".auto-skeleton__content")!;
    expect(content).toBeInTheDocument();
    expect(content.querySelector("h3")).toHaveTextContent("Senior frontend engineer");
    expect(content).toHaveAttribute("inert");
    expect(content).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
    expect(container.querySelector(".auto-skeleton__overlay")).toHaveAttribute("aria-hidden", "true");
  });

  it("announces its label once, through Skeleton", () => {
    render(
      <AutoSkeleton loading label={label}>
        <Content />
      </AutoSkeleton>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("status")).toHaveTextContent(label);
  });

  it("passes delay and className to the skeleton", () => {
    const { container } = render(
      <AutoSkeleton loading label={label} delay={300} className="w-80">
        <Content />
      </AutoSkeleton>,
    );
    const root = container.querySelector<HTMLElement>(".skeleton")!;
    expect(root).toHaveClass("skeleton", "auto-skeleton", "w-80");
    expect(root.style.getPropertyValue("--skeleton-delay")).toBe("300ms");
  });

  it("shows the real content once loading ends", () => {
    const { container, rerender } = render(
      <AutoSkeleton loading label={label}>
        <Content />
      </AutoSkeleton>,
    );
    expect(container.querySelector(".auto-skeleton")).toBeInTheDocument();
    rerender(
      <AutoSkeleton loading={false} label={label}>
        <Content />
      </AutoSkeleton>,
    );
    expect(container.querySelector(".auto-skeleton")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("stops watching the content when it unmounts", () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const { unmount } = render(
      <AutoSkeleton loading label={label}>
        <Content />
      </AutoSkeleton>,
    );
    expect(disconnect).not.toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(2);
    disconnect.mockRestore();
  });
});

describe("shapes", () => {
  /** A computed style with only the properties classify reads */
  function style(overrides: Partial<Record<string, string>>) {
    const values: Record<string, string> = {
      display: "block",
      visibility: "visible",
      opacity: "1",
      clipPath: "none",
      clip: "auto",
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundImage: "none",
      boxShadow: "none",
      ...overrides,
    };
    return { ...values, getPropertyValue: (name: string) => values[name] ?? "" } as unknown as CSSStyleDeclaration;
  }
  const element = (html: string) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host.firstElementChild!;
  };

  it("skips what isn't seen: hidden, transparent, and clipped elements", () => {
    const div = element("<div></div>");
    expect(classify(div, style({ display: "none" }))).toBe("skip");
    expect(classify(div, style({ visibility: "hidden" }))).toBe("skip");
    expect(classify(div, style({ opacity: "0" }))).toBe("skip");
    expect(classify(div, style({ clipPath: "inset(50%)" }))).toBe("skip");
    expect(classify(div, style({ clip: "rect(0px, 0px, 0px, 0px)" }))).toBe("skip");
  });

  it("makes images and controls one box, by tag or role", () => {
    expect(classify(element("<img alt=''>"), style({}))).toBe("box");
    expect(classify(element("<button></button>"), style({}))).toBe("box");
    expect(classify(element("<input>"), style({}))).toBe("box");
    expect(classify(element("<span role='checkbox'></span>"), style({ display: "inline-flex" }))).toBe("box");
  });

  it("notices an element's own look: a fill, a visible edge, or a shadow", () => {
    expect(classify(element("<span></span>"), style({ backgroundColor: "rgb(240, 240, 240)" }))).toBe("decorated");
    expect(classify(element("<li></li>"), style({ boxShadow: "rgb(0, 0, 0) 4px 4px 0px 0px" }))).toBe("decorated");
    const edged = style({ "border-top-width": "1px", "border-top-style": "solid", "border-top-color": "rgb(0, 0, 0)" });
    expect(classify(element("<div></div>"), edged)).toBe("decorated");
  });

  it("counts an element with a look as a container when a control or another filled element is inside", () => {
    const attached = (html: string) => {
      const host = document.createElement("div");
      host.innerHTML = html;
      document.body.append(host);
      onTestFinished(() => host.remove());
      return host.firstElementChild!;
    };
    expect(isToken(attached("<span>AK <svg><path /></svg></span>"))).toBe(true);
    expect(isToken(attached("<span><img alt=''> Ada</span>"))).toBe(true);
    expect(isToken(attached("<li>Role <button>View</button></li>"))).toBe(false);
    expect(isToken(attached("<li>Role <span role='switch'></span></li>"))).toBe(false);
    expect(isToken(attached("<li>Role <span style='background: rgb(240, 240, 240)'>Offer</span></li>"))).toBe(false);
  });

  it("reads into plain elements with no look of their own", () => {
    expect(classify(element("<p></p>"), style({}))).toBe("content");
    const invisibleEdge = style({ "border-top-width": "1px", "border-top-style": "solid", "border-top-color": "rgba(0, 0, 0, 0)" });
    expect(classify(element("<div></div>"), invisibleEdge)).toBe("content");
  });

  it("joins bars that touch on one line, and keeps separate lines apart", () => {
    const bar = (x: number, y: number, width: number): Line => ({ kind: "line", x, y, width, height: 16 });
    expect(mergeBars([bar(0, 0, 100), bar(100, 0, 40), bar(0, 24, 80)])).toEqual([bar(0, 0, 140), bar(0, 24, 80)]);
    expect(mergeBars([bar(0, 0, 100), bar(150, 0, 40)])).toEqual([bar(0, 0, 100), bar(150, 0, 40)]);
  });
});
