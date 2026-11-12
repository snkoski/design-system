import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import type { SkeletonProps } from "@/components/Skeleton/Skeleton";
import { SkeletonItem } from "@/components/Skeleton/SkeletonItem";

/** A time token in seconds, as the browser reads it, from a probe inside `parent` (so data-motion reaches it) */
function seconds(token: string, parent: Element) {
  const probe = document.createElement("div");
  probe.style.transitionDuration = `var(${token})`;
  parent.append(probe);
  const value = parseFloat(getComputedStyle(probe).transitionDuration);
  probe.remove();
  return value;
}

/**
 * One row of a list of applications: an avatar, a name, and a line of detail. Plain JSX rather than a component, so
 * Storybook's code panel shows every shape and the example can be copied.
 */
const listRow = (
  <div className="flex items-center gap-3">
    <SkeletonItem shape="circle" className="size-10" />
    <div className="grid flex-1 gap-1">
      <SkeletonItem className="text-body w-1/2" />
      <SkeletonItem className="text-small" />
    </div>
  </div>
);

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  args: { label: "Loading applications…", delay: 0 },
  argTypes: { delay: { control: { type: "number", min: 0, step: 100 } } },
  render: (args) => (
    <Skeleton {...args} className="grid w-80 gap-4">
      {listRow}
      {listRow}
      {listRow}
    </Skeleton>
  ),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change the label and delay in the Controls panel. The label is never shown: screen readers announce it. */
export const Playground: Story = {};

/**
 * Every shape: one line of text, a paragraph of three lines (the last shorter), a box, and a circle, inside one
 * Skeleton. Each line of text is one line of its text style tall, with a bar as tall as that text's letters.
 */
export const States: Story = {
  render: (args) => (
    <Skeleton {...args} className="grid w-80 gap-4">
      <SkeletonItem className="text-heading-md w-2/3" />
      <SkeletonItem lines={3} className="text-body" />
      <SkeletonItem shape="box" className="h-24" />
      <SkeletonItem shape="circle" className="size-12" />
    </Skeleton>
  ),
  play: async ({ canvasElement }) => {
    const [line, paragraph, box, circle] = [...canvasElement.querySelectorAll<HTMLElement>(".skeleton-item")];
    const style = getComputedStyle(paragraph!);
    const lineHeight = parseFloat(style.lineHeight);
    // A paragraph of three lines is three lines of its text tall, each bar as tall as its letters
    expect(paragraph!.getBoundingClientRect().height).toBeCloseTo(lineHeight * 3, 0);
    const bars = [...paragraph!.querySelectorAll<HTMLElement>(".skeleton-item__line")];
    expect(bars).toHaveLength(3);
    for (const bar of bars) expect(bar.getBoundingClientRect().height).toBeCloseTo(parseFloat(style.fontSize), 0);
    // The last of several lines is shorter; a single line isn't
    expect(bars[2]!.getBoundingClientRect().width).toBeLessThan(bars[0]!.getBoundingClientRect().width);
    const single = line!.querySelector<HTMLElement>(".skeleton-item__line")!;
    expect(single.getBoundingClientRect().width).toBe(line!.getBoundingClientRect().width);
    // A box fills its container's width; a circle is round and square
    expect(box!.getBoundingClientRect().width).toBe(box!.parentElement!.getBoundingClientRect().width);
    expect(circle!.getBoundingClientRect().width).toBe(circle!.getBoundingClientRect().height);
    expect(getComputedStyle(circle!).borderRadius).not.toBe("0px");
    // Every shape pulses, one pulse every two loops
    for (const item of [line, paragraph, box, circle]) {
      const animation = getComputedStyle(item!);
      expect(animation.animationName).toBe("skeleton-pulse");
      expect(parseFloat(animation.animationDuration)).toBeCloseTo(seconds("--duration-loop", item!) * 2, 3);
    }
  },
};

/**
 * Put a text shape in the text style of the text it stands in for, and it matches that text's height. Here each
 * real line sits beside its skeleton.
 */
export const MatchingText: Story = {
  render: (args) => (
    <Skeleton {...args} className="grid w-[36rem] grid-cols-[max-content_1fr] items-start gap-x-6 gap-y-4">
      <p className="text-heading-md">Frontend engineer</p>
      <SkeletonItem className="text-heading-md" />
      <p className="text-body">Applied on 3 November</p>
      <SkeletonItem className="text-body" />
      <p className="text-small">Last updated 2 days ago</p>
      <SkeletonItem className="text-small" />
    </Skeleton>
  ),
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll<HTMLElement>(".skeleton-item")];
    expect(items).toHaveLength(3);
    for (const item of items) {
      // One line of the real text beside it: the same height as that text's line
      const text = item.previousElementSibling as HTMLElement;
      const line = parseFloat(getComputedStyle(text).lineHeight);
      expect(text.getBoundingClientRect().height).toBeCloseTo(line, 0);
      expect(item.getBoundingClientRect().height).toBeCloseTo(line, 0);
    }
  },
};

/**
 * Pressing the button loads for two seconds. With a `delay`, the skeleton stays invisible and silent until the delay
 * is over, then fades in and is announced, so a load that finishes sooner never flashes it. Also the story to test
 * with a screen reader: press the button and listen for the label, once.
 */
export const Delay: Story = {
  args: { delay: 400 },
  render: (args) => <LoadDemo {...args} />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Load applications" }));
    const skeleton = canvasElement.querySelector<HTMLElement>(".skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(Number(getComputedStyle(skeleton!).opacity)).toBeLessThan(1);
    expect(canvas.getByRole("status")).toHaveTextContent("");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Loading applications…"));
    await waitFor(() => expect(getComputedStyle(skeleton!).opacity).toBe("1"));
  },
};

/**
 * With reduced motion, the pulse slows (one every 3.2 seconds instead of 1.4) but never stops, so it still shows
 * that something is happening. The right one is set to reduced motion with `data-motion`.
 */
export const ReducedMotion: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-8">
      {(["full", "reduced"] as const).map((motion) => (
        <div key={motion} data-motion={motion} className="w-56">
          <Skeleton {...args} label={motion === "full" ? "Loading applications…" : "Loading contacts…"} className="grid gap-2">
            <SkeletonItem lines={3} className="text-body" />
          </Skeleton>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll<HTMLElement>(".skeleton-item")];
    expect(items).toHaveLength(2);
    const [full, reduced] = items.map((item) => parseFloat(getComputedStyle(item).animationDuration)) as [number, number];
    expect(full).toBeCloseTo(seconds("--duration-loop", items[0]!) * 2, 3);
    expect(reduced).toBeCloseTo(seconds("--duration-loop", items[1]!) * 2, 3);
    expect(reduced).toBeGreaterThan(full);
  },
};

/** Every shape in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <div className="flex flex-wrap items-start gap-8">
            <Skeleton {...args} className="grid w-72 gap-4">
              <SkeletonItem className="text-heading-md w-2/3" />
              <SkeletonItem lines={3} className="text-body" />
              <SkeletonItem shape="box" className="h-24" />
              <SkeletonItem shape="circle" className="size-12" />
            </Skeleton>
            <div className="w-72 rounded-lg p-4" style={{ background: "var(--surface)" }}>
              <Skeleton {...args} label="Loading contacts…" className="grid gap-4">
                {listRow}
                {listRow}
                {listRow}
              </Skeleton>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Hot dog mode gives every shape a thin ink edge; the other themes' edges are transparent
    const hotdog = canvasElement.querySelector<HTMLElement>("section[data-theme=hotdog]")!;
    const probe = document.createElement("span");
    probe.style.color = "var(--ink)";
    hotdog.append(probe);
    const ink = getComputedStyle(probe).color;
    probe.remove();
    const box = hotdog.querySelector<HTMLElement>('.skeleton-item[data-shape="box"]')!;
    expect(getComputedStyle(box).borderTopColor).toBe(ink);
    // A text line gets it through the custom property it inherits from its shape
    const line = hotdog.querySelector<HTMLElement>(".skeleton-item__line")!;
    expect(getComputedStyle(line).borderTopColor).toBe(ink);
    const light = canvasElement.querySelector<HTMLElement>('section[data-theme=light] .skeleton-item[data-shape="box"]')!;
    expect(getComputedStyle(light).borderTopColor).toBe("rgba(0, 0, 0, 0)");
  },
};

/** A list that takes two seconds to load, the way a page waits for its data */
function LoadDemo(props: SkeletonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => setState("done"), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <div className="grid w-80 justify-items-stretch gap-4">
      <Button variant="secondary" onClick={() => setState("loading")} className="justify-self-start">
        Load applications
      </Button>
      <div className="min-h-44">
        {state === "loading" && (
          <Skeleton {...props} className="grid gap-4">
            {listRow}
            {listRow}
            {listRow}
          </Skeleton>
        )}
        {state === "done" && (
          <ul className="grid gap-2">
            <li>Frontend engineer</li>
            <li>Design systems lead</li>
            <li>Product designer</li>
          </ul>
        )}
      </div>
    </div>
  );
}
