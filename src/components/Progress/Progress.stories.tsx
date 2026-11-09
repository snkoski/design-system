import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { Button } from "../Button";
import { Progress } from "./Progress";

/** The px value of a length token, measured in the browser, from a probe inside `parent` so its pointer mode applies */
function measure(token: string, parent: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** A color token as the browser computes it, from a probe inside `parent` so its theme applies */
function tokenColor(token: string, parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  parent.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Two loops of --duration-loop, as the browser computes it inside `parent`, so its data-motion applies */
function twoLoops(parent: Element) {
  const probe = document.createElement("div");
  probe.style.transitionDuration = "calc(var(--duration-loop) * 2)";
  parent.append(probe);
  const value = getComputedStyle(probe).transitionDuration;
  probe.remove();
  return value;
}

/** How much of the track a determinate fill covers, from 0 to 100, measured on screen inside the track's edges */
function covered(progress: HTMLElement) {
  const track = progress.querySelector<HTMLElement>(".progress__track")!;
  const fill = progress.querySelector<HTMLElement>(".progress__fill")!.getBoundingClientRect();
  const left = track.getBoundingClientRect().left + track.clientLeft;
  const right = left + track.clientWidth;
  const rtl = getComputedStyle(track).direction === "rtl";
  const shown = rtl ? right - Math.max(fill.left, left) : Math.min(fill.right, right) - left;
  return (Math.max(shown, 0) / track.clientWidth) * 100;
}

/** Checks every determinate bar's fill covers its value's share of the track */
function expectFills(canvasElement: HTMLElement) {
  const bars = [...canvasElement.querySelectorAll<HTMLElement>(".progress")].filter((bar) =>
    bar.querySelector('[role="progressbar"]')!.hasAttribute("aria-valuenow"),
  );
  expect(bars.length).toBeGreaterThan(0);
  for (const bar of bars) {
    const element = bar.querySelector<HTMLElement>('[role="progressbar"]')!;
    const min = Number(element.getAttribute("aria-valuemin"));
    const max = Number(element.getAttribute("aria-valuemax"));
    const now = Number(element.getAttribute("aria-valuenow"));
    expect(covered(bar)).toBeCloseTo(((now - min) / (max - min)) * 100, 0);
  }
}

/**
 * Where a sliding fill is at the start of its loop and halfway through, read by pausing its animation, so the
 * check never depends on when it runs. Returns the fill's left edge at each point.
 */
function slide(progress: HTMLElement) {
  const fill = progress.querySelector<HTMLElement>(".progress__fill")!;
  const animation = fill.getAnimations().find((each) => (each as CSSAnimation).animationName?.startsWith("progress-slide"));
  expect(animation).toBeDefined();
  animation!.pause();
  const duration = Number(animation!.effect!.getComputedTiming().duration);
  animation!.currentTime = 0;
  const start = fill.getBoundingClientRect().left;
  animation!.currentTime = duration / 2;
  const middle = fill.getBoundingClientRect().left;
  animation!.play();
  return { start, middle, track: fill.parentElement!.getBoundingClientRect() };
}

function Matrix() {
  return (
    <div className="grid w-80 gap-6">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="grid gap-6">
          <Progress size={size} label="Uploading resume.pdf…" value={40} />
          <Progress size={size} label="Importing contacts…" value={3} max={10} valueText="3 of 10 files" description="About a minute left." />
          <Progress size={size} label="Uploaded resume.pdf" value={100} />
          <Progress size={size} label="Loading applications…" value={null} />
        </div>
      ))}
      <Progress label="Refreshing applications…" value={null} hideLabel />
    </div>
  );
}

const meta = {
  title: "Components/Progress",
  component: Progress,
  args: { label: "Uploading resume.pdf…", value: 40, size: "md", hideLabel: false, delay: 0, className: "w-80" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. Moving the value slides the fill. */
export const Playground: Story = {};

/**
 * Under way, with words, done, and not knowing how long, at both sizes, and one with its label hidden. The bar is
 * 8px thick at `md` and 4px at `sm`, with a mouse or on touch: nothing here can be clicked.
 */
export const States: Story = {
  render: () => <Matrix />,
  play: async ({ canvasElement }) => {
    expectFills(canvasElement);
    const check = () => {
      for (const bar of canvasElement.querySelectorAll<HTMLElement>(".progress")) {
        const track = bar.querySelector<HTMLElement>(".progress__track")!;
        const token = bar.dataset.size === "sm" ? "--space-1" : "--space-2";
        expect(track.clientHeight).toBeCloseTo(measure(token, bar), 1);
        expect(bar.querySelector<HTMLElement>(".progress__fill")!.getBoundingClientRect().height).toBeCloseTo(track.clientHeight, 1);
      }
    };
    check();
    canvasElement.dataset.pointer = "coarse";
    try {
      check();
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Counts up to 100 over about four seconds; "Upload again" starts over. The label changes when it's done. */
function Upload() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (value >= 100) return;
    const timer = setTimeout(() => setValue((current) => Math.min(100, current + 4)), 160);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <div className="grid w-80 justify-items-start gap-4">
      <Progress className="w-full" label={value >= 100 ? "Uploaded resume.pdf" : "Uploading resume.pdf…"} value={value} />
      <Button variant="secondary" size="sm" onClick={() => setValue(0)}>
        Upload again
      </Button>
    </div>
  );
}

/**
 * A real upload: the fill glides from step to step. Screen readers hear "Uploading resume.pdf…" when it appears and
 * "Uploaded resume.pdf" when the label changes, but not every step in between.
 */
export const Uploading: Story = {
  render: () => <Upload />,
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", { name: "Uploading resume.pdf…" });
    await waitFor(() => expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
  },
};

/**
 * `value={null}` while it doesn't know how long: a short fill slides from the start to the end, over and over. Set a
 * number as soon as there is one.
 */
export const Indeterminate: Story = {
  args: { label: "Loading applications…", value: null },
  play: async ({ canvasElement }) => {
    const { start, middle, track } = slide(canvasElement.querySelector<HTMLElement>(".progress")!);
    // It starts just off the start edge and moves toward the end
    expect(start).toBeLessThan(track.left);
    expect(middle).toBeGreaterThan(start);
  },
};

/**
 * `hideLabel` for a bar with no room for words, such as along the top edge of a card. Screen readers still hear the
 * label and the value.
 */
export const HiddenLabel: Story = {
  render: () => (
    <div className="grid w-80 overflow-hidden" style={{ border: "var(--border-thin) solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
      <Progress label="Refreshing applications…" value={null} size="sm" hideLabel />
      <div className="grid gap-1 p-4">
        <h3 className="text-body-strong">Applications</h3>
        <p className="text-small">12 in progress</p>
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("progressbar", { name: "Refreshing applications…" })).toBeInTheDocument();
    // Only the track takes room: the hidden label adds no height
    const bar = canvasElement.querySelector<HTMLElement>(".progress")!;
    const track = bar.querySelector<HTMLElement>(".progress__track")!;
    expect(bar.getBoundingClientRect().height).toBeCloseTo(track.getBoundingClientRect().height, 0);
  },
};

/** `delay` waits before showing and announcing the bar, then fades it in, so a quick task never flashes it. */
export const Delay: Story = {
  args: { label: "Exporting applications…", value: 30, delay: 600 },
  play: async ({ canvas, canvasElement }) => {
    const bar = canvasElement.querySelector<HTMLElement>(".progress");
    expect(bar).toBeInTheDocument();
    expect(Number(getComputedStyle(bar!).opacity)).toBeLessThan(1);
    expect(canvas.getByRole("status")).toHaveTextContent("");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Exporting applications…"));
    await waitFor(() => expect(getComputedStyle(bar!).opacity).toBe("1"));
  },
};

/** `md` is an 8px bar; `sm` is 4px, for tight spaces such as along the top of a card. The text is the same size in both. */
export const Sizes: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <Progress label="Uploading resume.pdf…" value={40} size="md" />
      <Progress label="Uploading resume.pdf…" value={40} size="sm" />
    </div>
  ),
};

/** A long label, such as a file name, wraps onto more lines; the value stays on one line beside it. */
export const Wrapping: Story = {
  render: () => <Progress className="w-48" label="Uploading cover-letter-senior-frontend-engineer.pdf…" value={40} />,
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector<HTMLElement>(".progress__label")!;
    const value = canvasElement.querySelector<HTMLElement>(".progress__value")!;
    const line = parseFloat(getComputedStyle(value).lineHeight);
    expect(label.getBoundingClientRect().height).toBeGreaterThan(line * 1.5);
    expect(value.getBoundingClientRect().height).toBeCloseTo(line, 0);
    const bar = canvasElement.querySelector<HTMLElement>(".progress")!;
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  },
};

/**
 * Under reduced motion, a bar that doesn't know how long still slides, more slowly: every two loops of
 * `--duration-loop`, which is 1.4s normally and 3.2s with reduced motion. A frozen one would look broken.
 */
export const ReducedMotion: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <div data-motion="full">
        <Progress label="Loading applications…" value={null} />
      </div>
      <div data-motion="reduced">
        <Progress label="Loading contacts…" value={null} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fills = [...canvasElement.querySelectorAll<HTMLElement>(".progress__fill")];
    expect(fills).toHaveLength(2);
    const [full, reduced] = fills.map((fill) => getComputedStyle(fill)) as [CSSStyleDeclaration, CSSStyleDeclaration];
    expect(full.animationName).toBe("progress-slide");
    expect(reduced.animationName).toBe("progress-slide");
    // Each slides once every two loops, as its own data-motion sets them, and reduced is slower
    expect(full.animationDuration).toBe(twoLoops(fills[0]!.parentElement!));
    expect(reduced.animationDuration).toBe(twoLoops(fills[1]!.parentElement!));
    expect(parseFloat(reduced.animationDuration)).toBeGreaterThan(parseFloat(full.animationDuration));
  },
};

/** In a right-to-left page, the fill grows from the right, and a sliding fill moves from right to left. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="grid w-80 gap-6">
      <Progress label="جارٍ رفع الملف…" value={40} />
      <Progress label="جارٍ تحميل الطلبات…" value={null} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [determinate, indeterminate] = canvasElement.querySelectorAll<HTMLElement>(".progress");
    expect(covered(determinate!)).toBeCloseTo(40, 0);
    const { start, middle, track } = slide(indeterminate!);
    expect(start).toBeGreaterThanOrEqual(track.right - 1);
    expect(middle).toBeLessThan(start);
  },
};

/** Every size and state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Matrix />
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    expectFills(canvasElement);
    for (const section of canvasElement.querySelectorAll<HTMLElement>("section[data-theme]")) {
      for (const bar of section.querySelectorAll<HTMLElement>(".progress")) {
        expect(getComputedStyle(bar.querySelector(".progress__fill")!).backgroundColor).toBe(tokenColor("--action", section));
        expect(getComputedStyle(bar.querySelector(".progress__track")!).backgroundColor).toBe(tokenColor("--track", section));
      }
    }
    const hotdog = canvasElement.querySelector<HTMLElement>("section[data-theme=hotdog]")!;
    for (const track of hotdog.querySelectorAll<HTMLElement>(".progress__track")) {
      expect(getComputedStyle(track).borderTopWidth).toBe("2px");
      expect(getComputedStyle(track).borderTopColor).toBe(tokenColor("--ink", hotdog));
    }
  },
};
