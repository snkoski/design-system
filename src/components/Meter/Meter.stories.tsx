import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Meter } from "./Meter";
import type { MeterProps } from "./Meter";

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

/**
 * How much of the track the fill covers, from 0 to 100, measured on screen inside the track's edges. In a
 * right-to-left page the fill grows from the right.
 */
function covered(meter: HTMLElement) {
  const track = meter.querySelector<HTMLElement>(".meter__track")!;
  const fill = meter.querySelector<HTMLElement>(".meter__fill")!.getBoundingClientRect();
  const box = track.getBoundingClientRect();
  const left = box.left + track.clientLeft;
  const right = left + track.clientWidth;
  const rtl = getComputedStyle(track).direction === "rtl";
  const shown = rtl ? right - Math.max(fill.left, left) : Math.min(fill.right, right) - left;
  return (Math.max(shown, 0) / track.clientWidth) * 100;
}

/** Checks every meter's fill covers its value's share of the track */
function expectFills(canvasElement: HTMLElement) {
  const meters = [...canvasElement.querySelectorAll<HTMLElement>(".meter")];
  expect(meters.length).toBeGreaterThan(0);
  for (const meter of meters) {
    const bar = meter.querySelector<HTMLElement>('[role="meter"]')!;
    const min = Number(bar.getAttribute("aria-valuemin"));
    const max = Number(bar.getAttribute("aria-valuemax"));
    const now = Number(bar.getAttribute("aria-valuenow"));
    expect(covered(meter)).toBeCloseTo(((now - min) / (max - min)) * 100, 0);
  }
}

const fills = { neutral: "--action", success: "--success", warning: "--warning", danger: "--danger" };

/** Real examples, one per tone. The words always say the status; the color only adds to them. */
const examples: MeterProps[] = [
  { label: "Topics done", value: 12, max: 20, valueText: "12 of 20" },
  { label: "Applications this week", value: 5, max: 5, valueText: "5 of 5", tone: "success", description: "Weekly goal met." },
  { label: "Storage used", value: 4.6, max: 5, valueText: "4.6 of 5 GB", tone: "warning", description: "Almost full. Delete old files to make room." },
  { label: "Free trial used", value: 14, max: 14, valueText: "14 of 14 days", tone: "danger", description: "Your trial has ended. Choose a plan to keep your projects." },
];

function Matrix() {
  return (
    <div className="grid w-80 gap-6">
      {(["md", "sm"] as const).map((size) =>
        examples.map((example) => <Meter key={`${size}-${example.label}`} {...example} size={size} />),
      )}
      <Meter label="Profile complete" value={60} />
    </div>
  );
}

const meta = {
  title: "Components/Meter",
  component: Meter,
  args: { label: "Topics done", value: 12, max: 20, valueText: "12 of 20", tone: "neutral", size: "md", className: "w-80" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "success", "warning", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    value: { control: { type: "number", step: 1 } },
  },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. Moving the value slides the fill. */
export const Playground: Story = {};

/**
 * Every tone at both sizes, and the default value text, a percent. The bar is 8px thick at `md` and 4px at `sm`,
 * with a mouse or on touch: nothing here can be clicked, so nothing grows for a finger.
 */
export const States: Story = {
  render: () => <Matrix />,
  play: async ({ canvasElement }) => {
    expectFills(canvasElement);
    const check = () => {
      for (const meter of canvasElement.querySelectorAll<HTMLElement>(".meter")) {
        const track = meter.querySelector<HTMLElement>(".meter__track")!;
        const token = meter.dataset.size === "sm" ? "--space-1" : "--space-2";
        // The size is the fill's height, inside any edge
        expect(track.clientHeight).toBeCloseTo(measure(token, meter), 1);
        expect(meter.querySelector<HTMLElement>(".meter__fill")!.getBoundingClientRect().height).toBeCloseTo(track.clientHeight, 1);
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

/**
 * A tone colors the fill for a status: `success`, `warning`, or `danger`. The words say the status too, in
 * `valueText` or `description`, because color never says it alone.
 */
export const Tones: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      {examples.map((example) => (
        <Meter key={example.label} {...example} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const meter of canvasElement.querySelectorAll<HTMLElement>(".meter")) {
      const tone = meter.dataset.tone as keyof typeof fills;
      const fill = meter.querySelector<HTMLElement>(".meter__fill")!;
      expect(getComputedStyle(fill).backgroundColor).toBe(tokenColor(fills[tone], meter));
    }
  },
};

/** `sm` is a 4px bar for tight spaces, such as a table cell; `md` is 8px. The text is the same size in both. */
export const Sizes: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <Meter label="Topics done" value={12} max={20} valueText="12 of 20" size="md" />
      <Meter label="Topics done" value={12} max={20} valueText="12 of 20" size="sm" />
    </div>
  ),
};

/** A description says what the amount means or what to do about it. Screen readers read it as the meter's description. */
export const WithDescription: Story = {
  args: {
    label: "Storage used",
    value: 4.6,
    max: 5,
    valueText: "4.6 of 5 GB",
    tone: "warning",
    description: "Almost full. Delete old files to make room.",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("meter", { name: "Storage used" })).toHaveAccessibleDescription("Almost full. Delete old files to make room.");
  },
};

/** A long label wraps onto more lines; the value stays on one line beside it. */
export const Wrapping: Story = {
  render: () => <Meter className="w-48" label="Applications sent to companies on your shortlist" value={12} max={20} valueText="12 of 20" />,
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector<HTMLElement>(".meter__label")!;
    const value = canvasElement.querySelector<HTMLElement>(".meter__value")!;
    const line = parseFloat(getComputedStyle(value).lineHeight);
    expect(label.getBoundingClientRect().height).toBeGreaterThan(line * 1.5);
    expect(value.getBoundingClientRect().height).toBeCloseTo(line, 0);
    // Nothing spills out of the meter's width
    const meter = canvasElement.querySelector<HTMLElement>(".meter")!;
    expect(meter.scrollWidth).toBeLessThanOrEqual(meter.clientWidth);
  },
};

/** In a right-to-left page, the label is on the right and the fill grows from the right. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="w-80">
      <Meter label="المواضيع المكتملة" value={12} max={20} valueText="12 من 20" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const meter = canvasElement.querySelector<HTMLElement>(".meter")!;
    const track = meter.querySelector<HTMLElement>(".meter__track")!.getBoundingClientRect();
    const fill = meter.querySelector<HTMLElement>(".meter__fill")!.getBoundingClientRect();
    // The fill is as wide as the track and shifted toward the right, where the track clips it: its visible part
    // runs from 40% along to the right end
    expect(fill.left).toBeCloseTo(track.left + track.width * 0.4, 0);
    expect(fill.right).toBeGreaterThanOrEqual(track.right);
    expect(covered(meter)).toBeCloseTo(60, 0);
  },
};

/** Every tone and size in all three themes at once. Chromatic snapshots this one. */
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
      for (const meter of section.querySelectorAll<HTMLElement>(".meter")) {
        const tone = meter.dataset.tone as keyof typeof fills;
        expect(getComputedStyle(meter.querySelector(".meter__fill")!).backgroundColor).toBe(tokenColor(fills[tone], section));
        expect(getComputedStyle(meter.querySelector(".meter__track")!).backgroundColor).toBe(tokenColor("--track", section));
      }
    }
    // Hot dog mode: a thick ink edge around every track, outside the fill
    const hotdog = canvasElement.querySelector<HTMLElement>("section[data-theme=hotdog]")!;
    for (const track of hotdog.querySelectorAll<HTMLElement>(".meter__track")) {
      const style = getComputedStyle(track);
      expect(style.borderTopWidth).toBe("2px");
      expect(style.borderTopColor).toBe(tokenColor("--ink", hotdog));
    }
    const light = canvasElement.querySelector<HTMLElement>("section[data-theme=light] .meter__track")!;
    expect(getComputedStyle(light).borderTopWidth).toBe("0px");
  },
};
