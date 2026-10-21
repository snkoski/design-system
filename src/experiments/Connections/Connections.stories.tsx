import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Bounce } from "../Bounce/Bounce";
import { Connections } from "./Connections";

const page = { background: "var(--bg)", color: "var(--ink)" };
const emoji = ["🌭", "🦄", "👀", "✨", "🍕", "🐱", "🍩", "⭐"];

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
    lineWidth: { control: { type: "range", min: 0.5, max: 6, step: 0.5 } },
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
