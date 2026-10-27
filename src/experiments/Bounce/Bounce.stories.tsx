import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Button } from "../../components/Button";
import { Bounce } from "./Bounce";

const page = { background: "var(--bg)", color: "var(--ink)" };
/** A box to bounce around in: positioned, so Bounce measures it, with an edge you can see */
const box = { ...page, border: "var(--border-thin) solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden" };
const colors = ["var(--brand)", "var(--success)", "var(--warning)", "var(--danger)", "var(--link)", "var(--highlight)"];
const emoji = ["🏀", "⚽", "🎾", "🌭", "🦄", "👀", "✨", "🍕", "🐱", "🍩", "⭐", "🔥"];

function Ball({ color, size = "2rem" }: { color: string; size?: string }) {
  return <span style={{ display: "block", width: size, height: size, borderRadius: "var(--radius-full)", background: color }} />;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const meta = {
  title: "Experiments/Bounce",
  component: Bounce,
  // It's somewhere different every time, so a snapshot would never match
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: true } },
  args: {
    speed: 240,
    angle: 45,
    gravity: 0,
    bounciness: 1,
    friction: 0,
    startX: 0,
    startY: 0,
    bounds: "parent",
    squash: true,
    paused: false,
    grabbable: false,
    throwable: true,
  },
  argTypes: {
    children: { control: false },
    ref: { control: false },
    onBounce: { control: false },
    speed: { control: { type: "range", min: 0, max: 2000, step: 20 } },
    angle: { control: { type: "range", min: 0, max: 360, step: 5 } },
    gravity: { control: { type: "range", min: 0, max: 4000, step: 50 } },
    bounciness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    friction: { control: { type: "range", min: 0, max: 5, step: 0.1 } },
    startX: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    startY: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof Bounce>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A dot bouncing around the page. Change its speed, direction, gravity, and bounciness in the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Bounce {...args} />
    </div>
  ),
};

/** Changes color at every bounce, like an old DVD player's screensaver. Will it hit a corner? */
export const ColorChange: Story = {
  args: { speed: 160, angle: 33 },
  render: (args) => <ColorChangeDemo {...args} />,
};

function ColorChangeDemo(args: Story["args"]) {
  const [bounces, setBounces] = useState(0);
  return (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Bounce {...args} onBounce={() => setBounces((count) => count + 1)}>
        <span style={{ display: "block", width: "6rem", height: "3.5rem", borderRadius: "var(--radius-lg)", background: colors[bounces % colors.length] }} />
      </Bounce>
    </div>
  );
}

/** Balls that fall under gravity and lose a little speed at each bounce. Drop them again with the button. */
export const Gravity: Story = {
  args: { gravity: 2000, bounciness: 0.8, speed: 300 },
  render: (args) => <GravityDemo {...args} />,
};

function GravityDemo(args: Story["args"]) {
  const [drop, setDrop] = useState(0);
  return (
    <div className="grid justify-items-start gap-4 p-6" style={page}>
      <Button onClick={() => setDrop((count) => count + 1)}>Drop them again</Button>
      <div key={drop} className="relative h-96 w-full" style={box}>
        {colors.slice(0, 5).map((color, index) => (
          <Bounce key={color} {...args} speed={(args?.speed ?? 300) * (0.6 + index * 0.2)} angle={index * 40 - 60} startX={index / 4} startY={0}>
            <Ball color={color} />
          </Bounce>
        ))}
      </div>
    </div>
  );
}

/** A crowd of emoji, each with its own speed and direction. They pass through each other; there are no collisions. */
export const Crowd: Story = {
  render: ({ children: _children, angle: _angle, speed, startX: _startX, startY: _startY, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      {emoji.map((choice, index) => (
        <Bounce
          key={choice}
          {...args}
          speed={(speed ?? 240) * (0.5 + ((index * 37) % 100) / 100)}
          angle={(index * 67) % 360}
          startX={((index * 41) % 100) / 100}
          startY={((index * 59) % 100) / 100}
        >
          <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{choice}</span>
        </Bounce>
      ))}
    </div>
  ),
};

/**
 * Bounces over the whole window, on top of the page. Clicks pass through it, so the page still works. Anything
 * that moves for more than five seconds needs a way to stop it, so this page has a pause button.
 */
export const WholePage: Story = {
  args: { bounds: "viewport", speed: 320 },
  // Over the whole window, it would bounce across every story on the Docs page
  tags: ["!autodocs"],
  render: (args) => <WholePageDemo {...args} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const pause = canvas.getByRole("button", { name: "Pause the ball" });
    await userEvent.click(pause);
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    // Paused, the ball stays where it's put: on the button. A click there still reaches the button.
    const ball = canvasElement.querySelector<HTMLElement>(".bounce")!;
    const at = pause.getBoundingClientRect();
    ball.style.transform = `translate(${at.left}px, ${at.top}px)`;
    const ballAt = ball.getBoundingClientRect();
    await expect(ballAt.left).toBe(at.left);
    await expect(document.elementFromPoint(ballAt.left + ballAt.width / 2, ballAt.top + ballAt.height / 2)?.closest("button")).toBe(pause);
    await userEvent.click(pause);
    await expect(pause).toHaveAttribute("aria-pressed", "false");
  },
};

function WholePageDemo(args: Story["args"]) {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid content-start justify-items-start gap-4 p-8" style={{ ...page, minHeight: "100vh" }}>
      <h1 style={{ margin: 0, fontSize: "var(--text-heading-lg)" }}>A page with a visitor</h1>
      <p style={{ margin: 0, maxWidth: "36rem" }}>The ball bounces over everything, but you can still select this text and press the button while it's on top of them.</p>
      <Button variant="secondary" aria-pressed={paused} onClick={() => setPaused((now) => !now)}>
        Pause the ball
      </Button>
      <Bounce {...args} paused={paused}>
        <Ball color="var(--brand)" size="3rem" />
      </Bounce>
    </div>
  );
}

/** Grab a ball and throw it. Let go while you're still moving and it flies off at that speed; hold still and let go to drop it. */
export const Throw: Story = {
  args: { gravity: 2000, bounciness: 0.75, speed: 0, grabbable: true },
  render: (args) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      {colors.slice(0, 5).map((color, index) => (
        <Bounce key={color} {...args} startX={0.2 + index * 0.15} startY={0.3}>
          <Ball color={color} size="3rem" />
        </Bounce>
      ))}
    </div>
  ),
};

/**
 * Drag things around and drop them anywhere: no speed, no gravity, and no throwing. The story checks that the
 * small dot can be grabbed at its edge with a mouse and from a little outside its edge on touch, and that dragging moves it.
 */
export const DragAround: Story = {
  args: { speed: 0, grabbable: true, throwable: false },
  render: ({ children: _children, startX: _startX, startY: _startY, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Bounce {...args} startX={0.1} startY={0.1} data-testid="dot" />
      {emoji.slice(0, 8).map((choice, index) => (
        <Bounce key={choice} {...args} startX={0.15 + (index % 4) * 0.2} startY={index < 4 ? 0.4 : 0.7}>
          <span style={{ fontSize: "3rem", lineHeight: 1 }}>{choice}</span>
        </Bounce>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const dot = canvas.getByTestId("dot");
    const from = dot.getBoundingClientRect();
    // With a mouse, the 24px dot already meets target-min, so its own edge is the grab area
    await expect(from.width).toBeGreaterThanOrEqual(24);
    await expect(document.elementFromPoint(from.right - 1, from.top + from.height / 2)?.closest(".bounce")).toBe(dot);
    // On touch, the dot is smaller than target-min, but grabbing just outside it still catches it
    canvasElement.dataset.pointer = "coarse";
    try {
      await expect(document.elementFromPoint(from.right + 6, from.top + from.height / 2)?.closest(".bounce")).toBe(dot);
      const x = from.left + from.width / 2;
      const y = from.top + from.height / 2;
      await userEvent.pointer([
        { keys: "[MouseLeft>]", target: dot, coords: { clientX: x, clientY: y } },
        { target: dot, coords: { clientX: x + 60, clientY: y + 30 } },
        { target: dot, coords: { clientX: x + 120, clientY: y + 60 } },
        { keys: "[/MouseLeft]", target: dot, coords: { clientX: x + 120, clientY: y + 60 } },
      ]);
      const to = dot.getBoundingClientRect();
      await expect(Math.round(to.left - from.left)).toBe(120);
      await expect(Math.round(to.top - from.top)).toBe(60);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Fast, in a small box. The story checks that it moves, bounces back, and never leaves the box. */
export const StaysInside: Story = {
  args: { speed: 1500, angle: 20 },
  render: (args) => (
    <div className="grid place-items-center p-8" style={{ ...page, minHeight: "100vh" }}>
      <div data-testid="room" className="relative h-32 w-48" style={box}>
        <Bounce {...args} />
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const room = canvas.getByTestId("room").getBoundingClientRect();
    const ball = canvasElement.querySelector(".bounce")!;
    const xs: number[] = [];
    for (let frame = 0; frame < 40; frame++) {
      await nextFrame();
      const at = ball.getBoundingClientRect();
      await expect(at.left).toBeGreaterThanOrEqual(room.left - 0.5);
      await expect(at.right).toBeLessThanOrEqual(room.right + 0.5);
      await expect(at.top).toBeGreaterThanOrEqual(room.top - 0.5);
      await expect(at.bottom).toBeLessThanOrEqual(room.bottom + 0.5);
      xs.push(at.left);
    }
    const moves = xs.slice(1).map((x, index) => x - xs[index]!);
    await expect(moves.some((move) => move > 0)).toBe(true);
    await expect(moves.some((move) => move < 0)).toBe(true); // it came back off an edge
  },
};

/** With reduced motion (here forced with data-motion="reduced"), it holds still where it starts. */
export const ReducedMotion: Story = {
  args: { speed: 1500, startX: 0.5, startY: 0.5 },
  render: (args) => (
    <div data-motion="reduced" className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Bounce {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const ball = canvasElement.querySelector<HTMLElement>(".bounce")!;
    const start = ball.style.transform;
    await expect(start).toMatch(/^translate\([1-9][\d.]*px, [1-9][\d.]*px\)$/); // placed in the middle, not still at 0, 0
    await wait(300);
    await expect(ball.style.transform).toBe(start);
  },
};
