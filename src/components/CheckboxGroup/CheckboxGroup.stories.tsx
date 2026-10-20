import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Checkbox } from "../Checkbox";
import { CheckboxGroup } from "./CheckboxGroup";

const options = (
  <>
    <Checkbox value="design">Design</Checkbox>
    <Checkbox value="development">Development</Checkbox>
    <Checkbox value="writing">Writing</Checkbox>
  </>
);
const allValues = ["design", "development", "writing"];

const meta = {
  title: "Components/Checkbox group",
  component: CheckboxGroup,
  args: {
    label: "Services",
    name: "services",
    defaultValue: ["design"],
    disabled: false,
    readOnly: false,
    invalid: false,
    onValueChange: fn(),
    children: options,
  },
  argTypes: {
    value: { control: false },
    allValues: { control: false },
    children: { control: false },
    ref: { control: false },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Nothing ticked, some ticked, and every state of the group side by side. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-6 sm:grid-cols-2">
      <CheckboxGroup {...args} label="Nothing ticked" defaultValue={[]} />
      <CheckboxGroup {...args} label="Some ticked" defaultValue={["design", "writing"]} />
      <CheckboxGroup {...args} label="Invalid" invalid error="Choose at least one service." defaultValue={[]} />
      <CheckboxGroup {...args} label="Disabled" disabled />
      <CheckboxGroup {...args} label="Read only" readOnly />
      <CheckboxGroup {...args} label="One option disabled">
        <Checkbox value="design">Design</Checkbox>
        <Checkbox value="development" disabled>
          Development (fully booked)
        </Checkbox>
        <Checkbox value="writing">Writing</Checkbox>
      </CheckboxGroup>
    </div>
  ),
};

/** The description sits between the label and the options, so it's read before choosing. Options can have their own. */
export const WithDescription: Story = {
  args: {
    description: "Pick any that apply. We'll send a quote for each.",
    children: (
      <>
        <Checkbox value="design" description="Logos, layouts, and brand books">
          Design
        </Checkbox>
        <Checkbox value="development" description="Sites and apps">
          Development
        </Checkbox>
        <Checkbox value="writing">Writing</Checkbox>
      </>
    ),
  },
};

/**
 * There's no `required` prop, because a group has no required state in ARIA. Say "(required)" in the label,
 * check the value yourself, and pair `invalid` with `error`: every box gets a danger edge, and the message has words and an icon.
 */
export const Invalid: Story = {
  args: {
    label: "Services (required)",
    defaultValue: [],
    invalid: true,
    error: "Choose at least one service.",
  },
};

/** A disabled group can't be focused or changed, and isn't submitted. Ticked options stay ticked. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Read-only keeps every option in the tab order, so the choices can still be read, but blocks changes. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: ["design", "writing"] },
};

/** With no visible label, an `aria-label` names the group. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Services" },
};

/**
 * A `Checkbox parent` ticks or unticks every option, and shows a dash when only some are ticked. It needs
 * `allValues`. From a mix you made, clicking it goes to all, then none, then back to your mix.
 */
export const SelectAll: Story = {
  args: {
    allValues,
    defaultValue: ["design"],
    children: (
      <>
        <Checkbox parent>All services</Checkbox>
        {options}
      </>
    ),
  },
  play: async ({ canvas, userEvent }) => {
    const parent = canvas.getByRole("checkbox", { name: "All services" });
    const design = canvas.getByRole("checkbox", { name: "Design" });
    // The options' boxes line up under the parent's label text
    const parentText = canvas.getByText("All services").getBoundingClientRect();
    expect(Math.abs(design.getBoundingClientRect().left - parentText.left)).toBeLessThan(1);

    await expect(parent).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(parent);
    await expect(canvas.getByRole("checkbox", { name: "Writing" })).toBeChecked();
    await userEvent.click(parent);
    await expect(design).not.toBeChecked();
    await userEvent.click(parent);
    await expect(design).toBeChecked();
    await expect(parent).toHaveAttribute("aria-checked", "mixed");
  },
};

/** Controlled with state: the group reports the whole list of ticked values each time. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string[]>(["writing"]);
    return (
      <div className="grid gap-2">
        <CheckboxGroup {...args} value={value} onValueChange={setValue} />
        <output>Ticked: {value.length ? value.join(", ") : "none"}</output>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Design"));
    await expect(canvas.getByRole("status")).toHaveTextContent("Ticked: writing, design");
  },
};

function Matrix() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <CheckboxGroup label="Services" defaultValue={["design"]} description="Pick any that apply.">
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Select all" allValues={allValues} defaultValue={["design"]}>
        <Checkbox parent>All services</Checkbox>
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Invalid (required)" invalid error="Choose at least one service.">
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Disabled" disabled defaultValue={["design"]} description="Booking opens in May.">
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Read only" readOnly defaultValue={["design", "writing"]} description="Chosen when you signed up.">
        {options}
      </CheckboxGroup>
      <CheckboxGroup
        label="Invalid, ticked, with a description"
        invalid
        defaultValue={["writing"]}
        description="Pick the services you need."
        error="Writing needs design or development too."
      >
        {options}
      </CheckboxGroup>
      <CheckboxGroup aria-label="Services, no visible label" defaultValue={["development"]}>
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Select all, read only" readOnly allValues={allValues} defaultValue={["design"]}>
        <Checkbox parent>All services</Checkbox>
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="Select all, disabled" disabled allValues={allValues} defaultValue={["design"]}>
        <Checkbox parent>All services</Checkbox>
        {options}
      </CheckboxGroup>
      <CheckboxGroup label="One option disabled" defaultValue={["development"]}>
        <Checkbox value="design" description="Logos and layouts">
          Design
        </Checkbox>
        <Checkbox value="development" disabled>
          Development (fully booked)
        </Checkbox>
        <Checkbox value="writing">Writing</Checkbox>
      </CheckboxGroup>
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
