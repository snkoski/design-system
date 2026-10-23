import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SolarSystem } from "./SolarSystem";

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };

const center = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};
const distance = (a: Element, b: Element) => Math.hypot(center(a).x - center(b).x, center(a).y - center(b).y);

const meta = {
  title: "Experiments/Solar system",
  component: SolarSystem,
  // Most of them start on today's date, so a snapshot would never match
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: true } },
  args: { speed: 30, scale: "log", orbits: true, moons: true, labels: true, ruler: false, paused: false },
  argTypes: {
    date: { control: "date" },
    speed: { control: { type: "range", min: -3650, max: 3650, step: 10 } },
    scale: { control: "inline-radio", options: ["linear", "sqrt", "log", "even"] },
    ref: { control: false },
  },
  render: (args) => (
    <div className="grid place-items-center p-4" style={page}>
      <SolarSystem {...args} className="w-full max-w-[44rem]" />
    </div>
  ),
} satisfies Meta<typeof SolarSystem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Today's solar system, a month a second. Pick a date, speed, and distance scale in the Controls panel. The story
 * checks the burger and all nine hot dogs are there, and that pausing doesn't move the date or resize the button.
 */
export const Playground: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole("img", { name: /hamburger for the Sun/ })).toBeVisible();
    await expect(canvasElement.querySelectorAll("g[data-planet] > .solar-system__body")).toHaveLength(9);
    await expect(canvasElement.querySelectorAll("[data-moon]")).toHaveLength(21);
    const button = canvas.getByRole("button", { name: "Pause" });
    const date = canvasElement.querySelector(".solar-system__date")!;
    const before = { width: button.getBoundingClientRect().width, date: date.getBoundingClientRect().left };
    await userEvent.click(button);
    await expect(canvas.getByRole("button", { name: "Play" })).toBe(button);
    await expect(button.getBoundingClientRect().width).toBe(before.width);
    await expect(date.getBoundingClientRect().left).toBe(before.date);
  },
};

/**
 * Ten years a second, to see the outer planets move. The inner ones are a blur. The story checks the Pause button
 * stays put while the date flicks through every month.
 */
export const FastForward: Story = {
  args: { speed: 3650 },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Pause" });
    const places = new Set<number>();
    for (let frame = 0; frame < 30; frame++) {
      places.add(Math.round(button.getBoundingClientRect().left));
      await new Promise(requestAnimationFrame);
    }
    await expect([...places]).toHaveLength(1);
  },
};

/**
 * From 1979 to 1999, Pluto was closer to the Sun than Neptune. This is the day it was closest, 5 September 1989,
 * with the orbits evenly spaced so you can see it inside Neptune's. The story checks it's drawn nearer the burger.
 */
export const PlutoInsideNeptune: Story = {
  args: { date: Date.UTC(1989, 8, 5), paused: true, scale: "even" },
  play: async ({ canvasElement }) => {
    const sun = canvasElement.querySelector("[data-body=Sun]")!;
    const [pluto, neptune] = ["Pluto", "Neptune"].map((name) => canvasElement.querySelector(`g[data-planet=${name}] > .solar-system__body`)!);
    await expect(distance(pluto!, sun)).toBeLessThan(distance(neptune!, sun));
  },
};

/**
 * The total solar eclipse of 8 April 2024, seen across North America: the Moon's hot dog sits between Earth's and the
 * burger. Earth's Moon is the one moon that's where it really is. The story checks it points straight at the burger.
 */
export const SolarEclipse: Story = {
  args: { date: Date.UTC(2024, 3, 8, 18, 18), paused: true, scale: "even" },
  play: async ({ canvasElement }) => {
    const sun = center(canvasElement.querySelector("[data-body=Sun]")!);
    const earth = center(canvasElement.querySelector("g[data-planet=Earth] > .solar-system__body")!);
    const moon = center(canvasElement.querySelector("[data-moon=Moon] text")!);
    const toSun = Math.atan2(sun.y - earth.y, sun.x - earth.x);
    const toMoon = Math.atan2(moon.y - earth.y, moon.x - earth.x);
    const apart = Math.abs(((((toMoon - toSun) * 180) / Math.PI + 540) % 360) - 180);
    await expect(apart).toBeLessThan(3); // degrees
  },
};

/** What each distance scale does, as the DistanceScales story explains it */
const SCALES = {
  linear: "True to scale, apart from a gap to clear the burger. Pluto gets 127 times as far from the Sun as Mercury's average distance, so the inner four planets crowd round it.",
  sqrt: "Distances by their square root: four times as far is drawn twice as far. Still roughly to scale, but the inner planets get some room.",
  log: "Distances by their logarithm: each doubling of the distance gets about the same room, so the inner planets get plenty and the outer ones still fit. This is the default.",
  even: "Each planet's average orbit evenly spaced, like a diagram in a textbook. In between, distances are in proportion, so Pluto's stretched orbit still dips inside Neptune's.",
} as const;

/**
 * The four ways to squeeze the distances, side by side, on the same date, each with what it does and a ruler at
 * its scale. Every one keeps the directions true and the order outwards; only how far apart the orbits are drawn
 * changes.
 */
export const DistanceScales: Story = {
  args: { date: Date.UTC(2026, 9, 23), paused: true, labels: false, ruler: true },
  argTypes: { scale: { control: false } },
  render: (args) => (
    <div className="grid content-start gap-8 p-4 sm:grid-cols-2" style={page}>
      {(Object.keys(SCALES) as (keyof typeof SCALES)[]).map((scale) => (
        <section key={scale} aria-labelledby={`scale-${scale}`} className="grid content-start gap-2">
          <h2 id={`scale-${scale}`} style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
            {scale}
          </h2>
          <p className="max-w-[36rem]" style={{ margin: 0, color: "var(--ink-muted)" }}>
            {SCALES[scale]}
          </p>
          <SolarSystem {...args} scale={scale} />
        </section>
      ))}
      <p className="max-w-[40rem] sm:col-span-2" style={{ margin: 0, fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
        Each ruler measures out from the Sun in AU, or astronomical units: 1 AU is Earth&rsquo;s average distance from
        the Sun, about 150 million km (about 93 million miles, for our American friends). Only the linear scale has evenly spaced marks, like a map&rsquo;s scale bar.
        On the others, each AU is drawn shorter the further out it is.
      </p>
    </div>
  ),
};
