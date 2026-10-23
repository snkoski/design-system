import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect } from "storybook/test";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Switch } from "../../components/Switch";
import { LookAt } from "../LookAt/LookAt";
import { Proximity } from "../Proximity/Proximity";
import { FrameMeter } from "./FrameMeter";
import { LookAtCanvas } from "./LookAtCanvas";
import { useSweep } from "./sweep";

/** Turns the mouse position into a pointermove the page sees, as a real mouse would */
function movePointer(x: number, y: number) {
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
}

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };

// The same plain colors as Proximity's stories, rather than the palette's tokens: the point is to see them mix
const BLUE = "hsl(220 90% 55%)";
const GREEN = "hsl(140 75% 40%)";
const RED = "hsl(0 85% 55%)";

const PRESETS: Record<string, string[] | undefined> = {
  none: undefined,
  "blue to red": [BLUE, RED],
  "blue, green, red": [BLUE, GREEN, RED],
  "red to green": [RED, GREEN],
};

const meta = {
  title: "Experiments/Look at canvas",
  component: LookAtCanvas,
  parameters: { layout: "fullscreen" },
  args: { columns: 36, rows: 22, pitch: 1.375, barWidth: 0.1875, barLength: 1, turnDuration: 120, reach: 240, faintest: 0, colorSpace: "srgb" },
  argTypes: {
    ref: { control: false },
    emoji: { control: "inline-radio", options: ["none", "🌭"], mapping: { none: undefined } },
    emojiTurn: { control: { type: "range", min: 0, max: 360, step: 5 } },
    reach: { control: { type: "range", min: 0, max: 800, step: 10 } },
    faintest: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    fade: { control: "inline-radio", options: ["none", "in", "out"], mapping: { none: undefined } },
    colors: { control: "select", options: Object.keys(PRESETS), mapping: PRESETS },
    colorSpace: { control: "inline-radio", options: ["srgb", "oklch", "hsl"] },
    columns: { control: { type: "range", min: 1, max: 200, step: 1 } },
    rows: { control: { type: "range", min: 1, max: 120, step: 1 } },
    pitch: { control: { type: "range", min: 0.5, max: 4, step: 0.125 } },
    barWidth: { control: { type: "range", min: 0.0625, max: 1, step: 0.0625 } },
    barLength: { control: { type: "range", min: 0.25, max: 3, step: 0.125 } },
    turnDuration: { control: { type: "range", min: 0, max: 2000, step: 20 } },
  },
} satisfies Meta<typeof LookAtCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The dense bar grid from Look at, drawn on one canvas. Move the mouse around the page, and change the grid, the
 * bars, the turn speed, an emoji, and Proximity's colors and fading in the Controls panel.
 */
export const Playground: Story = {
  render: (args) => (
    <div data-motion="full" className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} data-testid="field" />
    </div>
  ),
  play: async ({ canvas }) => {
    // Put the mouse level with the top row, off to the right: the first bar in that row should lie flat
    const field = canvas.getByTestId("field") as HTMLCanvasElement;
    const area = field.getBoundingClientRect();
    const pitch = area.width / 36;
    movePointer(area.right + 200, area.top + pitch / 2);
    await new Promise((resolve) => setTimeout(resolve, 400)); // let the turn finish
    const density = field.width / area.width;
    const alpha = (x: number, y: number) => field.getContext("2d")!.getImageData(Math.round(x * density), Math.round(y * density), 1, 1).data[3]!;
    const center = pitch / 2;
    await expect(alpha(center + 5, center)).toBeGreaterThan(0); // along the bar, sideways
    await expect(alpha(center, center - 5)).toBe(0); // where it stood before it turned
  },
};

/** The same bar as Look at's dense bar grid, for drawing it with an element per bar. It's in currentColor, for Proximity's colors. */
function Bar() {
  return <span style={{ display: "block", width: "0.1875rem", height: "1rem", borderRadius: "var(--radius-full)", background: "currentColor" }} />;
}

/** Look at's hot dog, at the size the canvas draws it in a 22px cell */
function HotDog() {
  return <span style={{ display: "block", fontSize: "1rem", lineHeight: 1, rotate: "45deg" }}>🌭</span>;
}

/** Grid sizes to compare, as columns and rows of 22px cells */
const SIZES = { small: [36, 22], medium: [72, 44], large: [120, 80] } as const;
type Size = keyof typeof SIZES;

function Compare() {
  const [drawing, setDrawing] = useState("canvas");
  const [size, setSize] = useState<Size>("small");
  const [sweep, setSweep] = useState(false);
  const [kind, setKind] = useState("bars");
  const [colored, setColored] = useState(false);
  const grid = useRef<HTMLDivElement | null>(null);
  const colors = colored && kind === "bars" ? [BLUE, RED] : undefined;
  const fade = colored && kind === "hotdogs" ? ("in" as const) : undefined;
  useSweep(sweep, grid);
  const [columns, rows] = SIZES[size];

  return (
    <div data-motion="full" className="grid content-start gap-6 p-4 sm:p-8" style={page}>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <SegmentedControl label="Drawn with" value={drawing} onValueChange={setDrawing}>
          <Segment value="canvas">One canvas</Segment>
          <Segment value="elements">An element each</Segment>
        </SegmentedControl>
        <SegmentedControl label="Bars" value={size} onValueChange={(value) => setSize(value as Size)}>
          {(Object.keys(SIZES) as Size[]).map((key) => (
            <Segment key={key} value={key}>
              {(SIZES[key][0] * SIZES[key][1]).toLocaleString("en-US")}
            </Segment>
          ))}
        </SegmentedControl>
        <SegmentedControl label="Each one is" value={kind} onValueChange={setKind}>
          <Segment value="bars">A bar</Segment>
          <Segment value="hotdogs">A hot dog</Segment>
        </SegmentedControl>
        <Switch checked={colored} onCheckedChange={setColored} description="Bars go from blue to red. Hot dogs fade in.">
          Change near the mouse
        </Switch>
        <Switch checked={sweep} onCheckedChange={setSweep}>
          Move the mouse automatically
        </Switch>
        <FrameMeter />
      </div>
      <div ref={grid} className="justify-self-start">
        {drawing === "canvas" ? (
          <LookAtCanvas
            key={size}
            columns={columns}
            rows={rows}
            emoji={kind === "hotdogs" ? "🌭" : undefined}
            emojiTurn={45}
            colors={colors}
            fade={fade}
          />
        ) : (
          <div key={size} className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1.375rem)` }}>
            {Array.from({ length: columns * rows }, (_, index) => {
              const look = <LookAt style={{ width: "1.375rem", height: "1.375rem" }}>{kind === "hotdogs" ? <HotDog /> : <Bar />}</LookAt>;
              // Proximity around each one only when it's switched on, so the plain comparison stays plain
              return colored ? (
                <Proximity key={index} colors={colors} fade={fade} style={{ color: "var(--action)" }}>
                  {look}
                </Proximity>
              ) : (
                <span key={index} style={{ display: "contents", color: "var(--action)" }}>
                  {look}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The canvas and LookAt's element per bar, in the same place, with a frame meter. Switch on the automatic mouse so
 * both get exactly the same work, then try the bigger grids, hot dogs, and changing near the mouse (Proximity, on
 * the elements), on a phone too. The elements slow down as the count grows, because every move measures and
 * restyles each one; the canvas measures one element and draws the bars together. Not snapshotted by Chromatic,
 * since the meter's reading changes.
 */
export const CanvasVersusElements: StoryObj = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <Compare />,
};

/** Hot dogs, stood on end toward the mouse like the bars: the emoji is drawn once and stamped, turned, in every cell. */
export const HotDogs: Story = {
  args: { emoji: "🌭", emojiTurn: 45, pitch: 1.75, barLength: 1.375, columns: 28, rows: 17 },
  render: (args) => (
    <div className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} />
    </div>
  ),
};

/**
 * Bars that turn toward the mouse and go from blue to red as it comes near, as Proximity's colors do. The story
 * checks the bar under the mouse is red and one far away is blue.
 */
export const BlueToRed: Story = {
  args: { colors: [BLUE, RED] },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <div data-motion="full" className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} data-testid="field" />
    </div>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByTestId("field") as HTMLCanvasElement;
    const area = field.getBoundingClientRect();
    const pitch = area.width / 36;
    // Just off the first bar's center: it's red under the mouse, and the far corner's bar stays blue and upright
    movePointer(area.left + pitch / 2 + 1, area.top + pitch / 2 + 1);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const density = field.width / area.width;
    const pixel = (x: number, y: number) => [...field.getContext("2d")!.getImageData(Math.round(x * density), Math.round(y * density), 1, 1).data];
    const [red, , blue] = pixel(pitch / 2, pitch / 2);
    await expect(red!).toBeGreaterThan(blue!);
    const [farRed, , farBlue, farAlpha] = pixel(area.width - pitch / 2, area.height - pitch / 2);
    await expect(farAlpha!).toBeGreaterThan(0);
    await expect(farBlue!).toBeGreaterThan(farRed!);
  },
};

/** Blue far away, through green, to red under the mouse: rings of color around it, and every bar turned to face it. */
export const ThreeColors: Story = {
  args: { colors: [BLUE, GREEN, RED], reach: 360 },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <div className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} />
    </div>
  ),
};

/** A flashlight: the bars are invisible until the mouse comes near, then fade in blue and turn red as it comes over them. */
export const Flashlight: Story = {
  args: { fade: "in", colors: [BLUE, RED], reach: 200 },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <div className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} />
    </div>
  ),
};

/** Hot dogs that appear around the mouse, all facing it. */
export const HotDogFlashlight: Story = {
  args: { ...HotDogs.args, fade: "in", reach: 160 },
  render: (args) => (
    <div className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} />
    </div>
  ),
};

/** With reduced motion (here forced with data-motion="reduced"), nothing turns: every bar keeps pointing up. */
export const ReducedMotion: Story = {
  render: (args) => (
    <div data-motion="reduced" className="grid place-items-center p-8" style={page}>
      <LookAtCanvas {...args} columns={8} rows={4} data-testid="still" />
    </div>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByTestId("still") as HTMLCanvasElement;
    const area = field.getBoundingClientRect();
    const pitch = area.width / 8;
    movePointer(area.right + 200, area.top + pitch / 2);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const density = field.width / area.width;
    const alpha = (x: number, y: number) => field.getContext("2d")!.getImageData(Math.round(x * density), Math.round(y * density), 1, 1).data[3]!;
    const center = pitch / 2;
    await expect(alpha(center, center - 5)).toBeGreaterThan(0); // still standing up
    await expect(alpha(center + 5, center)).toBe(0);
  },
};

/** The bars in all three themes: each takes its color from the theme's --action. Before the mouse moves, all point up. */
export const AllThemes: Story = {
  render: (args) => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <LookAtCanvas {...args} columns={12} rows={3} />
        </section>
      ))}
    </div>
  ),
};
