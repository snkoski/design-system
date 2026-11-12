import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Radio } from "@/components/RadioGroup/Radio";
import { RadioGroup } from "@/components/RadioGroup/RadioGroup";

/** A Radio only works inside a RadioGroup, so stories render one around it, unless they bring their own. */
const inGroup: Decorator = (Story, { parameters }) =>
  parameters.ownGroups ? (
    <Story />
  ) : (
    <RadioGroup aria-label="Plan" defaultValue={parameters.groupValue as string | undefined}>
      <Story />
    </RadioGroup>
  );

const meta = {
  title: "Components/Radio",
  component: Radio,
  decorators: [inGroup],
  args: {
    value: "team",
    children: "Team",
    disabled: false,
  },
  argTypes: {
    ref: { control: false },
    inputRef: { control: false },
    description: { control: "text" },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. The radio sits in a RadioGroup, which owns its selected state. */
export const Playground: Story = {};

/** Unselected, selected, and disabled. The dot says "selected", so the state never relies on color alone. */
export const States: Story = {
  parameters: { groupValue: "team" },
  render: () => (
    <>
      <Radio value="free">Unselected</Radio>
      <Radio value="team">Selected</Radio>
      <Radio value="business" disabled>
        Disabled
      </Radio>
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    const rows = ["Unselected", "Selected", "Disabled"].map((name) => canvas.getByText(name).closest("label")!);
    // With a mouse, every row is choice-row tall (32px), more than the 24px target-min
    for (const row of rows) await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    // On touch, every row is at least target-min (44px) tall, so each label is a full-size click target
    canvasElement.dataset.pointer = "coarse";
    try {
      for (const row of rows) await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** The description is linked to the radio, so screen readers read it after the label. */
export const WithDescription: Story = {
  args: { description: "Up to 10 people" },
};

/** A disabled radio can't be chosen, and the arrow keys skip it. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** With no visible label, an `aria-label` is required. The hit area is still `target-min`: 24px with a mouse, 44px on touch. */
export const WithoutVisibleLabel: Story = {
  args: { children: undefined, "aria-label": "Team plan" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const radio = canvas.getByRole("radio", { name: "Team plan" });
    const box = radio.getBoundingClientRect();
    const y = box.top + box.height / 2;
    // With a mouse, the hit area is a 24px square, so its corner, outside the round circle, still counts
    await expect(radio.contains(document.elementFromPoint(box.left + box.width / 2 + 11, y + 11)!)).toBe(true);
    // On touch, 18px right of the center is outside the 24px circle but inside the 44px hit area
    canvasElement.dataset.pointer = "coarse";
    try {
      const x = box.left + box.width / 2 + 18;
      const hit = document.elementFromPoint(x, y)!;
      await expect(radio.contains(hit)).toBe(true);
      await userEvent.click(hit);
      await expect(radio).toBeChecked();
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Radios with no visible label, one under another, as in a table. Each keeps a target of its own: 24px with a mouse, 44px on touch. */
export const StackedWithoutVisibleLabels: Story = {
  render: () => (
    <>
      <Radio value="first" aria-label="First row" />
      <Radio value="second" aria-label="Second row" />
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    const first = canvas.getByRole("radio", { name: "First row" });
    const second = canvas.getByRole("radio", { name: "Second row" });
    const heights = async (minHeight: number) => {
      for (const radio of [first, second]) {
        await expect(radio.closest(".radio")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(minHeight);
      }
    };
    const line = () => first.closest(".radio")!.getBoundingClientRect().bottom;
    const box = first.getBoundingClientRect();
    const x = box.left + box.width / 2;
    // With a mouse, each row is choice-row tall (32px), with a little space between the two 24px hit areas
    await heights(32);
    await expect(first.contains(document.elementFromPoint(x, box.bottom - 1))).toBe(true);
    await expect(second.contains(document.elementFromPoint(x, line() - 3))).toBe(false);
    // On touch, each row is target-min tall (44px)
    canvasElement.dataset.pointer = "coarse";
    try {
      await heights(44);
      // Just above the line between them still belongs to the first radio, not the second
      await expect(first.contains(document.elementFromPoint(x, line() - 3))).toBe(true);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

function Matrix({ theme }: { theme: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RadioGroup aria-label="Plain" name={`${theme}-plain`} defaultValue="team">
        <Radio value="free">Unselected</Radio>
        <Radio value="team">Selected</Radio>
        <Radio value="none" aria-label="No visible label" />
      </RadioGroup>
      <RadioGroup aria-label="Invalid" name={`${theme}-invalid`} invalid defaultValue="team">
        <Radio value="free">Invalid</Radio>
        <Radio value="team">Invalid and selected</Radio>
      </RadioGroup>
      <RadioGroup aria-label="Disabled" name={`${theme}-disabled`} defaultValue="team">
        <Radio value="free" disabled>
          Disabled
        </Radio>
        <Radio value="team" disabled>
          Disabled and selected
        </Radio>
      </RadioGroup>
      <RadioGroup aria-label="Read only" name={`${theme}-read-only`} readOnly defaultValue="team">
        <Radio value="free">Read only</Radio>
        <Radio value="team" description="With a description">
          Read only and selected
        </Radio>
      </RadioGroup>
    </div>
  );
}

/** Every state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen", ownGroups: true },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Matrix theme={theme} />
        </section>
      ))}
    </div>
  ),
};
