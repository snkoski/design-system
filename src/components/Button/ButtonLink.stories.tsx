import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Download, ExternalLink, Heart } from "lucide-react";
import { ButtonLink } from "./ButtonLink";

const meta = {
  title: "Components/Button link",
  component: ButtonLink,
  args: {
    children: "See my work",
    href: "#work",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
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

/** Small links are 32px tall but keep a 44px hit area. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLink {...args} size="sm">Small</ButtonLink>
      <ButtonLink {...args} size="md">Medium</ButtonLink>
      <ButtonLink {...args} size="lg">Large</ButtonLink>
    </div>
  ),
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
        </div>
      ))}
    </div>
  );
}

/** Every variant and size in all three themes at once. Chromatic snapshots this one. */
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
