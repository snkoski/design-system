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

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
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
 * The chosen option is a white highlight with a border, so it doesn't rely on color. Its label keeps the same weight,
 * so the control stays the same width whichever option is chosen. The story checks it.
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
    // Measure in Geist, not the fallback font shown until it loads (font-display: swap)
    await document.fonts.ready;
    const track = canvas.getByRole("radiogroup").querySelector(".segmented-control__track")!;
    const width = track.getBoundingClientRect().width;
    for (const name of ["Professional", "Team", "Free"]) {
      await userEvent.click(canvas.getByRole("radio", { name }));
      await expect(canvas.getByRole("radio", { name })).toHaveAttribute("aria-checked", "true");
      // Every option keeps the same weight, chosen or not
      await expect(new Set(canvas.getAllByRole("radio").map((option) => getComputedStyle(option).fontWeight)).size).toBe(1);
      await expect(track.getBoundingClientRect().width).toBe(width);
    }
  },
};

/**
 * Medium is the default. Each size is as tall as an Input and a Button of the same size, so they line up in a row,
 * and has the same corners as a rectangle Button. The story checks the heights with a mouse and on touch, that a
 * click anywhere from the top to the bottom edge reaches an option, and the corners.
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
  play: async ({ canvas, canvasElement }) => {
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const size of ["md", "lg"]) {
        const row = canvas.getByTestId(size);
        const track = row.querySelector(".segmented-control__track")!;
        const height = track.getBoundingClientRect().height;
        await expect(height).toBeGreaterThanOrEqual(target);
        await expect(Math.abs(row.querySelector(".input__control")!.getBoundingClientRect().height - height)).toBeLessThan(0.5);
        await expect(Math.abs(row.querySelector("button.button")!.getBoundingClientRect().height - height)).toBeLessThan(0.5);
        await expect(edgesReachOptions(track)).toBe(true);
      }
    };
    // The track has a rectangle Button's corners, radius-sm
    for (const size of ["md", "lg"]) {
      const row = canvas.getByTestId(size);
      const radius = (selector: string) => parseFloat(getComputedStyle(row.querySelector(selector)!).borderTopLeftRadius);
      await expect(radius(".segmented-control__track")).toBe(measure("--radius-sm", canvasElement));
      await expect(radius(".segmented-control__track")).toBe(radius("button.button"));
    }
    // With a mouse, target-min is 24px
    await check(24);
    // On touch, target-min is 44px, and the control, Input, and Button all grow together
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * Icons before or after the label, or both, like Button. Icons are decorative: the label names the option. A
 * chosen option's icons look the same as the others'.
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
 * Each option is still at least `target-min` wide: 24px with a mouse, 44px on touch. The story checks both, and
 * that the chosen option's icon keeps the same line width as the others.
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
  play: async ({ canvas, canvasElement, userEvent }) => {
    const stroke = (name: string) => getComputedStyle(canvas.getByRole("radio", { name }).querySelector("svg")!).strokeWidth;
    const widths = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const name of ["List", "Grid"]) {
        await expect(canvas.getByRole("radio", { name }).getBoundingClientRect().width).toBeGreaterThanOrEqual(target);
      }
    };
    // With a mouse, target-min is 24px; on touch, it's 44px
    await widths(24);
    canvasElement.dataset.pointer = "coarse";
    try {
      await widths(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
    await expect(parseFloat(stroke("List"))).toBeGreaterThan(0);
    await expect(stroke("List")).toBe(stroke("Grid"));
    await userEvent.click(canvas.getByRole("radio", { name: "Grid" }));
    await expect(canvas.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
    await expect(stroke("Grid")).toBe(stroke("List"));
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
 * In a narrow space, labels wrap and every option grows to the same height, so the page never scrolls sideways. A
 * word too long for its option breaks rather than spill into the next one. The story checks the control stays
 * inside its container, and every label inside its option.
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
    // The text itself, not its box: a word too long for the box sticks out of it
    for (const option of canvas.getAllByRole("radio")) {
      const label = option.querySelector(".segment__label")!.getBoundingClientRect();
      for (const part of option.querySelectorAll(".segment__text")) {
        const text = document.createRange();
        text.selectNodeContents(part);
        await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(label.right + 0.5);
        await expect(text.getBoundingClientRect().left).toBeGreaterThanOrEqual(label.left - 0.5);
      }
    }
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
