import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { expect } from "storybook/test";
import { LookAt } from "./LookAt";

/** A rounded bar, drawn pointing up, so LookAt stands it on end toward the mouse */
function Bar() {
  return (
    <span
      style={{ display: "block", width: "0.375rem", height: "2rem", borderRadius: "var(--radius-full)", background: "var(--action)" }}
    />
  );
}

function Arrow() {
  return <ArrowUp size={28} strokeWidth={2.5} style={{ color: "var(--ink)" }} />;
}

/** Turns the mouse position into a pointermove the page sees, as a real mouse would */
function movePointer(x: number, y: number) {
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
}

/** Which way an element's content faces, in degrees from 0 (up), read from its computed transform */
function facing(look: Element) {
  const transform = getComputedStyle(look.querySelector(".look-at__pointer")!).transform;
  if (transform === "none") return 0;
  const [a, b] = transform.match(/-?[\d.e-]+/g)!.map(Number);
  return Math.round(((Math.atan2(b!, a!) * 180) / Math.PI + 360) % 360);
}

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };

const meta = {
  title: "Experiments/Look at",
  component: LookAt,
  parameters: { layout: "fullscreen" },
  args: { direction: "toward", turnDuration: 120, turnEasing: "ease-out (now)", children: <Arrow /> },
  argTypes: {
    children: { control: false },
    ref: { control: false },
    turnDuration: { control: { type: "range", min: 0, max: 2000, step: 20 } },
    turnEasing: {
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
} satisfies Meta<typeof LookAt>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Move the mouse around the page. Change the direction, turn speed, and easing in the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <div className="grid place-items-center" style={page}>
      <LookAt {...args} className="size-16" />
    </div>
  ),
};

/**
 * Two arrows. Put the mouse between them and they face each other, because each aims from its own center. Forced
 * to full motion with data-motion="full", so they turn even where the system asks for reduced motion.
 */
export const Pair: Story = {
  render: () => (
    <div data-motion="full" className="flex items-center justify-center gap-40" style={page}>
      <LookAt data-testid="left" className="size-16">
        <Arrow />
      </LookAt>
      <LookAt data-testid="right" className="size-16">
        <Arrow />
      </LookAt>
    </div>
  ),
  play: async ({ canvas }) => {
    const left = canvas.getByTestId("left").getBoundingClientRect();
    const right = canvas.getByTestId("right").getBoundingClientRect();
    movePointer((left.right + right.left) / 2, left.top + left.height / 2);
    await new Promise((resolve) => setTimeout(resolve, 300)); // let the turn finish
    await expect(facing(canvas.getByTestId("left"))).toBe(90);
    await expect(facing(canvas.getByTestId("right"))).toBe(270);
  },
};

function Grid({ columns, rows, item }: { columns: number; rows: number; item: (index: number) => ReactNode }) {
  return (
    <div className="grid place-items-center p-8" style={page}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 3rem)` }}>
        {Array.from({ length: columns * rows }, (_, index) => item(index))}
      </div>
    </div>
  );
}

/** A grid of arrows. Each one points at the mouse from where it is. Try a slow turn speed in the Controls panel. */
export const ArrowGrid: Story = {
  render: (args) => (
    <Grid
      columns={10}
      rows={6}
      item={(index) => (
        <LookAt key={index} turnDuration={args.turnDuration} turnEasing={args.turnEasing} className="size-12">
          <Arrow />
        </LookAt>
      )}
    />
  ),
};

/** The same grid of arrows, facing away from the mouse. */
export const AwayGrid: Story = {
  render: (args) => (
    <Grid
      columns={10}
      rows={6}
      item={(index) => (
        <LookAt key={index} direction="away" turnDuration={args.turnDuration} turnEasing={args.turnEasing} className="size-12">
          <Arrow />
        </LookAt>
      )}
    />
  ),
};

/** A grid of bars that stand on end toward the mouse. */
export const BarGrid: Story = {
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <LookAt key={index} turnDuration={args.turnDuration} turnEasing={args.turnEasing} className="size-12">
          <Bar />
        </LookAt>
      )}
    />
  ),
};

/** A checkerboard of toward and away. */
export const Mixed: Story = {
  render: (args) => (
    <Grid
      columns={10}
      rows={6}
      item={(index) => (
        <LookAt key={index} direction={(index + Math.floor(index / 10)) % 2 ? "away" : "toward"} turnDuration={args.turnDuration} turnEasing={args.turnEasing} className="size-12">
          <Arrow />
        </LookAt>
      )}
    />
  ),
};

/** A slow, linear turn: the arrows trail behind the mouse. */
export const SlowTurn: Story = {
  args: { turnDuration: 800, turnEasing: "linear" },
  render: (args) => (
    <Grid
      columns={10}
      rows={6}
      item={(index) => (
        <LookAt key={index} turnDuration={args.turnDuration} turnEasing={args.turnEasing} data-testid={index ? undefined : "first"} className="size-12">
          <Arrow />
        </LookAt>
      )}
    />
  ),
  play: async ({ canvas }) => {
    const pointer = canvas.getByTestId("first").querySelector(".look-at__pointer")!;
    await expect(getComputedStyle(pointer).transitionDuration).toBe("0.8s");
    await expect(getComputedStyle(pointer).transitionTimingFunction).toBe("linear");
  },
};

/** With reduced motion (here forced with data-motion="reduced"), nothing turns: everything keeps pointing up. */
export const ReducedMotion: Story = {
  render: () => (
    <div data-motion="reduced" className="flex items-center justify-center gap-40" style={page}>
      <LookAt data-testid="still" className="size-16">
        <Arrow />
      </LookAt>
    </div>
  ),
  play: async ({ canvas }) => {
    const still = canvas.getByTestId("still").getBoundingClientRect();
    movePointer(still.right + 200, still.top + still.height / 2);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(canvas.getByTestId("still").style.getPropertyValue("--look-angle")).toBe("90deg");
    await expect(facing(canvas.getByTestId("still"))).toBe(0);
  },
};

/** Arrows and bars in all three themes. Chromatic snapshots this one before the mouse has moved, so all point up. */
export const AllThemes: Story = {
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <div className="flex gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <LookAt key={index} className="size-12">
                {index % 2 ? <Bar /> : <Arrow />}
              </LookAt>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
