import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUp } from "lucide-react";
import { expect } from "storybook/test";
import { Spin } from "@/experiments/Spin/Spin";

function Bar() {
  return (
    <span style={{ display: "block", width: "0.375rem", height: "2rem", borderRadius: "var(--radius-full)", background: "var(--brand)" }} />
  );
}

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };
const emoji = ["🌭", "🦄", "👀", "✨", "🔥", "🍕", "🐱", "🌀", "⭐", "🍩"];

/** Which way an element's content faces, in degrees from 0, read from its computed transform */
function facing(spin: Element) {
  const transform = getComputedStyle(spin.querySelector(".spin__content")!).transform;
  if (transform === "none") return 0;
  const [a, b] = transform.match(/-?[\d.e-]+/g)!.map(Number);
  return Math.round(((Math.atan2(b!, a!) * 180) / Math.PI + 360) % 360);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const meta = {
  title: "Experiments/Spin",
  component: Spin,
  parameters: { layout: "fullscreen" },
  args: { speed: 2, duration: 1000, easing: "ease-out (now)", direction: "clockwise", upright: true, label: "Spin", children: <span style={{ fontSize: "3rem" }}>🌭</span> },
  argTypes: {
    children: { control: false },
    ref: { control: false },
    speed: { control: { type: "range", min: 0.25, max: 10, step: 0.25 } },
    duration: { control: { type: "range", min: 100, max: 10000, step: 100 } },
    easing: {
      control: "select",
      options: ["ease-out (now)", "ease-in-out", "ease-in", "ease-bounce", "linear"],
      mapping: {
        "ease-out (now)": "var(--ease-out)",
        "ease-in-out": "var(--ease-in-out)",
        "ease-in": "var(--ease-in)",
        "ease-bounce": "var(--ease-bounce)",
        linear: "linear",
      },
    },
  },
} satisfies Meta<typeof Spin>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click it (or Tab to it and press Space). Change the speed, duration, easing, and direction in the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <div className="grid place-items-center" style={page}>
      <Spin {...args} className="size-24" />
    </div>
  ),
};

/** A grid of emoji. Click any of them; each spins on its own, and the speed and duration controls apply to all. */
export const EmojiGrid: Story = {
  render: ({ children: _children, label: _label, ...args }) => (
    <div className="grid place-items-center p-8" style={page}>
      <div className="grid grid-cols-5 gap-4">
        {emoji.map((choice) => (
          <Spin key={choice} {...args} label={`Spin ${choice}`} className="size-20">
            <span style={{ fontSize: "2.5rem" }}>{choice}</span>
          </Spin>
        ))}
      </div>
    </div>
  ),
};

/** A grid of bars. With upright off, each one stops wherever its spin ends. */
export const BarGrid: Story = {
  args: { upright: false, speed: 1.3 },
  render: ({ children: _children, label: _label, ...args }) => (
    <div className="grid place-items-center p-8" style={page}>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(10, 3rem)" }}>
        {Array.from({ length: 40 }, (_, index) => (
          <Spin key={index} {...args} label={`Spin bar ${index + 1}`} className="size-12">
            <Bar />
          </Spin>
        ))}
      </div>
    </div>
  ),
};

/** Arrows that spin the other way. */
export const Counterclockwise: Story = {
  args: { direction: "counterclockwise" },
  render: ({ children: _children, label: _label, ...args }) => (
    <div className="grid place-items-center p-8" style={page}>
      <div className="flex gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Spin key={index} {...args} label={`Spin arrow ${index + 1}`} className="size-16">
            <ArrowUp size={36} strokeWidth={2.5} />
          </Spin>
        ))}
      </div>
    </div>
  ),
};

/** A long, slowing spin that stops wherever it lands, like a prize wheel. */
export const PrizeWheel: Story = {
  args: { speed: 3, duration: 4000, upright: false, label: "Spin the wheel", children: <span style={{ fontSize: "6rem" }}>🎡</span> },
  render: (args) => (
    <div className="grid place-items-center" style={page}>
      <Spin {...args} />
    </div>
  ),
};

/** A quick, short spin that lands back upright. The story checks it turns while spinning and ends upright. */
export const QuickSpin: Story = {
  args: { speed: 2, duration: 600, easing: "linear" },
  render: (args) => (
    <div className="grid place-items-center" style={page}>
      <Spin {...args} className="size-24" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const spin = canvas.getByRole("button", { name: "Spin" });
    await expect(facing(spin)).toBe(0);
    await userEvent.click(spin);
    await wait(150); // a quarter of the way through two linear turns: half a turn
    await expect(facing(spin)).not.toBe(0);
    await wait(700);
    await expect(facing(spin)).toBe(0);
    await expect(spin.style.getPropertyValue("--spin-angle")).toBe("720deg");
  },
};

/** With reduced motion (here forced with data-motion="reduced"), clicking doesn't spin it. */
export const ReducedMotion: Story = {
  args: { duration: 600, easing: "linear" },
  render: (args) => (
    <div data-motion="reduced" className="grid place-items-center" style={page}>
      <Spin {...args} className="size-24" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const spin = canvas.getByRole("button", { name: "Spin" });
    await userEvent.click(spin);
    await wait(150);
    await expect(spin.style.getPropertyValue("--spin-angle")).toBe("720deg");
    // A quarter of the way through two linear turns it would face 180 degrees; with reduced motion it hasn't moved
    await expect(facing(spin)).toBe(0);
    await expect(getComputedStyle(spin.querySelector(".spin__content")!).transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  },
};
