import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Radio } from "@/components/RadioGroup/Radio";
import { RadioGroup } from "@/components/RadioGroup/RadioGroup";

const options = (
  <>
    <Radio value="free">Free</Radio>
    <Radio value="team">Team</Radio>
    <Radio value="business">Business</Radio>
  </>
);

const meta = {
  title: "Components/Radio group",
  component: RadioGroup,
  args: {
    label: "Plan",
    name: "plan",
    defaultValue: "free",
    required: false,
    disabled: false,
    readOnly: false,
    invalid: false,
    onValueChange: fn(),
    children: options,
  },
  argTypes: {
    value: { control: false },
    children: { control: false },
    ref: { control: false },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Nothing selected, one selected, and every state of the group side by side. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-6 sm:grid-cols-2">
      <RadioGroup {...args} label="Nothing selected" name="nothing" defaultValue={undefined} />
      <RadioGroup {...args} label="One selected" name="one" defaultValue="team" />
      <RadioGroup {...args} label="Invalid" name="invalid" defaultValue={undefined} invalid error="Choose a plan." />
      <RadioGroup {...args} label="Disabled" name="disabled" disabled />
      <RadioGroup {...args} label="Read only" name="read-only" readOnly />
      <RadioGroup {...args} label="One option disabled" name="one-disabled">
        <Radio value="free">Free</Radio>
        <Radio value="team" disabled>
          Team (sold out)
        </Radio>
        <Radio value="business">Business</Radio>
      </RadioGroup>
    </div>
  ),
};

/** The description sits between the label and the options, so it's read before choosing. Radios can have their own. */
export const WithDescription: Story = {
  args: {
    description: "You can change your plan at any time.",
    children: (
      <>
        <Radio value="free" description="For one person">
          Free
        </Radio>
        <Radio value="team" description="Up to 10 people">
          Team
        </Radio>
        <Radio value="business" description="Unlimited people, with support">
          Business
        </Radio>
      </>
    ),
  },
};

/**
 * `required` announces the group as required and stops the form from submitting until a radio is selected.
 * Say "(required)" in the label too. To show your own error, give the form `noValidate`, then set `invalid` and `error`.
 */
export const Required: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    return (
      <form
        noValidate
        className="grid justify-items-start gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <RadioGroup
          {...args}
          label="Plan (required)"
          required
          defaultValue={undefined}
          value={value}
          onValueChange={setValue}
          invalid={submitted && value === null}
          error="Choose a plan."
        />
        <button type="submit">Continue</button>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
    await expect(canvas.getByText("Choose a plan.")).toBeVisible();
    await userEvent.click(canvas.getByText("Team"));
    // Base UI takes the error away a render after the change, so wait for it rather than checking straight away
    await waitFor(() => expect(canvas.queryByText("Choose a plan.")).toBeNull());
  },
};

/** Pair `invalid` with `error`: every circle gets a danger edge, and the message has words and an icon. */
export const Invalid: Story = {
  args: { label: "Plan (required)", defaultValue: undefined, invalid: true, error: "Choose a plan." },
};

/** A disabled group can't be changed and isn't submitted. Its selected radio can still be reached with Tab, announced as disabled. */
export const Disabled: Story = {
  args: { disabled: true, description: "Plans can be changed after your trial." },
  play: async ({ canvas, userEvent }) => {
    // Tab still reaches the selected radio, so its focus outline must not be dimmed with it
    await userEvent.tab();
    const radio = canvas.getByRole("radio", { name: "Free" });
    await expect(radio).toHaveFocus();
    await expect(getComputedStyle(radio).opacity).toBe("1");
  },
};

/** Read-only keeps the group in the tab order, so the choice can be read, but blocks changes. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "team", description: "Chosen by your organization." },
};

/** With no visible label, an `aria-label` names the group. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Plan" },
};

/** The group is one Tab stop. The arrow keys move between radios and select them, wrapping at the ends. */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: "Free" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("radio", { name: "Team" })).toBeChecked();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(canvas.getByRole("radio", { name: "Business" })).toBeChecked();
  },
};

/** Controlled with state. `null` means nothing is selected. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>("team");
    return (
      <div className="grid justify-items-start gap-2">
        <RadioGroup {...args} defaultValue={undefined} value={value} onValueChange={setValue} />
        <output>Selected: {value ?? "none"}</output>
        <button type="button" onClick={() => setValue(null)}>
          Clear choice
        </button>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Business"));
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: business");
    await userEvent.click(canvas.getByRole("button", { name: "Clear choice" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: none");
  },
};

function Matrix({ theme }: { theme: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <RadioGroup label="Plan" name={`${theme}-plan`} defaultValue="team" description="You can change it later.">
        {options}
      </RadioGroup>
      <RadioGroup label="Nothing selected" name={`${theme}-nothing`}>
        {options}
      </RadioGroup>
      <RadioGroup label="Invalid (required)" name={`${theme}-invalid`} required invalid error="Choose a plan.">
        {options}
      </RadioGroup>
      <RadioGroup
        label="Invalid, selected, with a description"
        name={`${theme}-invalid-selected`}
        invalid
        defaultValue="free"
        description="Free has no shared projects."
        error="This team needs shared projects."
      >
        {options}
      </RadioGroup>
      <RadioGroup label="Disabled" name={`${theme}-disabled`} disabled defaultValue="team" description="Plans can be changed after your trial.">
        {options}
      </RadioGroup>
      <RadioGroup label="Read only" name={`${theme}-read-only`} readOnly defaultValue="team" description="Chosen by your organization.">
        {options}
      </RadioGroup>
      <RadioGroup aria-label="Plan, no visible label" name={`${theme}-unlabelled`} defaultValue="business">
        {options}
      </RadioGroup>
      <RadioGroup label="With descriptions, one disabled" name={`${theme}-descriptions`} defaultValue="free">
        <Radio value="free" description="For one person">
          Free
        </Radio>
        <Radio value="team" disabled description="Sold out this month">
          Team
        </Radio>
        <Radio value="business">Business</Radio>
      </RadioGroup>
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
          <Matrix theme={theme} />
        </section>
      ))}
    </div>
  ),
};
