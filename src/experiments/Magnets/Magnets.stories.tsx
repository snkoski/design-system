import type { Meta, StoryObj } from "@storybook/react-vite";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { expect } from "storybook/test";
import { Bounce } from "../Bounce/Bounce";
import { Magnet } from "./Magnet";
import type { MagnetProps } from "./Magnet";

const page = { background: "var(--bg)", color: "var(--ink)" };
/** A box to move around in: positioned, so the magnets measure it, with an edge you can see */
const box = { ...page, border: "var(--border-thin) solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden" };

/** A ball that shows its charge with a sign as well as a color: + is orange, − is teal, and neutral is gray */
function Charge({ charge, size = "2.5rem" }: { charge: number; size?: string }) {
  const Sign = charge > 0 ? Plus : Minus;
  const background = charge > 0 ? "var(--action)" : charge < 0 ? "var(--success)" : "var(--border-strong)";
  return (
    <span className="grid place-items-center" style={{ width: size, height: size, borderRadius: "var(--radius-full)", background, color: "var(--bg)" }}>
      {charge !== 0 && <Sign size="60%" strokeWidth={3} />}
    </span>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** The stories take the magnets' props, plus how many to show (a story setting, not a Magnet prop) */
type StoryArgs = MagnetProps & {
  /** How many magnets are on the page. */
  count?: number;
};

const meta = {
  title: "Experiments/Magnets",
  component: Magnet,
  // They're somewhere different every time, so a snapshot would never match
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: true } },
  args: { count: 12, charge: 1, friction: 0.6, speed: 120, gravity: 0, bounciness: 1, grabbable: true, throwable: true, squash: false, paused: false },
  argTypes: {
    count: { control: { type: "range", min: 1, max: 150, step: 1 } },
    children: { control: false },
    ref: { control: false },
    onBounce: { control: false },
    onClick: { control: false },
    charge: { control: { type: "range", min: -10, max: 10, step: 0.5 } },
    friction: { control: { type: "range", min: 0, max: 5, step: 0.1 } },
    speed: { control: { type: "range", min: 0, max: 2000, step: 20 } },
    gravity: { control: { type: "range", min: 0, max: 4000, step: 50 } },
    bounciness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Orange + magnets attract teal − ones and push other + ones away, and the other way round. A little friction
 * lets them settle into chains and clumps. Grab one and pull it away to break it off. The charge, speed, and
 * friction controls apply to every magnet; each keeps its own sign.
 */
export const Playground: Story = {
  args: { count: 12, charge: 1, friction: 0.6, speed: 120, grabbable: true, squash: false },
  render: ({ count = 12, charge, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      {Array.from({ length: count }, (_, index) => {
        const sign = index % 2 === 0 ? 1 : -1;
        return (
          <Magnet key={index} {...args} charge={sign * Math.abs(charge ?? 1)} angle={(index * 67) % 360} startX={((index * 41) % 100) / 100} startY={((index * 59) % 100) / 100}>
            <Charge charge={sign} />
          </Magnet>
        );
      })}
    </div>
  ),
};

/**
 * Every ball has the same charge, so they all push each other away. They end up spread out along the walls, the
 * way charge spreads over the outside of a piece of metal. Drag one into the middle and watch it get pushed out.
 * Change how many there are with the count control. The story checks the count is what's on the page.
 */
export const PersonalSpace: Story = {
  args: { count: 16, charge: 2, friction: 1, speed: 60, grabbable: true, squash: false },
  render: ({ count = 16, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      {Array.from({ length: count }, (_, index) => (
        <Magnet key={index} {...args} angle={(index * 67) % 360} startX={0.4 + ((index * 41) % 20) / 100} startY={0.4 + ((index * 59) % 20) / 100}>
          <Charge charge={1} size="2rem" />
        </Magnet>
      ))}
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    await expect(canvasElement.querySelectorAll(".bounce")).toHaveLength(args.count!);
  },
};

/**
 * Like PersonalSpace, but click a ball to flip its charge between + and −. Flip one and the + balls around it
 * rush in; flip a few and they pair up. Drag them around too: a drag doesn't flip anything. The story checks a
 * click flips one.
 */
export const FlipCharge: Story = {
  args: { count: 16, charge: 2, friction: 1, speed: 60, grabbable: true, squash: false },
  render: (args) => <FlipChargeDemo {...args} />,
  play: async ({ canvas, userEvent }) => {
    const ball = canvas.getByTestId("ball-0");
    await expect(ball.querySelector(".lucide-plus")).toBeInTheDocument();
    await userEvent.click(ball);
    await expect(ball.querySelector(".lucide-minus")).toBeInTheDocument();
    await userEvent.click(ball);
    await expect(ball.querySelector(".lucide-plus")).toBeInTheDocument();
  },
};

function FlipChargeDemo({ count = 16, charge, ...args }: StoryArgs) {
  // Which ones have been flipped to −, so changing the count keeps them
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set());
  const flip = (index: number) =>
    setFlipped((now) => {
      const next = new Set(now);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  return (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      {Array.from({ length: count }, (_, index) => flipped.has(index) ? -1 : 1).map((sign, index) => (
        <Magnet
          key={index}
          {...args}
          charge={sign * Math.abs(charge ?? 2)}
          angle={(index * 67) % 360}
          startX={0.4 + ((index * 41) % 20) / 100}
          startY={0.4 + ((index * 59) % 20) / 100}
          onClick={() => flip(index)}
          data-testid={`ball-${index}`}
        >
          <Charge charge={sign} size="2rem" />
        </Magnet>
      ))}
    </div>
  );
}

/**
 * A big paused − magnet in the middle pulls every + magnet in. Every fifth ball is gray: a plain Bounce, not a
 * magnet, so it ignores the magnet. Drag the big one around, and the others follow. The count is the small balls.
 */
export const FixedMagnet: Story = {
  args: { count: 10, friction: 0.3, speed: 200, squash: false },
  render: ({ count = 10, charge: _charge, paused: _paused, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Magnet speed={0} charge={-12} paused grabbable startX={0.5} startY={0.5}>
        <Charge charge={-1} size="5rem" />
      </Magnet>
      {Array.from({ length: count }, (_, index) => {
        const place = { angle: (index * 67) % 360, startX: ((index * 41) % 100) / 100, startY: ((index * 59) % 100) / 100 };
        return index % 5 === 0 ? (
          <Bounce key={index} {...args} {...place}>
            <Charge charge={0} size="1.75rem" />
          </Bounce>
        ) : (
          <Magnet key={index} {...args} {...place} charge={1}>
            <Charge charge={1} size="1.75rem" />
          </Magnet>
        );
      })}
    </div>
  ),
};

/** A + and − pair on the left, and a + and + pair on the right. The story checks the first pair closes in and the second spreads out. */
export const AttractAndRepel: Story = {
  args: { speed: 0, squash: false },
  argTypes: { count: { table: { disable: true } } }, // always two pairs
  render: ({ count: _count, charge: _charge, ...args }) => (
    <div className="grid grid-cols-2 gap-4 p-4" style={{ ...page, height: "100vh" }}>
      {[
        [1, -1],
        [1, 1],
      ].map(([left, right], pair) => (
        <div key={pair} data-testid={`pair-${pair}`} className="relative" style={box}>
          <Magnet {...args} charge={left} startX={0.3} startY={0.5}>
            <Charge charge={left!} />
          </Magnet>
          <Magnet {...args} charge={right} startX={0.7} startY={0.5}>
            <Charge charge={right!} />
          </Magnet>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const gapIn = (pair: number) => {
      const [left, right] = [...canvas.getByTestId(`pair-${pair}`).querySelectorAll(".bounce")].map((ball) => ball.getBoundingClientRect().left);
      return right! - left!;
    };
    await nextFrame();
    const [opposite, alike] = [gapIn(0), gapIn(1)];
    await wait(400);
    await expect(gapIn(0)).toBeLessThan(opposite - 10);
    await expect(gapIn(1)).toBeGreaterThan(alike + 10);
  },
};
