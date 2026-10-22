import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sun } from "lucide-react";
import { expect } from "storybook/test";
import { Planet } from "./Planet";
import type { PlanetProps } from "./Planet";
import { Star } from "./Star";

const page = { background: "var(--bg)", color: "var(--ink)" };
/** A box to orbit in: positioned, so the planets measure it, with an edge you can see */
const box = { ...page, border: "var(--border-thin) solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden" };
const colors = ["var(--action)", "var(--success)", "var(--link)", "var(--danger)", "var(--warning)", "var(--ink-muted)"];

/** How wide a planet is drawn, in rem: heavier is bigger, by the cube root, as if they were all equally dense */
const width = (mass: number) => 1.25 * Math.cbrt(mass);
/** Invisible, but forced colors draws it, so the planets and stars don't vanish with their backgrounds */
const edge = "var(--border-thin) solid transparent";

function Ball({ mass, color }: { mass: number; color: string }) {
  const size = `${width(mass)}rem`;
  return <span style={{ display: "block", boxSizing: "border-box", width: size, height: size, border: edge, borderRadius: "var(--radius-full)", background: color }} />;
}

const STAR = 4; // rem
function Sunny({ size = STAR }: { size?: number }) {
  return (
    <span className="grid place-items-center" style={{ boxSizing: "border-box", width: `${size}rem`, height: `${size}rem`, border: edge, borderRadius: "var(--radius-full)", background: "var(--highlight)", color: "var(--on-highlight)" }}>
      <Sun size="55%" strokeWidth={2.5} />
    </span>
  );
}

/**
 * Where to start something `size` rem wide so its center is `dx`, `dy` rem from the middle of a square box `side`
 * rem across, as Bounce's startX and startY (fractions of the room it has to move in)
 */
const from = (side: number, size: number, dx: number, dy: number) => ({
  startX: (side / 2 + dx - size / 2) / (side - size),
  startY: (side / 2 + dy - size / 2) / (side - size),
});

/** Each planet's mass, as a multiple of the mass control: a mix of light and heavy */
const MASSES = [0.4, 3, 1, 8, 0.6, 2, 0.3, 5, 1.5, 0.8, 12, 0.5];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const center = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};
const distance = (a: Element, b: Element) => Math.hypot(center(a).x - center(b).x, center(a).y - center(b).y);

/** The stories take the planets' props, plus settings for the scene around them */
type StoryArgs = PlanetProps & {
  /** How many planets there are. */
  count?: number;
  /** How heavy the star is. */
  starMass?: number;
};

const meta = {
  title: "Experiments/Orbits",
  component: Planet,
  subcomponents: { Star },
  // They're somewhere different every time, so a snapshot would never match
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: true } },
  args: { count: 8, starMass: 100, mass: 1, orbit: "counterclockwise", bounciness: 1, friction: 0, grabbable: true, throwable: true, squash: false, paused: false },
  argTypes: {
    count: { control: { type: "range", min: 1, max: 40, step: 1 } },
    starMass: { control: { type: "range", min: 10, max: 400, step: 10 } },
    mass: { control: { type: "range", min: 0, max: 5, step: 0.1 } },
    orbit: { control: "inline-radio", options: ["clockwise", "counterclockwise"] },
    children: { control: false },
    ref: { control: false },
    onBounce: { control: false },
    onClick: { control: false },
    friction: { control: { type: "range", min: 0, max: 2, step: 0.05 } },
    bounciness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * A star in the middle with planets of different masses around it, each started in a circular orbit. The big
 * ones pull on the small ones as they pass, so the light planets' orbits wobble and drift while the heavy ones
 * keep to theirs. Drag the star and they follow; grab a planet and throw it into a new orbit. The mass control
 * scales every planet's mass, keeping the mix of light and heavy.
 */
export const Playground: Story = {
  render: ({ count = 8, starMass, mass = 1, speed: _speed, angle: _angle, startX: _startX, startY: _startY, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Star mass={starMass} startX={0.5} startY={0.5}>
        <Sunny />
      </Star>
      {Array.from({ length: count }, (_, index) => {
        const heft = MASSES[index % MASSES.length]!;
        // Spread out from close in to far out, each a golden angle round from the last
        const radius = 0.15 + (0.3 * (index + 1)) / count;
        const turn = (index * 137.5 * Math.PI) / 180;
        return (
          <Planet key={index} {...args} mass={heft * mass} startX={0.5 + radius * Math.cos(turn)} startY={0.5 + radius * Math.sin(turn)}>
            <Ball mass={heft} color={colors[index % colors.length]!} />
          </Planet>
        );
      })}
    </div>
  ),
};

const MOONS_BOX = 44; // rem

/**
 * Mass in action. On the right, a heavy planet holds on to two moons, which circle it as it circles the star. On
 * the left, a light planet started with a would-be moon just as close, but it's too light to hold on to it: the
 * star pulls harder, so the moon goes round the star on its own and drifts away. The story checks the heavy
 * planet keeps its moons.
 */
export const Moons: Story = {
  argTypes: { count: { table: { disable: true } }, mass: { table: { disable: true } } }, // the masses are the point here
  render: ({ count: _count, starMass, mass: _mass, speed: _speed, angle: _angle, startX: _startX, startY: _startY, ...args }) => {
    const [heavy, light, moon] = [25, 1, 0.05];
    return (
      <div className="grid place-items-center p-4" style={{ ...page, minHeight: "100vh" }}>
        <div className="relative" style={{ ...box, width: `${MOONS_BOX}rem`, height: `${MOONS_BOX}rem` }}>
          <Star mass={starMass} {...from(MOONS_BOX, STAR, 0, 0)}>
            <Sunny />
          </Star>
          <Planet {...args} mass={heavy} {...from(MOONS_BOX, width(heavy), 15, 0)} data-testid="heavy">
            <Ball mass={heavy} color="var(--action)" />
          </Planet>
          <Planet {...args} mass={moon} {...from(MOONS_BOX, width(moon), 18, 0)} data-testid="moon">
            <Ball mass={moon} color="var(--ink-muted)" />
          </Planet>
          <Planet {...args} mass={moon} {...from(MOONS_BOX, width(moon), 12, 0)}>
            <Ball mass={moon} color="var(--ink-muted)" />
          </Planet>
          <Planet {...args} mass={light} {...from(MOONS_BOX, width(light), -15, 0)}>
            <Ball mass={light} color="var(--success)" />
          </Planet>
          <Planet {...args} mass={moon} {...from(MOONS_BOX, width(moon), -18, 0)}>
            <Ball mass={moon} color="var(--ink-muted)" />
          </Planet>
        </div>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const [planet, moon] = [canvas.getByTestId("heavy"), canvas.getByTestId("moon")];
    const start = distance(planet, moon);
    await expect(start).toBeGreaterThan(30); // 3rem apart, center to center
    await wait(1500);
    await expect(distance(planet, moon)).toBeLessThan(start * 2);
  },
};

/**
 * Two stars. Each planet starts out circling whichever star is closer, but the other one keeps tugging at it,
 * so orbits get swapped, stretched, and flung. No two runs look alike. Drag the stars apart or together.
 */
export const BinaryStars: Story = {
  args: { count: 10 },
  render: ({ count = 10, starMass, mass = 1, speed: _speed, angle: _angle, startX: _startX, startY: _startY, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Star mass={starMass} startX={0.3} startY={0.5}>
        <Sunny />
      </Star>
      <Star mass={starMass} startX={0.7} startY={0.5}>
        <Sunny />
      </Star>
      {Array.from({ length: count }, (_, index) => {
        const heft = MASSES[index % MASSES.length]!;
        const turn = (index * 137.5 * Math.PI) / 180;
        const radius = 0.08 + (0.1 * (index % 3)) / 2;
        return (
          <Planet key={index} {...args} mass={heft * mass} startX={(index % 2 === 0 ? 0.3 : 0.7) + radius * Math.cos(turn)} startY={0.5 + radius * 2 * Math.sin(turn)}>
            <Ball mass={heft} color={colors[index % colors.length]!} />
          </Planet>
        );
      })}
    </div>
  ),
};

/**
 * The planets start still, so they fall straight into the star and land on it. Pick one up and throw it
 * sideways: throw it just right and it goes into orbit; too slow and it falls back in; too fast and it flies off
 * and bounces off the walls.
 */
export const ThrowIntoOrbit: Story = {
  args: { count: 6, orbit: undefined, speed: 0 },
  argTypes: { orbit: { table: { disable: true } } }, // they start still: that's the point
  render: ({ count = 6, starMass, mass = 1, orbit: _orbit, startX: _startX, startY: _startY, ...args }) => (
    <div className="relative" style={{ ...page, height: "100vh", overflow: "hidden" }}>
      <Star mass={starMass} startX={0.5} startY={0.5}>
        <Sunny />
      </Star>
      {Array.from({ length: count }, (_, index) => {
        const heft = MASSES[index % MASSES.length]!;
        return (
          <Planet key={index} {...args} mass={heft * mass} startX={(index + 0.5) / count} startY={0.1}>
            <Ball mass={heft} color={colors[index % colors.length]!} />
          </Planet>
        );
      })}
    </div>
  ),
};

const ORBIT_BOX = 30; // rem

/**
 * One planet in a circular orbit, in a box of a fixed size. The story checks it keeps the same distance from the
 * star while it goes round, and that it goes counterclockwise.
 */
export const Orbiting: Story = {
  args: { orbit: "counterclockwise" },
  argTypes: { count: { table: { disable: true } } }, // always one
  render: ({ count: _count, starMass, speed: _speed, angle: _angle, startX: _startX, startY: _startY, ...args }) => (
    <div className="grid place-items-center p-4" style={{ ...page, minHeight: "100vh" }}>
      <div className="relative" style={{ ...box, width: `${ORBIT_BOX}rem`, height: `${ORBIT_BOX}rem` }}>
        <Star mass={starMass} {...from(ORBIT_BOX, STAR, 0, 0)} data-testid="star">
          <Sunny />
        </Star>
        <Planet {...args} {...from(ORBIT_BOX, width(1), 10, 0)} data-testid="planet">
          <Ball mass={1} color="var(--action)" />
        </Planet>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const [star, planet] = [canvas.getByTestId("star"), canvas.getByTestId("planet")];
    const radius = distance(star, planet);
    await expect(radius).toBeGreaterThan(150); // 10rem out
    for (let check = 0; check < 5; check++) {
      await wait(200);
      await expect(distance(star, planet)).toBeGreaterThan(radius * 0.9);
      await expect(distance(star, planet)).toBeLessThan(radius * 1.1);
    }
    // Starting on the right, counterclockwise goes up the screen
    await expect(center(planet).y).toBeLessThan(center(star).y - 50);
  },
};
