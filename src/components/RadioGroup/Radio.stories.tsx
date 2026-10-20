import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Radio } from "./Radio";
import { RadioGroup } from "./RadioGroup";

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
  play: async ({ canvas }) => {
    // Every row is at least target-min (44px) tall, so each label is a full-size click target
    for (const name of ["Unselected", "Selected", "Disabled"]) {
      const row = canvas.getByText(name).closest("label")!;
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
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

/** With no visible label, an `aria-label` is required. The hit area is still 44px. */
export const WithoutVisibleLabel: Story = {
  args: { children: undefined, "aria-label": "Team plan" },
  play: async ({ canvas, userEvent }) => {
    const radio = canvas.getByRole("radio", { name: "Team plan" });
    const box = radio.getBoundingClientRect();
    // 18px right of the center is outside the 24px circle but inside the 44px hit area
    const x = box.left + box.width / 2 + 18;
    const y = box.top + box.height / 2;
    const hit = document.elementFromPoint(x, y)!;
    await expect(radio.contains(hit)).toBe(true);
    await userEvent.click(hit);
    await expect(radio).toBeChecked();
  },
};

/** Radios with no visible label, one under another, as in a table. Each keeps a 44px target of its own. */
export const StackedWithoutVisibleLabels: Story = {
  render: () => (
    <>
      <Radio value="first" aria-label="First row" />
      <Radio value="second" aria-label="Second row" />
    </>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByRole("radio", { name: "First row" });
    const second = canvas.getByRole("radio", { name: "Second row" });
    for (const radio of [first, second]) {
      await expect(radio.closest(".radio")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    // Just above the line between them still belongs to the first radio, not the second
    const line = first.closest(".radio")!.getBoundingClientRect().bottom;
    const box = first.getBoundingClientRect();
    await expect(first.contains(document.elementFromPoint(box.left + box.width / 2, line - 3))).toBe(true);
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
