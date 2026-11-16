import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { NumberField } from "@/components/NumberField/NumberField";
import numberFieldCss from "@/components/NumberField/number-field.css?inline";
import textFieldCss from "@/internal/text-field.css?inline";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** Runs a check with a mouse (target-min at least 24px), then on touch (at least 44px). */
async function withMouseAndTouch(canvasElement: HTMLElement, check: (floor: number) => Promise<void>) {
  await check(24);
  canvasElement.dataset.pointer = "coarse";
  try {
    await check(44);
  } finally {
    delete canvasElement.dataset.pointer;
  }
}

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

const salary = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

const meta = {
  title: "Components/Number field",
  component: NumberField,
  args: {
    label: "Guests",
    size: "md",
    steppers: true,
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
    onValueCommitted: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    value: { control: false },
    ref: { control: false },
    format: { control: "object" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {
  args: { defaultValue: 2, min: 0, max: 20, description: "Up to 20, including you." },
};

/** Empty, filled, invalid, at its highest, disabled, and read-only. A read-only field has no steppers. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NumberField {...args} label="Empty" />
      <NumberField {...args} label="Filled" defaultValue={4} />
      <NumberField {...args} label="Invalid" invalid defaultValue={25} max={20} error="Enter a number from 1 to 20." />
      <NumberField {...args} label="At its highest" defaultValue={20} max={20} />
      <NumberField {...args} label="Disabled" disabled defaultValue={4} />
      <NumberField {...args} label="Read only" readOnly defaultValue={4} />
    </div>
  ),
};

/**
 * Medium is the default. Large matches a large button. Both are at least `target-min` tall: 24px with a mouse, 44px
 * on touch. The steppers are square, as wide as the field is tall. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NumberField {...args} size="md" label="Medium" defaultValue={4} />
      <NumberField {...args} size="lg" label="Large" defaultValue={4} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const fields = ["Medium", "Large"].map((name) => canvas.getByRole("textbox", { name }));
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const field of fields) {
        const height = field.getBoundingClientRect().height;
        await expect(height).toBeGreaterThanOrEqual(target);
        for (const step of field.parentElement!.querySelectorAll(".number-field__step")) {
          await expect(step.getBoundingClientRect().width).toBeCloseTo(height, 0);
        }
      }
    });
  },
};

/** Currency, percent, and a unit, set with `format`. The form gets the plain number, not the formatted text. */
export const Formats: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NumberField {...args} label="Salary" description="Before tax, per year." defaultValue={85000} step={1000} min={0} format={salary} locale="en-US" />
      <NumberField {...args} label="Discount" defaultValue={0.15} step={0.05} min={0} max={1} format={{ style: "percent" }} locale="en-US" />
      <NumberField {...args} label="Interview length" defaultValue={45} step={15} min={0} format={{ style: "unit", unit: "minute", unitDisplay: "long" }} locale="en-US" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Salary" })).toHaveValue("$85,000");
    await expect(canvas.getByRole("textbox", { name: "Discount" })).toHaveValue("15%");
    await expect(canvas.getByRole("textbox", { name: "Interview length" })).toHaveValue("45 minutes");
  },
};

/** For an amount where a step makes no sense, `steppers={false}` leaves the buttons out. The arrow keys still step. */
export const WithoutSteppers: Story = {
  args: { label: "Amount paid", steppers: false, defaultValue: 1249.5, format: { style: "currency", currency: "USD" }, locale: "en-US" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Amount paid" })).toBeInTheDocument();
    await expect(canvas.queryAllByRole("button")).toEqual([]);
  },
};

/** At `max`, Increase can't be used; at `min`, Decrease. Its icon dims and it takes no hover. */
export const AtLimits: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NumberField {...args} label="Guests" description="Up to 20." defaultValue={20} min={1} max={20} />
      <NumberField {...args} label="Rooms" description="At least 1." defaultValue={1} min={1} max={5} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [increaseGuests] = canvas.getAllByRole("button", { name: "Increase" });
    const [, decreaseRooms] = canvas.getAllByRole("button", { name: "Decrease" });
    await expect(increaseGuests).toBeDisabled();
    await expect(decreaseRooms).toBeDisabled();
  },
};

/**
 * A number typed outside `min` and `max` stays as typed, so the page can say what's wrong. The steppers and arrows
 * still stop at the limits: Down from 150 goes to 100.
 */
export const OutOfRange: Story = {
  args: {
    label: "Score",
    description: "From 0 to 100.",
    min: 0,
    max: 100,
    defaultValue: 150,
    invalid: true,
    error: "Enter a number from 0 to 100.",
  },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Score" });
    await expect(field).toHaveValue("150");
    await expect(canvas.getByRole("button", { name: "Increase" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Decrease" }));
    await expect(field).toHaveValue("100");
  },
};

/**
 * `step` is how far a press moves, never a limit on what can be typed: 85,500 submits from a field that steps by
 * 1,000, even with the browser's own form validation on.
 */
export const BetweenSteps: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("salary")));
        }}
      >
        <NumberField label="Salary" name="salary" defaultValue={85500} min={0} step={1000} format={salary} locale="en-US" />
        <Button type="submit" variant="secondary" className="justify-self-start">Save salary</Button>
        <output>{submitted && `Saved: ${submitted}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save salary" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved: 85500");
  },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: {
    label: "Guests (required)",
    required: true,
    invalid: true,
    error: "Enter how many guests are coming.",
  },
};

/** A disabled field can't be focused, changed, or submitted. Its steppers dim with it. */
export const Disabled: Story = {
  args: { label: "Guests", disabled: true, defaultValue: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Guests" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Increase" })).toBeDisabled();
  },
};

/**
 * Read-only stays focusable, so its value can be read and copied, and it is submitted with the form. It has no
 * steppers, which couldn't be used.
 */
export const ReadOnly: Story = {
  args: { label: "Salary", readOnly: true, defaultValue: 85000, format: salary, locale: "en-US" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Salary" })).toHaveAttribute("readonly");
    await expect(canvas.queryAllByRole("button")).toEqual([]);
  },
};

/** A field with no visible label, such as a quantity in a table row, needs an `aria-label`. It's still a full target. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Quantity", defaultValue: 1, min: 1 },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole("textbox", { name: "Quantity" });
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      await expect(field.closest(".number-field")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    });
  },
};

/**
 * Each stepper's hit area is the field's full height and a square of it, at least `target-min` both ways, right up to
 * the field's edge. The rest of the field is the input. Checked with a real hit-test, with a mouse and on touch.
 */
export const HitAreas: Story = {
  args: { label: "Guests", defaultValue: 4 },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole("textbox", { name: "Guests" });
    const steppers = [canvas.getByRole("button", { name: "Decrease" }), canvas.getByRole("button", { name: "Increase" })];
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const field = input.getBoundingClientRect();
      for (const stepper of steppers) {
        const box = stepper.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(target);
        await expect(box.height).toBeGreaterThanOrEqual(target);
        const x = box.left + box.width / 2;
        // The centre, and 1px inside the field's top and bottom edges
        for (const y of [box.top + box.height / 2, field.top + 1, field.bottom - 1]) {
          await expect(stepper.contains(document.elementFromPoint(x, y))).toBe(true);
        }
      }
      // Increase reaches the field's end edge
      const increase = steppers[1]!;
      await expect(increase.contains(document.elementFromPoint(field.right - 1, field.top + field.height / 2))).toBe(true);
      // The text area is the input
      const textEnd = steppers[0]!.getBoundingClientRect().left;
      await expect(document.elementFromPoint((field.left + textEnd) / 2, field.top + field.height / 2)).toBe(input);
    });
  },
};

/** The field in a shadow root, holding only its own CSS, with no CSS reset */
function ShadowNumberField() {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  // A layout effect, so the shadow root and its field are there before the play function starts
  useLayoutEffect(() => {
    const element = host.current;
    if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-shadow-host="">
      {root &&
        createPortal(
          <>
            <style>{textFieldCss}</style>
            <style>{numberFieldCss}</style>
            <NumberField label="Guests" defaultValue={4} />
          </>,
          root,
        )}
    </div>
  );
}

/**
 * On a site with no CSS reset, a `<button>` comes with the browser's own look: a gray fill, a border, and padding.
 * Storybook loads Tailwind's reset, which would hide that, so this field sits in a shadow root with only its own CSS.
 * The steppers still draw nothing but their icons at rest.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowNumberField />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("[data-shadow-host]");
    await waitFor(() => expect(host?.shadowRoot?.querySelectorAll(".number-field__step")).toHaveLength(2));
    for (const stepper of host!.shadowRoot!.querySelectorAll(".number-field__step")) {
      const style = getComputedStyle(stepper);
      await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      await expect(style.backgroundImage).toBe("none");
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        await expect(style[`border${side}Width`]).toBe("0px");
        await expect(style[`padding${side}`]).toBe("0px");
        await expect(style[`margin${side}`]).toBe("0px");
      }
    }
  },
};

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <NumberField label="Guests" defaultValue={4} min={1} max={20} />
      <NumberField label="Empty" placeholder="0" />
      <NumberField label="Salary" size="lg" description="Before tax, per year." defaultValue={85000} step={1000} min={0} format={salary} locale="en-US" />
      <NumberField label="Amount paid" steppers={false} defaultValue={1249.5} format={{ style: "currency", currency: "USD" }} locale="en-US" />
      <NumberField label="At its highest" defaultValue={20} max={20} />
      <NumberField aria-label="Quantity" defaultValue={1} min={1} />
      <NumberField label="Score (required)" required invalid defaultValue={150} min={0} max={100} error="Enter a number from 0 to 100." />
      <NumberField label="Disabled" disabled defaultValue={4} />
      <NumberField label="Read only" readOnly defaultValue={4} />
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
