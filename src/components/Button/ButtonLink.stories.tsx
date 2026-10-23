import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Download, ExternalLink, Heart } from "lucide-react";
import { expect } from "storybook/test";
import { ButtonLink } from "./ButtonLink";

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
  title: "Components/Button link",
  component: ButtonLink,
  args: {
    children: "See my work",
    href: "#work",
    variant: "primary",
    size: "md",
    shape: "rectangle",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    shape: { control: "inline-radio", options: ["rectangle", "pill"] },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A link that looks like a button. It renders a real `<a>`, so it navigates, can open in a new tab,
 * and is announced as a link. Use `Button` for actions, and `ButtonLink` for going somewhere.
 * It shares its styles with `Button`, but a link can't be disabled or loading: remove it instead.
 */
export const Playground: Story = {};

/** Primary for the one main destination in a view, secondary for the rest, ghost for low-emphasis links. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} variant="primary">Primary</ButtonLink>
      <ButtonLink {...args} variant="secondary">Secondary</ButtonLink>
      <ButtonLink {...args} variant="ghost">Ghost</ButtonLink>
    </div>
  ),
};

/**
 * Rectangle, the default, has four straight edges and `radius-sm` corners, and suits most links. Pill is fully
 * rounded: the softer choice, for a link that should stand apart from the forms and panels around it. Keep a group
 * the same shape. See **Choosing a button**.
 */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} shape="rectangle">Rectangle</ButtonLink>
      <ButtonLink {...args} shape="pill">Pill</ButtonLink>
      <ButtonLink {...args} shape="rectangle" iconOnly aria-label="Favorites" href="#favorites"><Heart /></ButtonLink>
      <ButtonLink {...args} shape="pill" iconOnly aria-label="Favorites" href="#favorites"><Heart /></ButtonLink>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const radius = (element: HTMLElement) => parseFloat(getComputedStyle(element).borderTopLeftRadius);
    const rectangle = canvas.getByRole("link", { name: "Rectangle" });
    const pill = canvas.getByRole("link", { name: "Pill" });
    // A rectangle's corners are radius-sm, much less than half its height; a pill's are at least half its height
    await expect(radius(rectangle)).toBe(measure("--radius-sm", canvasElement));
    await expect(radius(rectangle)).toBeLessThan(rectangle.getBoundingClientRect().height / 3);
    await expect(radius(pill)).toBeGreaterThanOrEqual(pill.getBoundingClientRect().height / 2);
  },
};

/**
 * Small links are 32px tall, but their hit area is never smaller than `target-min`: 24px with a mouse, 44px on
 * touch. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} size="sm">Small</ButtonLink>
      <ButtonLink {...args} size="md">Medium</ButtonLink>
      <ButtonLink {...args} size="lg">Large</ButtonLink>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const links = ["Small", "Medium", "Large"].map((name) => canvas.getByRole("link", { name }));
    // With a mouse, every link's visible box is already at least target-min tall
    const mouse = measure("--target-min", canvasElement);
    await expect(mouse).toBeGreaterThanOrEqual(24);
    for (const link of links) await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(mouse);
    // On touch, a small link stays shorter than target-min, and its hit area reaches above and below it
    canvasElement.dataset.pointer = "coarse";
    try {
      const touch = measure("--target-min", canvasElement);
      await expect(touch).toBeGreaterThanOrEqual(44);
      await expect(links[0]!.getBoundingClientRect().height).toBeLessThan(touch);
      for (const link of links) await expect(hitAreaReaches(link, touch)).toBe(true);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Icons are decorative and hidden from screen readers; the label does the talking. */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} iconEnd={<ArrowRight />}>Next project</ButtonLink>
      <ButtonLink {...args} variant="secondary" iconStart={<Download />} href="#resume">Download résumé</ButtonLink>
    </div>
  ),
};

/** Icon-only links require an `aria-label`. */
export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} iconOnly aria-label="Favorites" href="#favorites"><Heart /></ButtonLink>
      <ButtonLink {...args} iconOnly variant="secondary" aria-label="Favorites" href="#favorites"><Heart /></ButtonLink>
      <ButtonLink {...args} iconOnly variant="ghost" size="sm" aria-label="Favorites" href="#favorites"><Heart /></ButtonLink>
    </div>
  ),
};

/** Links that leave the site should say so in words as well as with an icon, and open with `rel="noreferrer"`. */
export const OpensInNewTab: Story = {
  args: {
    children: "Read the docs (opens in a new tab)",
    href: "https://example.com",
    target: "_blank",
    rel: "noreferrer",
    variant: "secondary",
    iconEnd: <ExternalLink />,
  },
};

const variants = ["primary", "secondary", "ghost"] as const;
const sizes = ["sm", "md", "lg"] as const;

function Matrix() {
  return (
    <div className="grid gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <ButtonLink key={size} href="#work" variant={variant} size={size}>
              {variant} {size}
            </ButtonLink>
          ))}
          <ButtonLink href="#work" variant={variant} iconEnd={<ArrowRight />}>Icon</ButtonLink>
          <ButtonLink href="#work" variant={variant} iconOnly aria-label="Favorites"><Heart /></ButtonLink>
          <ButtonLink href="#work" variant={variant} shape="pill">Pill</ButtonLink>
          <ButtonLink href="#work" variant={variant} shape="pill" iconOnly aria-label="Favorites"><Heart /></ButtonLink>
        </div>
      ))}
    </div>
  );
}

/** Every variant, size, and shape in all three themes at once. Chromatic snapshots this one. */
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
