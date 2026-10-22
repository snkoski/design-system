import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { AtSign, Search } from "lucide-react";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Button } from "../Button";
import { Input } from "./Input";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    label: "Full name",
    type: "text",
    size: "md",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "search", "tel", "url"] },
    size: { control: "inline-radio", options: ["md", "lg"] },
    value: { control: false },
    ref: { control: false },
    iconStart: { control: false },
    iconEnd: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {
  args: {
    type: "search"
  }
};

/** Empty, filled, invalid, disabled, and read-only. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <Input {...args} label="Empty" />
      <Input {...args} label="Filled" defaultValue="Ada Lovelace" />
      <Input {...args} label="Invalid" invalid defaultValue="ada@" error="Enter an email address like ada@example.com." />
      <Input {...args} label="Disabled" disabled defaultValue="Free" />
      <Input {...args} label="Read only" readOnly defaultValue="ada" />
    </div>
  ),
};

/**
 * Medium is the default. Large matches a large button, so the two line up side by side. Both are at least
 * `target-min` tall: 24px with a mouse, 44px on touch. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <Input {...args} size="md" label="Medium" />
      <Input {...args} size="lg" label="Large" />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const fields = ["Medium", "Large"].map((name) => canvas.getByRole("textbox", { name }));
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const field of fields) await expect(field.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    };
    // With a mouse, target-min is 24px
    await check(24);
    // On touch, target-min is 44px, and both sizes grow to meet it
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** The description sits between the label and the field, so people read it before they type. */
export const WithDescription: Story = {
  args: { label: "Email", type: "email", description: "We only use it to reply to you." },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: {
    label: "Email (required)",
    type: "email",
    required: true,
    invalid: true,
    defaultValue: "ada@",
    error: "Enter an email address like ada@example.com.",
  },
};

/** Icons are decorative and hidden from screen readers. Clicking one still focuses the field. */
export const WithIcons: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <Input {...args} label="Search projects" type="search" iconStart={<Search />} placeholder="Try “branding”" />
      <Input {...args} label="Username" iconEnd={<AtSign />} />
    </div>
  ),
  play: async ({ canvas }) => {
    // A real hit-test in the browser: what's under the middle of the icon must be the input itself
    const input = canvas.getByRole("searchbox", { name: "Search projects" });
    const icon = input.parentElement!.querySelector(".input__icon")!;
    const { left, top, width, height } = icon.getBoundingClientRect();
    await expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(input);
  },
};

/** Placeholders show an example. They never replace the label, because they disappear as you type. */
export const WithPlaceholder: Story = {
  args: { label: "Website", type: "url", placeholder: "https://example.com" },
};

/** A disabled field can't be focused, changed, or submitted. */
export const Disabled: Story = {
  args: { label: "Plan", disabled: true, defaultValue: "Free" },
};

/** Read-only stays focusable, so its value can be read and copied, and it is submitted with the form. */
export const ReadOnly: Story = {
  args: { label: "Username", readOnly: true, defaultValue: "ada" },
};

/** A field with no visible label, such as a search box in a toolbar, needs an `aria-label`. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Search", type: "search", iconStart: <Search />, placeholder: "Search" },
};

/** Enter submits the surrounding form, like any native field. */
export const InAForm: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("fullName")));
        }}
      >
        <Input label="Full name" name="fullName" autoComplete="name" />
        <Button type="submit" variant="secondary" className="justify-self-start">Save</Button>
        <output>{submitted && `Saved: ${submitted}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Full name" }), "Ada Lovelace{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved: Ada Lovelace");
  },
};

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <Input label="Empty" />
      <Input label="Filled" defaultValue="Ada Lovelace" />
      <Input label="Placeholder" placeholder="you@example.com" />
      <Input label="Large" size="lg" defaultValue="Ada Lovelace" />
      <Input label="Search" type="search" iconStart={<Search />} placeholder="Search projects" />
      <Input aria-label="No visible label" iconEnd={<AtSign />} defaultValue="ada" />
      <Input label="With a description" description="We only use it to reply to you." />
      <Input label="Invalid (required)" required invalid defaultValue="ada@" error="Enter an email address like ada@example.com." />
      <Input label="Disabled" disabled defaultValue="Free" />
      <Input label="Read only" readOnly defaultValue="ada" />
    </div>
  );
}

/** Every state in all three themes at once. Chromatic snapshots this one. */
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
