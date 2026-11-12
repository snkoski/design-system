import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect } from "storybook/test";
import { Proximity } from "@/experiments/Proximity/Proximity";

// Plain blue, green, and red, rather than the palette's tokens: the point is to see the colors mix
const BLUE = "hsl(220 90% 55%)";
const GREEN = "hsl(140 75% 40%)";
const RED = "hsl(0 85% 55%)";

const page = { background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" };

/** A dot drawn in currentColor, so it takes on the colors */
function Dot() {
  return <span aria-hidden="true" style={{ display: "block", width: "2rem", height: "2rem", borderRadius: "var(--radius-full)", background: "currentColor" }} />;
}

function Square() {
  return <span aria-hidden="true" style={{ display: "block", width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius-sm)", background: "currentColor" }} />;
}

function Grid({ columns, rows, item }: { columns: number; rows: number; item: (index: number) => ReactNode }) {
  return (
    <div className="grid place-items-center p-8" style={page}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 3rem)` }}>
        {Array.from({ length: columns * rows }, (_, index) => item(index))}
      </div>
    </div>
  );
}

/** Turns the mouse position into a pointermove the page sees, as a real mouse would */
function movePointer(x: number, y: number) {
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
}
const middleOf = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return [left + width / 2, top + height / 2] as const;
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PRESETS: Record<string, string[] | undefined> = {
  none: undefined,
  "blue to red": [BLUE, RED],
  "blue, green, red": [BLUE, GREEN, RED],
  "red to green": [RED, GREEN],
};

const meta = {
  title: "Experiments/Proximity",
  component: Proximity,
  parameters: { layout: "fullscreen" },
  args: { reach: 240, faintest: 0, colorSpace: "srgb" },
  argTypes: {
    children: { control: false },
    ref: { control: false },
    reach: { control: { type: "range", min: 0, max: 800, step: 10 } },
    faintest: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    fade: { control: "inline-radio", options: ["none", "in", "out"], mapping: { none: undefined } },
    colors: { control: "select", options: Object.keys(PRESETS), mapping: PRESETS },
    colorSpace: { control: "inline-radio", options: ["srgb", "oklch", "hsl"] },
  },
} satisfies Meta<typeof Proximity>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A grid of dots. Move the mouse over them, and pick a fade, colors, and reach in the Controls panel. */
export const Playground: Story = {
  args: { colors: "blue to red" as unknown as string[] }, // a preset's name; the control maps it to the colors
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args} style={{ color: "var(--brand)" }}>
          <Dot />
        </Proximity>
      )}
    />
  ),
};

/**
 * Squares that fade away as the mouse comes near, leaving a see-through hole that follows it. The story checks
 * the square under the mouse fades and one far away doesn't.
 */
export const FadeOut: Story = {
  args: { fade: "out", faintest: 0.1 },
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args} style={{ color: "var(--brand)" }} data-testid={`cell-${index}`}>
          <Square />
        </Proximity>
      )}
    />
  ),
  play: async ({ canvas }) => {
    const [near, far] = [canvas.getByTestId("cell-0"), canvas.getByTestId("cell-125")];
    movePointer(...middleOf(near));
    await wait(300); // let the fade finish
    await expect(Number(getComputedStyle(near).opacity)).toBeCloseTo(0.1);
    await expect(getComputedStyle(far).opacity).toBe("1");
  },
};

/** Invisible dots that appear around the mouse, like a flashlight in the dark. Move around to find them. */
export const FadeIn: Story = {
  args: { fade: "in", reach: 160 },
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args} style={{ color: "var(--brand)" }}>
          <Dot />
        </Proximity>
      )}
    />
  ),
};

/** Blue far away, red under the mouse, and purple in between, mixed as red, green, and blue light. */
export const BlueToRed: Story = {
  args: { colors: [BLUE, RED] },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args}>
          <Square />
        </Proximity>
      )}
    />
  ),
};

/**
 * Blue far away, through green, to red under the mouse: rings of color around it. The story checks the square
 * under the mouse is red and one far away is blue.
 */
export const ThreeColors: Story = {
  args: { colors: [BLUE, GREEN, RED] },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args} data-testid={`cell-${index}`}>
          <Square />
        </Proximity>
      )}
    />
  ),
  play: async ({ canvas }) => {
    const [near, far] = [canvas.getByTestId("cell-0"), canvas.getByTestId("cell-125")];
    movePointer(...middleOf(near));
    await expect(near.style.getPropertyValue("--proximity-color")).toBe(`color-mix(in srgb, ${GREEN}, ${RED} 100%)`);
    await expect(far.style.getPropertyValue("--proximity-color")).toBe(`color-mix(in srgb, ${BLUE}, ${GREEN} 0%)`);
  },
};

/**
 * Fades in and changes color at once: dots appear blue at the edge of the mouse's reach and turn red as it
 * comes over them.
 */
export const FadeInAndColor: Story = {
  args: { fade: "in", colors: [BLUE, RED], reach: 200 },
  argTypes: { colors: { control: false } },
  render: (args) => (
    <Grid
      columns={14}
      rows={9}
      item={(index) => (
        <Proximity key={index} {...args}>
          <Dot />
        </Proximity>
      )}
    />
  ),
};

/**
 * The same blue to red in each of the three ways to mix colors, one row each. Move the mouse along the rows to
 * compare what's in between: purple, a brighter purple, and magenta.
 */
export const ColorSpaces: Story = {
  args: { colors: [BLUE, RED], reach: 320 },
  argTypes: { colors: { control: false }, colorSpace: { control: false } },
  render: (args) => (
    <div className="grid place-items-center gap-8 p-8" style={page}>
      {(["srgb", "oklch", "hsl"] as const).map((space) => (
        <div key={space} className="grid gap-2">
          <p style={{ margin: 0, fontWeight: 600 }}>{space}</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(14, 3rem)" }}>
            {Array.from({ length: 28 }, (_, index) => (
              <Proximity key={index} {...args} colorSpace={space}>
                <Square />
              </Proximity>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
