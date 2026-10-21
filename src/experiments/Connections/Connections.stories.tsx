import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Bounce } from "../Bounce/Bounce";
import { Connections } from "./Connections";

const page = { background: "var(--bg)", color: "var(--ink)" };
const emoji = ["🌭", "🦄", "👀", "✨", "🍕", "🐱", "🍩", "⭐"];

/** Black, white, and the painter's primary and secondary colors. The blue and green are paint's, a little muted. */
const paints = {
  black: "hsl(0 0% 0%)",
  white: "hsl(0 0% 100%)",
  red: "hsl(0 100% 50%)",
  yellow: "hsl(60 100% 50%)",
  blue: "hsl(211 57% 38%)",
  orange: "hsl(30 100% 50%)",
  green: "hsl(138 100% 33%)",
  purple: "hsl(300 100% 25%)",
};

/** A ball in its own color, which it also gives its lines. The edge keeps white and black visible in every theme. */
function PaintBall({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "block",
        width: "3rem",
        height: "3rem",
        boxSizing: "border-box",
        borderRadius: "var(--radius-full)",
        border: "var(--border-thin) solid var(--border-strong)",
        background: color,
      }}
    />
  );
}

/** The hue of a pixel on `canvas` at a point in the page, in degrees */
function hueAt(canvas: HTMLCanvasElement, x: number, y: number) {
  const area = canvas.getBoundingClientRect();
  const density = canvas.width / area.width;
  const [r, g, b] = [...canvas.getContext("2d")!.getImageData(Math.round((x - area.left) * density), Math.round((y - area.top) * density), 1, 1).data].map((value) => value / 255);
  const [most, least] = [Math.max(r!, g!, b!), Math.min(r!, g!, b!)];
  if (most === least) return null;
  const hue = most === r ? (g! - b!) / (most - least) : most === g ? 2 + (b! - r!) / (most - least) : 4 + (r! - g!) / (most - least);
  return (hue * 60 + 360) % 360;
}

/** Spread out, but the same every time: the nth of a set's speed, direction, and start */
const spread = (index: number) => ({
  speed: 60 + ((index * 37) % 100),
  angle: (index * 67) % 360,
  startX: ((index * 41) % 100) / 100,
  startY: ((index * 59) % 100) / 100,
});

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** Whether anything is drawn on `canvas` at a point in the page */
function drawnAt(canvas: HTMLCanvasElement, x: number, y: number) {
  const area = canvas.getBoundingClientRect();
  const density = canvas.width / area.width;
  return canvas.getContext("2d")!.getImageData(Math.round((x - area.left) * density), Math.round((y - area.top) * density), 1, 1).data[3]! > 0;
}

const meta = {
  title: "Experiments/Connections",
  component: Connections,
  // The dots are somewhere different every time, so a snapshot would never match
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: true } },
  args: { distance: 120, lineWidth: 1.5, fade: true, selector: ".bounce" },
  argTypes: {
    children: { control: false },
    ref: { control: false },
    distance: { control: "text", description: 'A number of px, or a length such as "15vw", "10vh", "12vmin", or "8rem".' },
    color: { control: "color" },
    lineWidth: { control: { type: "range", min: 0.5, max: 12, step: 0.5 } },
    blend: { control: "select", options: [undefined, "paint", "light"] },
  },
} satisfies Meta<typeof Connections>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dots drifting around. When two come within the distance of each other, a line joins them, fading in as they
 * get closer. Grab a dot to drag or throw it. Try the distance as px, or as "15vw" or "12vmin".
 */
export const Playground: Story = {
  render: (args) => (
    <Connections {...args} className="h-screen overflow-hidden" style={page}>
      {Array.from({ length: 16 }, (_, index) => (
        <Bounce key={index} {...spread(index)} grabbable />
      ))}
    </Connections>
  ),
};

/** Lots of small, slow dots: the classic constellation background. */
export const Constellation: Story = {
  args: { distance: "10vmin", lineWidth: 1, color: "var(--border)" },
  render: (args) => (
    <Connections {...args} className="h-screen overflow-hidden" style={page}>
      {Array.from({ length: 60 }, (_, index) => (
        <Bounce key={index} {...spread(index)} speed={20 + ((index * 13) % 40)} squash={false}>
          <span style={{ display: "block", width: "0.375rem", height: "0.375rem", borderRadius: "var(--radius-full)", background: "var(--ink-muted)" }} />
        </Bounce>
      ))}
    </Connections>
  ),
};

/** Constellation, but with hot dogs, joined by lines of ketchup. */
export const Ketchup: Story = {
  args: { distance: "10vmin", lineWidth: 2.5, color: "hsl(2 85% 42%)" },
  render: (args) => (
    <Connections {...args} className="h-screen overflow-hidden" style={page}>
      {Array.from({ length: 60 }, (_, index) => (
        <Bounce key={index} {...spread(index)} speed={20 + ((index * 13) % 40)} squash={false}>
          <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>🌭</span>
        </Bounce>
      ))}
    </Connections>
  ),
};

/** Measured against the window: at "15vw", things connect from further apart in a wider window. Resize it to see. */
export const WindowRelative: Story = {
  args: { distance: "15vw" },
  render: Playground.render,
};

/**
 * Things that stay where you put them. Drag one near another to join them. The story checks that the two close
 * together are joined and the one far away isn't.
 */
export const DragToConnect: Story = {
  args: { distance: 100 },
  render: (args) => (
    <Connections {...args} className="h-screen overflow-hidden" style={page}>
      {emoji.map((choice, index) => (
        <Bounce
          key={choice}
          speed={0}
          grabbable
          throwable={false}
          startX={index === 0 ? 0.1 : index === 1 ? 0.16 : 0.15 + (index % 4) * 0.22}
          startY={index < 2 ? 0.15 : index < 5 ? 0.5 : 0.85}
          data-testid={`item-${index}`}
        >
          <span style={{ fontSize: "3rem", lineHeight: 1 }}>{choice}</span>
        </Bounce>
      ))}
    </Connections>
  ),
  play: async ({ canvas, canvasElement }) => {
    await nextFrame();
    await nextFrame();
    const lines = canvasElement.querySelector("canvas")!;
    const center = (element: HTMLElement) => {
      const at = element.getBoundingClientRect();
      return { x: at.left + at.width / 2, y: at.top + at.height / 2 };
    };
    const [first, second, far] = [0, 1, 7].map((index) => center(canvas.getByTestId(`item-${index}`)));
    // Halfway between the two close ones there's a line; halfway to the far one there isn't
    await expect(drawnAt(lines, (first!.x + second!.x) / 2, (first!.y + second!.y) / 2)).toBe(true);
    await expect(drawnAt(lines, (first!.x + far!.x) / 2, (first!.y + far!.y) / 2)).toBe(false);
  },
};

/**
 * Eight balls: black, white, and the painter's primary and secondary colors. When two connect, the line between
 * them mixes their colors like paint: red and blue are purple in the middle, and redder towards the red end. Drag
 * them together to mix any two. Switch blend to light to see the difference: light mixes blue and yellow to gray.
 */
export const ColorMixing: Story = {
  args: { blend: "paint", distance: 180, lineWidth: 6, fade: true },
  render: (args) => (
    <Connections {...args} className="h-screen overflow-hidden" style={page}>
      {Object.values(paints).map((color, index) => (
        <Bounce key={color} {...spread(index)} speed={30 + ((index * 23) % 40)} grabbable squash={false} style={{ "--connection-color": color } as object}>
          <PaintBall color={color} />
        </Bounce>
      ))}
    </Connections>
  ),
};

/**
 * Three pairs that stay put: red and blue, red and yellow, and blue and yellow. The story checks the middle of each
 * line is purple, orange, and green.
 */
export const MixedPairs: Story = {
  args: { blend: "paint", distance: 70, lineWidth: 8, fade: false },
  render: (args) => (
    <div className="grid place-items-center p-4" style={{ ...page, minHeight: "100vh" }}>
      <Connections {...args} className="h-96 w-[36rem] shrink-0" style={{ ...page, border: "var(--border-thin) solid var(--border-strong)" }}>
        {[
          [paints.red, paints.blue],
          [paints.red, paints.yellow],
          [paints.blue, paints.yellow],
        ].flatMap((colors, row) =>
          colors.map((color, side) => (
            <Bounce key={`${row}-${side}`} speed={0} startX={side === 0 ? 0.3 : 0.5} startY={0.1 + row * 0.4} data-testid={`pair-${row}-${side}`} style={{ "--connection-color": color } as object}>
              <PaintBall color={color} />
            </Bounce>
          )),
        )}
      </Connections>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await nextFrame();
    await nextFrame();
    const lines = canvasElement.querySelector("canvas")!;
    const middle = (row: number) => {
      const [left, right] = [0, 1].map((side) => canvas.getByTestId(`pair-${row}-${side}`).getBoundingClientRect());
      return [(left!.left + left!.right + right!.left + right!.right) / 4, (left!.top + left!.bottom) / 2] as const;
    };
    const near = (hue: number | null, expected: number) => hue !== null && Math.abs(((hue - expected + 540) % 360) - 180) < 25;
    await expect(near(hueAt(lines, ...middle(0)), 300)).toBe(true); // purple
    await expect(near(hueAt(lines, ...middle(1)), 30)).toBe(true); // orange
    await expect(near(hueAt(lines, ...middle(2)), 138)).toBe(true); // green
  },
};
