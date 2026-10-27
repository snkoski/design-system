import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { TextDrawing } from "./TextDrawing";

const PRESETS: Record<string, string[] | undefined> = {
  "border to brand": undefined,
  "blue to red": ["hsl(220 90% 55%)", "hsl(0 85% 55%)"],
  "blue, green, red": ["hsl(220 90% 55%)", "hsl(140 75% 40%)", "hsl(0 85% 55%)"],
};

const meta = {
  title: "Experiments/Text drawing",
  component: TextDrawing,
  parameters: { layout: "fullscreen" },
  args: { reach: 120, cellSize: 1.25 },
  argTypes: {
    defaultText: { control: false },
    reach: { control: { type: "range", min: 0, max: 400, step: 10 } },
    cellSize: { control: { type: "range", min: 0.5, max: 3, step: 0.25 } },
    colors: { control: "select", options: Object.keys(PRESETS), mapping: PRESETS },
  },
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextDrawing>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Type in the text area to draw: `=` changes color as the mouse comes near, `-` stays still, and `.` leaves a
 * gap. The story checks that typing adds a cell, and that an `=` takes the nearest color under the mouse.
 */
export const Playground: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const picture = canvas.getByRole("img");
    await expect(picture.querySelectorAll('[data-kind="glow"]')).toHaveLength(59);
    await userEvent.type(canvas.getByRole("textbox", { name: "Drawing" }), "{Enter}=");
    await expect(picture.querySelectorAll('[data-kind="glow"]')).toHaveLength(60);

    const cell = canvasElement.querySelector<HTMLElement>('[data-kind="glow"]')!;
    const { left, top, width, height } = cell.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: left + width / 2, clientY: top + height / 2 }));
    await expect(cell.style.getPropertyValue("--proximity-color")).toBe("color-mix(in srgb, var(--border), var(--brand) 100%)");
  },
};
