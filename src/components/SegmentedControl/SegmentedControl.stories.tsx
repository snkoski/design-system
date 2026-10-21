import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutGrid, List, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Button } from "../Button";
import { Input } from "../Input";
import { Segment } from "./Segment";
import { SegmentedControl } from "./SegmentedControl";

const options = (
  <>
    <Segment value="monthly">Monthly</Segment>
    <Segment value="yearly">Yearly</Segment>
    <Segment value="lifetime">Lifetime</Segment>
  </>
);

/** The px value of a length token, measured in the browser */
function measure(token: string) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  document.body.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** Whether a click just inside the track's top and bottom edges, above and below each option's center, reaches that option */
function edgesReachOptions(track: Element) {
  const box = track.getBoundingClientRect();
  return [...track.querySelectorAll<HTMLElement>(".segment__button")].every((option) => {
    const x = option.getBoundingClientRect().left + option.getBoundingClientRect().width / 2;
    return [box.top + 0.5, box.bottom - 0.5].every((y) => option.contains(document.elementFromPoint(x, y)));
  });
}

const meta = {
  title: "Components/Segmented control",
  component: SegmentedControl,
  args: {
    label: "Billing",
    name: "billing",
    defaultValue: "monthly",
    size: "md",
    required: false,
    disabled: false,
    readOnly: false,
    invalid: false,
    onValueChange: fn(),
    children: options,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    value: { control: false },
    children: { control: false },
    ref: { control: false },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Nothing chosen, one chosen, and every state of the control side by side. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-6">
      <SegmentedControl {...args} label="One chosen" name="one" />
      <SegmentedControl {...args} label="Nothing chosen" name="nothing" defaultValue={undefined} />
      <SegmentedControl {...args} label="Invalid" name="invalid" defaultValue={undefined} invalid error="Choose how to pay." />
      <SegmentedControl {...args} label="Disabled" name="disabled" disabled />
      <SegmentedControl {...args} label="Read only" name="read-only" readOnly />
      <SegmentedControl {...args} label="One option disabled" name="one-disabled">
        <Segment value="monthly">Monthly</Segment>
        <Segment value="yearly" disabled>
          Yearly
        </Segment>
        <Segment value="lifetime">Lifetime</Segment>
      </SegmentedControl>
    </div>
  ),
};

/**
 * The chosen option is filled, and its label turns bold, so it doesn't rely on color. A hidden bold copy of each
 * label sets its width, so the control stays the same width whichever option is chosen. The story checks it.
 */
export const Choosing: Story = {
  args: { label: "Plan", name: "plan" },
  render: (args) => (
    <SegmentedControl {...args} defaultValue="a">
      <Segment value="a">Free</Segment>
      <Segment value="b">Professional</Segment>
      <Segment value="c">Team</Segment>
    </SegmentedControl>
  ),
  play: async ({ canvas, userEvent }) => {
    const track = canvas.getByRole("radiogroup").querySelector(".segmented-control__track")!;
    const width = track.getBoundingClientRect().width;
    for (const name of ["Professional", "Team", "Free"]) {
      await userEvent.click(canvas.getByRole("radio", { name }));
      await expect(canvas.getByRole("radio", { name })).toHaveAttribute("aria-checked", "true");
      await expect(getComputedStyle(canvas.getByRole("radio", { name })).fontWeight).toBe("600");
      await expect(track.getBoundingClientRect().width).toBe(width);
    }
  },
};

/**
 * Medium is the default. Each size is as tall as an Input and a Button of the same size, so they line up in a row.
 * The story checks the heights, and that a click anywhere from the top to the bottom edge reaches an option.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-6">
      {(["md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-end gap-3" data-testid={size}>
          <SegmentedControl {...args} size={size} label={size === "md" ? "Medium" : "Large"} name={size} />
          <Input aria-label={`Amount (${size})`} size={size} defaultValue="12" className="w-24" />
          <Button size={size} variant="secondary">
            Apply
          </Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const target = measure("--target-min");
    await expect(target).toBeGreaterThan(0);
    for (const size of ["md", "lg"]) {
      const row = canvas.getByTestId(size);
      const track = row.querySelector(".segmented-control__track")!;
      const height = track.getBoundingClientRect().height;
      await expect(height).toBeGreaterThanOrEqual(target);
      await expect(Math.abs(row.querySelector(".input__control")!.getBoundingClientRect().height - height)).toBeLessThan(0.5);
      await expect(Math.abs(row.querySelector("button.button")!.getBoundingClientRect().height - height)).toBeLessThan(0.5);
      await expect(edgesReachOptions(track)).toBe(true);
    }
  },
};

/**
 * Icons before or after the label, or both, like Button. Icons are decorative: the label names the option. A
 * chosen option's icon gets thicker lines, the icon version of bold.
 */
export const WithIcons: Story = {
  render: (args) => (
    <div className="grid gap-6">
      <SegmentedControl {...args} label="Theme" name="theme" defaultValue="light">
        <Segment value="light" iconStart={<Sun />}>
          Light
        </Segment>
        <Segment value="dark" iconStart={<Moon />}>
          Dark
        </Segment>
        <Segment value="system" iconStart={<Monitor />}>
          System
        </Segment>
      </SegmentedControl>
      <SegmentedControl {...args} label="Billing" name="billing-icons" defaultValue="lifetime">
        <Segment value="monthly">Monthly</Segment>
        <Segment value="yearly">Yearly</Segment>
        <Segment value="lifetime" iconEnd={<Sparkles />}>
          Lifetime
        </Segment>
      </SegmentedControl>
    </div>
  ),
};

/**
 * Icon-only options need an `aria-label`. Use icons whose meaning is obvious, since sighted people see no words.
 * Each option is still at least 44px wide, which the story checks, along with its thicker lines when chosen.
 */
export const IconOnly: Story = {
  args: { label: undefined, "aria-label": "View", name: "view" },
  render: (args) => (
    <SegmentedControl {...args} defaultValue="list">
      <Segment value="list" iconOnly aria-label="List">
        <List />
      </Segment>
      <Segment value="grid" iconOnly aria-label="Grid">
        <LayoutGrid />
      </Segment>
    </SegmentedControl>
  ),
  play: async ({ canvas, userEvent }) => {
    const target = measure("--target-min");
    const stroke = (name: string) => getComputedStyle(canvas.getByRole("radio", { name }).querySelector("svg")!).strokeWidth;
    for (const name of ["List", "Grid"]) {
      await expect(canvas.getByRole("radio", { name }).getBoundingClientRect().width).toBeGreaterThanOrEqual(target);
    }
    await expect(parseFloat(stroke("List"))).toBeGreaterThan(parseFloat(stroke("Grid")));
    await userEvent.click(canvas.getByRole("radio", { name: "Grid" }));
    await expect(parseFloat(stroke("Grid"))).toBeGreaterThan(parseFloat(stroke("List")));
  },
};

/** The description sits between the label and the options, and is linked to them. */
export const WithDescription: Story = {
  args: { description: "You can switch at any time." },
};

/** Pair `invalid` with `error`: the message has an icon and words, and the track's edge turns thicker. */
export const Invalid: Story = {
  args: { label: "Billing (required)", defaultValue: undefined, required: true, invalid: true, error: "Choose how to pay." },
};

/** A disabled control can't be changed, and isn't submitted. Its label stays readable. Tab still reaches its chosen option, which is announced as disabled. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Read-only keeps the choice readable, focusable, and submitted, but blocks changes. */
export const ReadOnly: Story = {
  args: { readOnly: true },
};

/** With no visible label, an `aria-label` is required. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Billing" },
};

/**
 * In a narrow space, labels wrap and every option grows to the same height, so the page never scrolls sideways.
 * The story checks the control stays inside its container.
 */
export const Narrow: Story = {
  args: { label: "Delivery", name: "delivery", defaultValue: "standard" },
  render: (args) => (
    <div className="w-60" data-testid="narrow">
      <SegmentedControl {...args}>
        <Segment value="standard">Standard delivery</Segment>
        <Segment value="express">Express delivery</Segment>
        <Segment value="pickup">Pick up in store</Segment>
      </SegmentedControl>
    </div>
  ),
  play: async ({ canvas }) => {
    const container = canvas.getByTestId("narrow").getBoundingClientRect();
    const track = canvas.getByRole("radiogroup").querySelector(".segmented-control__track")!.getBoundingClientRect();
    await expect(track.right).toBeLessThanOrEqual(container.right + 0.5);
    const heights = canvas.getAllByRole("radio").map((option) => option.getBoundingClientRect().height);
    await expect(new Set(heights).size).toBe(1);
  },
};

/** The arrow keys move between options and choose them. Tab reaches the chosen option, then leaves the control. */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: "Monthly" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "Yearly" })).toHaveAttribute("aria-checked", "true");
  },
};

/** Controlled with `value` and `onValueChange`, for a choice that changes something else on the page. */
export const Controlled: Story = {
  render: () => {
    const [view, setView] = useState<string | null>("list");
    return (
      <div className="grid gap-3">
        <SegmentedControl aria-label="View" value={view} onValueChange={setView}>
          <Segment value="list" iconStart={<List />}>
            List
          </Segment>
          <Segment value="grid" iconStart={<LayoutGrid />}>
            Grid
          </Segment>
        </SegmentedControl>
        <output>Showing the {view} view</output>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "Grid" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Showing the grid view");
  },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <SegmentedControl label="Chosen" defaultValue="yearly">
        {options}
      </SegmentedControl>
      <SegmentedControl label="Nothing chosen">{options}</SegmentedControl>
      <SegmentedControl label="Large" size="lg" defaultValue="monthly">
        {options}
      </SegmentedControl>
      <SegmentedControl label="With icons" defaultValue="light">
        <Segment value="light" iconStart={<Sun />}>
          Light
        </Segment>
        <Segment value="dark" iconStart={<Moon />}>
          Dark
        </Segment>
        <Segment value="system" iconEnd={<Monitor />}>
          System
        </Segment>
      </SegmentedControl>
      <SegmentedControl label="Icon only" defaultValue="grid">
        <Segment value="list" iconOnly aria-label="List">
          <List />
        </Segment>
        <Segment value="grid" iconOnly aria-label="Grid">
          <LayoutGrid />
        </Segment>
      </SegmentedControl>
      <SegmentedControl label="With a description" description="You can switch at any time." defaultValue="monthly">
        {options}
      </SegmentedControl>
      <SegmentedControl label="Invalid" invalid error="Choose how to pay." defaultValue="lifetime">
        {options}
      </SegmentedControl>
      <SegmentedControl label="Disabled" disabled defaultValue="yearly">
        {options}
      </SegmentedControl>
      <SegmentedControl label="Read only" readOnly defaultValue="yearly">
        {options}
      </SegmentedControl>
      <SegmentedControl label="One option disabled" defaultValue="monthly">
        <Segment value="monthly">Monthly</Segment>
        <Segment value="yearly" disabled>
          Yearly
        </Segment>
        <Segment value="lifetime">Lifetime</Segment>
      </SegmentedControl>
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
