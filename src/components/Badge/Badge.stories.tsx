import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Clock, TriangleAlert, X } from "lucide-react";
import { expect } from "storybook/test";
import { Badge } from "@/components/Badge/Badge";

/** The px value of a length token, measured in the browser */
function measure(token: string, parent: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.width = `var(${token})`;
  parent.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
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

const icons = { none: undefined, check: <Check />, clock: <Clock />, alert: <TriangleAlert />, x: <X /> };

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Offer", tone: "neutral", size: "md" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "success", "warning", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    icon: { control: "select", options: Object.keys(icons), mapping: icons },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/**
 * Every tone at both sizes, with and without an icon. A badge is as tall as its line of text plus its edge above and
 * below: 23px at `md` and 20px at `sm`, or 2px more in hot dog mode, whose edge is thicker. Its icon is 16px at `md`
 * and 12px at `sm`.
 */
export const States: Story = {
  render: () => <Matrix />,
  play: async ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll<HTMLElement>(".badge")];
    expect(badges).toHaveLength(16);
    for (const badge of badges) {
      const style = getComputedStyle(badge);
      const edges = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      expect(badge.getBoundingClientRect().height).toBeCloseTo(parseFloat(style.lineHeight) + edges, 1);
      const icon = badge.querySelector<HTMLElement>(".badge__icon");
      if (icon) {
        const size = measure(badge.dataset.size === "sm" ? "--icon-xs" : "--icon-sm", canvasElement);
        expect(icon.getBoundingClientRect().width).toBe(size);
        expect(icon.getBoundingClientRect().height).toBe(size);
      }
    }
    expect(measure("--icon-xs", canvasElement)).toBeLessThan(measure("--icon-sm", canvasElement));
  },
};

/**
 * Neutral is the default, and most badges are neutral: different steps or kinds are told apart by their words. A
 * status tone is for a state that went well, needs attention, or went wrong.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge icon={<Clock />}>Applied</Badge>
      <Badge tone="success" icon={<Check />}>Offer</Badge>
      <Badge tone="warning" icon={<TriangleAlert />}>Needs review</Badge>
      <Badge tone="danger" icon={<X />}>Rejected</Badge>
    </div>
  ),
};

/** `md` sits beside body text. `sm` fits tight spots such as table rows and toolbars. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2">
        Frontend engineer <Badge tone="success">Offer</Badge>
      </p>
      <p className="flex items-center gap-2 text-small">
        Design systems lead <Badge size="sm">Phone screen</Badge>
      </p>
    </div>
  ),
};

/**
 * A badge stays on one line while it fits. Wider than its container, it wraps rather than spill out or be cut off,
 * so its words stay readable on a narrow screen or at 200% text, and it becomes a rounded rectangle, so its curve
 * never cuts into the words. Keeping badges to a word or two avoids this. The second is small, with no icon, in hot
 * dog mode, where the thick edge would show the curve crossing the words.
 */
export const Wrapping: Story = {
  render: () => (
    <div className="flex items-start gap-8">
      <div className="w-40">
        <Badge tone="warning" icon={<TriangleAlert />}>Waiting for a reply from the hiring team</Badge>
      </div>
      <section data-theme="hotdog" className="w-28 p-2" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <Badge tone="warning" size="sm">Waiting for a reply from the hiring team</Badge>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll<HTMLElement>(".badge")];
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      const box = badge.getBoundingClientRect();
      const container = badge.parentElement!;
      const padding = parseFloat(getComputedStyle(container).paddingLeft) + parseFloat(getComputedStyle(container).paddingRight);
      expect(box.width).toBeLessThanOrEqual(container.getBoundingClientRect().width - padding);
      // More than one line of text
      expect(box.height).toBeGreaterThan(parseFloat(getComputedStyle(badge).lineHeight) * 1.5);
      // Every line of words sits inside the badge's rounded inner edge, corners included
      const range = document.createRange();
      range.selectNodeContents(badge.querySelector(".badge__label")!);
      const lines = [...range.getClientRects()];
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        for (const [x, y] of [[line.left, line.top], [line.right, line.top], [line.left, line.bottom], [line.right, line.bottom]] as const) {
          expect(insideRoundedEdge(badge, x, y), `(${x}, ${y}) is outside the rounded edge`).toBe(true);
        }
      }
    }
  },
};

/** Whether a point is inside an element's padding box, with its corners rounded to the inner radius */
function insideRoundedEdge(element: HTMLElement, x: number, y: number) {
  const style = getComputedStyle(element);
  const edge = parseFloat(style.borderTopWidth);
  const box = element.getBoundingClientRect();
  const [left, top, right, bottom] = [box.left + edge, box.top + edge, box.right - edge, box.bottom - edge];
  const radius = Math.min(parseFloat(style.borderTopLeftRadius), (box.bottom - box.top) / 2) - edge;
  const slack = 0.5; // sub-pixel rounding
  if (x < left - slack || x > right + slack || y < top - slack || y > bottom + slack) return false;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return Math.hypot(x - cx, y - cy) <= radius + slack;
}

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
    const fills = { neutral: "--track", success: "--success-soft", warning: "--warning-soft", danger: "--danger-soft" };
    const words = { neutral: "--ink", success: "--success", warning: "--warning", danger: "--danger" };
    for (const section of canvasElement.querySelectorAll<HTMLElement>("section[data-theme]")) {
      for (const badge of section.querySelectorAll<HTMLElement>(".badge")) {
        const tone = badge.dataset.tone as keyof typeof fills;
        const style = getComputedStyle(badge);
        // Each tone draws its fill and words with its own tokens, and the icon follows the words
        expect(style.backgroundColor).toBe(tokenColor(fills[tone], section));
        expect(style.color).toBe(tokenColor(words[tone], section));
      }
    }
    // Hot dog mode: a thick ink edge on every badge
    const hotdog = canvasElement.querySelector<HTMLElement>("section[data-theme=hotdog]")!;
    const thick = measure("--border-thick", hotdog);
    const ink = tokenColor("--ink", hotdog);
    for (const badge of hotdog.querySelectorAll<HTMLElement>(".badge")) {
      expect(parseFloat(getComputedStyle(badge).borderTopWidth)).toBe(thick);
      expect(getComputedStyle(badge).borderTopColor).toBe(ink);
    }
  },
};

function Matrix() {
  const tones = [
    ["neutral", "Applied", <Clock key="icon" />],
    ["success", "Offer", <Check key="icon" />],
    ["warning", "Needs review", <TriangleAlert key="icon" />],
    ["danger", "Rejected", <X key="icon" />],
  ] as const;
  return (
    <div className="grid gap-3">
      {(["md", "sm"] as const).flatMap((size) => [
        <div key={`${size}-icon`} className="flex flex-wrap items-center gap-2">
          {tones.map(([tone, words, icon]) => (
            <Badge key={tone} tone={tone} size={size} icon={icon}>{words}</Badge>
          ))}
        </div>,
        <div key={`${size}-plain`} className="flex flex-wrap items-center gap-2">
          {tones.map(([tone, words]) => (
            <Badge key={tone} tone={tone} size={size}>{words}</Badge>
          ))}
        </div>,
      ])}
    </div>
  );
}
