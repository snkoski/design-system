import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Checkbox } from "@/components/Checkbox/Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    children: "Email me about new projects",
    defaultChecked: false,
    indeterminate: false,
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onCheckedChange: fn(),
  },
  argTypes: {
    checked: { control: false },
    ref: { control: false },
    inputRef: { control: false },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Unticked, ticked, and mixed. The mark is a tick or a dash, so the state never relies on color alone. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-1">
      <Checkbox {...args}>Unticked</Checkbox>
      <Checkbox {...args} defaultChecked>Ticked</Checkbox>
      <Checkbox {...args} indeterminate>Mixed</Checkbox>
    </div>
  ),
};

/** The description is linked to the checkbox, so screen readers read it after the label. */
export const WithDescription: Story = {
  args: {
    children: "Email me about new projects",
    description: "About once a month. You can unsubscribe at any time.",
  },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: {
    children: "I accept the terms (required)",
    required: true,
    invalid: true,
    error: "You need to accept the terms to continue.",
  },
};

/**
 * A link in the label, such as the terms to accept, is ink and underlined like every link inside a component,
 * not the page's brand-colored link.
 */
export const LinkInLabel: Story = {
  render: (args) => (
    <Checkbox {...args}>
      I accept the <a href="#terms">terms and conditions</a>
    </Checkbox>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "terms and conditions" });
    const label = link.closest<HTMLElement>(".checkbox__label")!;
    const ink = getComputedStyle(label).color;
    await expect(getComputedStyle(link).color).toBe(ink);
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    // The link's color is set, not inherited (Tailwind's reset makes links inherit): recoloring the label leaves it ink
    label.style.color = "red";
    try {
      await expect(getComputedStyle(label).color).not.toBe(ink);
      await expect(getComputedStyle(link).color).toBe(ink);
    } finally {
      label.style.color = "";
    }
  },
};

/** A disabled checkbox can't be focused or changed. It keeps its ticked state. */
export const Disabled: Story = {
  render: (args) => (
    <div className="grid gap-1">
      <Checkbox {...args} disabled>Unticked and disabled</Checkbox>
      <Checkbox {...args} disabled defaultChecked>Ticked and disabled</Checkbox>
    </div>
  ),
};

/** Read-only keeps the checkbox in the tab order, so its value can still be read, but blocks changes. */
export const ReadOnly: Story = {
  args: { children: "Joined in 2024", readOnly: true, defaultChecked: true },
};

/** With no visible label, such as a row in a table, an `aria-label` is required. The hit area is still `target-min`: 24px with a mouse, 44px on touch. */
export const WithoutVisibleLabel: Story = {
  args: { children: undefined, "aria-label": "Select row 3" },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole("checkbox", { name: "Select row 3" });
    const height = () => control.closest(".checkbox")!.getBoundingClientRect().height;
    // With a mouse, its own box is choice-row tall (32px), more than its 24px hit area
    await expect(height()).toBeGreaterThanOrEqual(32);
    // On touch, its box is target-min tall, so its 44px hit area doesn't spill into the control above or below it
    canvasElement.dataset.pointer = "coarse";
    try {
      await expect(height()).toBeGreaterThanOrEqual(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** A "select all" box shows a dash when only some of the boxes below it are ticked. You decide the next state. */
export const SelectAll: Story = {
  render: () => {
    const options = ["Design", "Development", "Writing"];
    const [selected, setSelected] = useState<string[]>(["Design"]);
    const all = selected.length === options.length;
    const none = selected.length === 0;
    return (
      <div className="grid gap-1">
        <Checkbox
          checked={all}
          indeterminate={!all && !none}
          onCheckedChange={(checked) => setSelected(checked ? options : [])}
        >
          All services
        </Checkbox>
        <div className="grid gap-1 ps-9">
          {options.map((option) => (
            <Checkbox
              key={option}
              checked={selected.includes(option)}
              onCheckedChange={(checked) =>
                setSelected((current) => (checked ? [...current, option] : current.filter((item) => item !== option)))
              }
            >
              {option}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <Checkbox>Unticked</Checkbox>
        <Checkbox defaultChecked>Ticked</Checkbox>
        <Checkbox indeterminate>Mixed</Checkbox>
        <Checkbox aria-label="No visible label" defaultChecked />
      </div>
      <div className="grid gap-1">
        <Checkbox disabled>Disabled</Checkbox>
        <Checkbox disabled defaultChecked>Disabled and ticked</Checkbox>
        <Checkbox readOnly defaultChecked>Read only</Checkbox>
      </div>
      <Checkbox defaultChecked description="About once a month. You can unsubscribe at any time.">
        With a description
      </Checkbox>
      <Checkbox required invalid error="You need to accept the terms to continue.">
        Invalid, with an error (required)
      </Checkbox>
      <Checkbox required invalid defaultChecked error="Ticked but still invalid.">
        Invalid and ticked
      </Checkbox>
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
