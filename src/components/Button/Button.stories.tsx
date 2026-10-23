import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Download, Heart, Plus } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "./Button";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** Whether a click just inside `size` from an element's center, above, below, left, and right of it, reaches the element */
function hitAreaReaches(element: Element, size: number) {
  const box = element.getBoundingClientRect();
  const [x, y, reach] = [box.left + box.width / 2, box.top + box.height / 2, size / 2 - 1];
  const points: [number, number][] = [[x, y - reach], [x, y + reach], [x - reach, y], [x + reach, y]];
  return points.every(([px, py]) => element.contains(document.elementFromPoint(px, py)));
}

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "See my work",
    variant: "primary",
    size: "md",
    shape: "rectangle",
    loading: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    shape: { control: "inline-radio", options: ["rectangle", "pill"] },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Primary for the one main action in a view, secondary for everything else, ghost for low-emphasis actions in toolbars and menus. See **Choosing a button** for the full guidance. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
    </div>
  ),
};

/**
 * Rectangle, the default, has four straight edges and `radius-sm` corners, and suits most buttons. Pill is fully
 * rounded: the softer choice, for a button that should stand apart from the forms and panels around it. Keep a group
 * the same shape. See **Choosing a button**.
 */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} shape="rectangle">Rectangle</Button>
      <Button {...args} shape="pill">Pill</Button>
      <Button {...args} shape="rectangle" iconOnly aria-label="Add to favorites"><Heart /></Button>
      <Button {...args} shape="pill" iconOnly aria-label="Add to favorites"><Heart /></Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const radius = (element: HTMLElement) => parseFloat(getComputedStyle(element).borderTopLeftRadius);
    const rectangle = canvas.getByRole("button", { name: "Rectangle" });
    const pill = canvas.getByRole("button", { name: "Pill" });
    // A rectangle's corners are radius-sm, much less than half its height; a pill's are at least half its height
    await expect(radius(rectangle)).toBe(measure("--radius-sm", canvasElement));
    await expect(radius(rectangle)).toBeLessThan(rectangle.getBoundingClientRect().height / 3);
    await expect(radius(pill)).toBeGreaterThanOrEqual(pill.getBoundingClientRect().height / 2);
  },
};

/**
 * Small buttons are 32px tall, but their hit area is never smaller than `target-min`: 24px with a mouse, 44px on
 * touch. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const buttons = ["Small", "Medium", "Large"].map((name) => canvas.getByRole("button", { name }));
    // With a mouse, every button's visible box is already at least target-min tall
    const mouse = measure("--target-min", canvasElement);
    await expect(mouse).toBeGreaterThanOrEqual(24);
    for (const button of buttons) await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(mouse);
    // On touch, a small button stays shorter than target-min, and its hit area reaches above and below it
    canvasElement.dataset.pointer = "coarse";
    try {
      const touch = measure("--target-min", canvasElement);
      await expect(touch).toBeGreaterThanOrEqual(44);
      await expect(buttons[0]!.getBoundingClientRect().height).toBeLessThan(touch);
      for (const button of buttons) await expect(hitAreaReaches(button, touch)).toBe(true);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Icons are decorative and hidden from screen readers; the label does the talking. */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} iconStart={<Download />}>Download résumé</Button>
      <Button {...args} variant="secondary" iconEnd={<ArrowRight />}>Next project</Button>
      <Button {...args} variant="ghost" size="sm" iconStart={<Plus />}>Add tag</Button>
    </div>
  ),
};

/**
 * In a narrow space, a label that doesn't fit wraps onto more lines and the button grows taller. It's never cut off
 * with an ellipsis, so the whole label stays readable. The story checks every button stays inside its container,
 * and every label inside its button.
 */
export const Narrow: Story = {
  render: (args) => (
    <div className="grid w-40 justify-items-start gap-3" data-testid="narrow">
      <Button {...args} iconStart={<Download />}>Download résumé as a PDF</Button>
      <Button {...args} variant="secondary" iconEnd={<ArrowRight />}>See the whole project</Button>
      <Button {...args} variant="secondary">Send message</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByTestId("narrow").getBoundingClientRect();
    const [wrapped, , short] = canvas.getAllByRole("button");
    // The long label wraps, so its button is taller than one with a short label
    await expect(wrapped!.getBoundingClientRect().height).toBeGreaterThan(short!.getBoundingClientRect().height);
    for (const element of canvas.getAllByRole("button")) {
      const box = element.getBoundingClientRect();
      await expect(box.right).toBeLessThanOrEqual(container.right + 0.5);
      // The text itself, not its box: text cut off or spilling out would reach past the button's edges
      const text = document.createRange();
      text.selectNodeContents(element.querySelector(".button__label")!);
      const words = text.getBoundingClientRect();
      await expect(words.left).toBeGreaterThanOrEqual(box.left);
      await expect(words.right).toBeLessThanOrEqual(box.right);
      await expect(words.bottom).toBeLessThanOrEqual(box.bottom);
    }
  },
};

/**
 * Icon-only buttons require an `aria-label`. A small one is a 32px square, but its hit area is never smaller than
 * `target-min`: 24px with a mouse, 44px on touch. The story checks both.
 */
export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} iconOnly aria-label="Add to favorites"><Heart /></Button>
      <Button {...args} iconOnly variant="secondary" aria-label="Add to favorites"><Heart /></Button>
      <Button {...args} iconOnly variant="ghost" size="sm" aria-label="Add to favorites"><Heart /></Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const buttons = canvas.getAllByRole("button", { name: "Add to favorites" });
    const small = buttons.find((button) => button.dataset.size === "sm")!;
    // With a mouse, every icon-only button, the small one too, is at least target-min wide and tall
    const mouse = measure("--target-min", canvasElement);
    await expect(mouse).toBeGreaterThanOrEqual(24);
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      await expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(mouse);
    }
    // On touch, the small one stays smaller than target-min, and its hit area reaches target-min on every side
    canvasElement.dataset.pointer = "coarse";
    try {
      const touch = measure("--target-min", canvasElement);
      await expect(touch).toBeGreaterThanOrEqual(44);
      const box = small.getBoundingClientRect();
      await expect(Math.max(box.width, box.height)).toBeLessThan(touch);
      await expect(hitAreaReaches(small, touch)).toBe(true);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Loading blocks clicks but stays focusable, so keyboard users don't lose their place. */
export const Loading: Story = {
  args: { loading: true, children: "Sending message" },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} disabled variant="primary">Primary</Button>
      <Button {...args} disabled variant="secondary">Secondary</Button>
      <Button {...args} disabled variant="ghost">Ghost</Button>
    </div>
  ),
};

const variants = ["primary", "secondary", "ghost"] as const;
const sizes = ["sm", "md", "lg"] as const;

function Matrix() {
  return (
    <div className="grid gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant} {size}
            </Button>
          ))}
          <Button variant={variant} iconStart={<Download />}>Icon</Button>
          <Button variant={variant} shape="pill">Pill</Button>
          <Button variant={variant} iconOnly aria-label="Add to favorites"><Heart /></Button>
          <Button variant={variant} shape="pill" iconOnly aria-label="Add to favorites"><Heart /></Button>
          <Button variant={variant} loading>Loading</Button>
          <Button variant={variant} disabled>Disabled</Button>
        </div>
      ))}
    </div>
  );
}

/** Every variant, size, shape, and state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Matrix />
        </section>
      ))}
    </div>
  ),
};
