import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Download, Heart, Plus } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "See my work",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Primary for the one main action in a view, secondary for everything else, ghost for low-emphasis actions in toolbars and menus. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
    </div>
  ),
};

/** Small buttons are 32px tall but keep a 44px hit area. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
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

/** Icon-only buttons require an `aria-label`. */
export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} iconOnly aria-label="Add to favorites"><Heart /></Button>
      <Button {...args} iconOnly variant="secondary" aria-label="Add to favorites"><Heart /></Button>
      <Button {...args} iconOnly variant="ghost" size="sm" aria-label="Add to favorites"><Heart /></Button>
    </div>
  ),
};

/** Loading blocks clicks but stays focusable, so keyboard users don't lose their place. */
export const Loading: Story = {
  args: { loading: true, children: "Sending message" },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Sending message" });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
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

/** Clicking calls `onClick` once. */
export const ClickTest: Story = {
  args: { children: "Send message" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
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
            <Button key={size} variant={variant} size={size}>
              {variant} {size}
            </Button>
          ))}
          <Button variant={variant} iconStart={<Download />}>Icon</Button>
          <Button variant={variant} loading>Loading</Button>
          <Button variant={variant} disabled>Disabled</Button>
        </div>
      ))}
    </div>
  );
}

/** Every variant, size, and state in all three themes at once. Chromatic snapshots this one. */
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
