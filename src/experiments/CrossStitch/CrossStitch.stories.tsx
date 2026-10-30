import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { CrossStitch } from "./CrossStitch";

const meta = {
  title: "Experiments/Cross stitch",
  component: CrossStitch,
  parameters: { layout: "fullscreen" },
  args: { defaultColumns: 40, defaultRows: 30 },
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CrossStitch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A sunset, drawn on a canvas and handed to the file input as a PNG, the way a chosen photo would be */
async function sunset() {
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [320, 200];
  const context = canvas.getContext("2d")!;
  const sky = context.createLinearGradient(0, 0, 0, 140);
  sky.addColorStop(0, "#2b2d6e");
  sky.addColorStop(0.5, "#d9486a");
  sky.addColorStop(1, "#f7b267");
  context.fillStyle = sky;
  context.fillRect(0, 0, 320, 140);
  context.fillStyle = "#ffe08a";
  context.beginPath();
  context.arc(160, 140, 40, Math.PI, 0);
  context.fill();
  context.fillStyle = "#1d3b53";
  context.fillRect(0, 140, 320, 60);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
  return new File([blob], "sunset.png", { type: "image/png" });
}

/** Pick a color and click, drag, or use the arrow keys and Space on the chart. Or choose a photo. */
export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    const chart = canvas.getByRole("application", { name: "Pattern, 40 stitches across and 30 down" });
    await expect(canvas.getByText("(0 used, 0 stitches)")).toBeInTheDocument();
    chart.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown} ");
    await expect(canvas.getByText("(1 used, 1 stitch)")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await expect(canvas.getByText("(0 used, 0 stitches)")).toBeInTheDocument();
  },
};

/** A photo turned into a pattern. The Colors slider reduces it; fewer colors are flatter and quicker to stitch. */
export const FromAPhoto: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Choose a photo") as HTMLInputElement;
    await userEvent.upload(input, await sunset());
    const colors = await canvas.findByRole("slider", { name: "Colors" });
    // The chart follows the photo's shape: 320 × 200 at 40 across is 25 down
    await expect(canvas.getByRole("application", { name: "Pattern, 40 stitches across and 25 down" })).toBeInTheDocument();
    const suggested = Number((colors as HTMLInputElement).value);
    await expect(suggested).toBeGreaterThan(2);
    // Every stitch is stitched: a photo has no bare fabric
    await expect(canvas.getByText(`(${suggested} used, 1000 stitches)`)).toBeInTheDocument();
    // Down to three colors. Simulated keys don't move a range input, so set it as a drag would
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(colors, "3");
    colors.dispatchEvent(new Event("input", { bubbles: true }));
    await waitFor(() => expect(canvas.getByText("(3 used, 1000 stitches)")).toBeInTheDocument());
  },
};
