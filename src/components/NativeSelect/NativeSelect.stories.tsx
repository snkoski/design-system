import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { NativeSelect } from "@/components/NativeSelect/NativeSelect";
import type { NativeSelectGroup, NativeSelectOption } from "@/components/NativeSelect/NativeSelect";
import nativeSelectCss from "@/components/NativeSelect/native-select.css?inline";
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

/** Runs a check with a mouse, then again on touch, where target-min and the control heights grow */
async function withMouseAndTouch(canvasElement: HTMLElement, check: (floor: number) => Promise<void>) {
  await check(24);
  canvasElement.dataset.pointer = "coarse";
  try {
    await check(44);
  } finally {
    delete canvasElement.dataset.pointer;
  }
}

const statuses: NativeSelectOption[] = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const grouped: (NativeSelectOption | NativeSelectGroup)[] = [
  { value: "saved", label: "Saved" },
  {
    label: "In progress",
    options: [
      { value: "applied", label: "Applied" },
      { value: "interview", label: "Interview" },
    ],
  },
  {
    label: "Closed",
    options: [
      { value: "offer", label: "Offer" },
      { value: "rejected", label: "Rejected" },
      { value: "ghosted", label: "No reply", disabled: true },
    ],
  },
  { label: "Archived", disabled: true, options: [{ value: "withdrawn", label: "Withdrawn" }] },
];

const notice: NativeSelectOption[] = [
  { value: "none", label: "None, I can start right away" },
  { value: "2w", label: "Two weeks, the usual notice period in my current contract" },
  { value: "1m", label: "One month" },
];

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

const meta = {
  title: "Components/Native select",
  component: NativeSelect,
  args: {
    label: "Status",
    options: statuses,
    placeholder: "Choose a status",
    size: "md",
    disabled: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    options: { control: "object" },
    value: { control: false },
    ref: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** The placeholder chosen, an option chosen, no placeholder, with a description, invalid, disabled, and required. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NativeSelect {...args} label="Placeholder chosen" />
      <NativeSelect {...args} label="Option chosen" defaultValue="interview" />
      <NativeSelect {...args} label="No placeholder" placeholder={undefined} />
      <NativeSelect {...args} label="With a description" description="Where the application stands." />
      <NativeSelect {...args} label="Invalid" invalid required error="Choose a status." />
      <NativeSelect {...args} label="Disabled" disabled defaultValue="offer" />
      <NativeSelect {...args} label="Required" required defaultValue="applied" />
    </div>
  ),
};

/**
 * Medium is the default. Both are exactly as tall as an Input of the same size, and at least `target-min`: 40px
 * and 48px with a mouse, 44px and 52px on touch, and one step smaller in compact density, but never below
 * `target-min`. The story checks each.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <NativeSelect {...args} size="md" label="Medium" />
      <NativeSelect {...args} size="lg" label="Large" />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const medium = canvas.getByRole("combobox", { name: "Medium" });
    const large = canvas.getByRole("combobox", { name: "Large" });
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const [select, token] of [[medium, "--control-md"], [large, "--control-lg"]] as const) {
        const height = select.getBoundingClientRect().height;
        await expect(Math.abs(height - measure(token, canvasElement))).toBeLessThanOrEqual(0.5);
        await expect(height).toBeGreaterThanOrEqual(target);
      }
    };
    await withMouseAndTouch(canvasElement, check);
    // Compact density shrinks both a step, with a mouse and on touch, never below target-min
    canvasElement.dataset.density = "compact";
    try {
      const compact = measure("--control-md", canvasElement);
      await expect(compact).toBeLessThan(measure("--control-lg", canvasElement));
      await withMouseAndTouch(canvasElement, check);
    } finally {
      delete canvasElement.dataset.density;
    }
  },
};

/** The placeholder says what to choose. It stays choosable, so an optional select can be cleared. */
export const WithPlaceholder: Story = {
  args: { label: "Status (optional)", placeholder: "Choose a status" },
};

/** The description sits between the label and the field, so people read it before they choose. */
export const WithDescription: Story = {
  args: { label: "Status", description: "Where the application stands." },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: { label: "Status", required: true, invalid: true, error: "Choose a status." },
};

/** A disabled select can't be focused, changed, or submitted. */
export const Disabled: Story = {
  args: { label: "Status", disabled: true, defaultValue: "offer" },
};

/** Groups add headings to the open list. A disabled option, or every option in a disabled group, can't be chosen. */
export const Groups: Story = {
  args: { label: "Status", options: grouped },
};

/**
 * A select with no visible label, such as a sort order in a toolbar, needs an `aria-label`. With no label to click,
 * the select itself is the whole target, so it's still at least `target-min` tall, with a mouse and on touch.
 */
export const WithoutVisibleLabel: Story = {
  args: {
    label: undefined,
    "aria-label": "Sort by",
    placeholder: undefined,
    options: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    const select = canvas.getByRole("combobox", { name: "Sort by" });
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      await expect(select.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    });
  },
};

/**
 * A long option is cut off before it reaches the arrow, never drawn under it. Clicking the arrow opens the select:
 * it lets clicks through.
 */
export const LongOptions: Story = {
  args: { label: "Notice period", options: notice, placeholder: undefined, defaultValue: "2w" },
  play: async ({ canvas, canvasElement }) => {
    const select = canvas.getByRole("combobox", { name: "Notice period" });
    const icon = select.parentElement!.querySelector(".native-select__icon")!;
    await withMouseAndTouch(canvasElement, async () => {
      const box = select.getBoundingClientRect();
      const arrow = icon.getBoundingClientRect();
      const textEnd = box.right - parseFloat(getComputedStyle(select).paddingRight);
      await expect(arrow.left).toBeGreaterThanOrEqual(textEnd - 0.5);
      await expect(arrow.right).toBeLessThanOrEqual(box.right);
      // A real hit-test: what's under the middle of the arrow is the select itself
      await expect(document.elementFromPoint(arrow.left + arrow.width / 2, arrow.top + arrow.height / 2)).toBe(select);
    });
  },
};

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

/**
 * A long list: all 50 US states. The browser draws the open list and scrolls it, and typing a letter jumps to the
 * first state starting with it. `autoComplete` lets the browser fill it in from a saved address.
 */
export const ManyOptions: Story = {
  args: {
    label: "State",
    placeholder: "Choose a state",
    autoComplete: "address-level1",
    options: states.map((state) => ({ value: state, label: state })),
  },
};

/** In a right-to-left page the arrow moves to the left end, and the text starts on the right. */
export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <NativeSelect
        {...args}
        label="الحالة"
        placeholder="اختر حالة"
        options={[
          { value: "applied", label: "تم التقديم" },
          { value: "offer", label: "عرض" },
        ]}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const select = canvas.getByRole("combobox", { name: "الحالة" });
    const arrow = select.parentElement!.querySelector(".native-select__icon")!.getBoundingClientRect();
    const box = select.getBoundingClientRect();
    const inset = measure("--space-3", canvasElement) + measure("--border-thin", canvasElement);
    await expect(Math.abs(arrow.left - (box.left + inset))).toBeLessThanOrEqual(1);
  },
};

/** Choosing an option and pressing the button submits its value with the form, like any native field. */
export const InAForm: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("status")));
        }}
      >
        <NativeSelect label="Status" name="status" options={statuses} placeholder="Choose a status" />
        <Button type="submit" variant="secondary" className="justify-self-start">Save</Button>
        <output>{submitted && `Saved: ${submitted}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Status" }), "offer");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved: offer");
  },
};

/**
 * A page without Storybook's CSS reset: the select in a shadow root that holds only the CSS it's drawn with. The
 * browser's own arrow, border, and padding are gone, replaced by the system's.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowSelect />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("[data-shadow-host]");
    await waitFor(() => expect(host?.shadowRoot?.querySelector("select")).toBeInstanceOf(HTMLSelectElement));
    const style = getComputedStyle(host!.shadowRoot!.querySelector("select")!);
    await expect(style.appearance).toBe("none");
    const thin = measure("--border-thin", canvasElement);
    await expect([style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat)).toEqual([thin, thin, thin, thin]);
    await expect(parseFloat(style.borderTopLeftRadius)).toBe(measure("--radius-md", canvasElement));
    await expect(parseFloat(style.paddingLeft)).toBe(measure("--space-3", canvasElement));
    await expect(parseFloat(style.fontSize)).toBe(measure("--text-body", canvasElement));
    // The token as the browser computes it, from a probe, so both are written the same way
    const probe = document.createElement("span");
    probe.style.fontFamily = "var(--font-sans)";
    canvasElement.append(probe);
    const sans = getComputedStyle(probe).fontFamily;
    probe.remove();
    await expect(style.fontFamily).toBe(sans);
  },
};

function ShadowSelect() {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  // A layout effect, so the shadow root and its select are there before the play function starts
  useLayoutEffect(() => {
    const element = host.current;
    if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-shadow-host="">
      {root &&
        createPortal(
          <>
            <style>{textFieldCss + nativeSelectCss}</style>
            <NativeSelect aria-label="Status" options={statuses} />
          </>,
          root,
        )}
    </div>
  );
}

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <NativeSelect label="Placeholder chosen" options={statuses} placeholder="Choose a status" />
      <NativeSelect label="Option chosen" options={statuses} defaultValue="interview" />
      <NativeSelect label="Large" size="lg" options={statuses} defaultValue="interview" />
      <NativeSelect aria-label="No visible label" className="mt-4" options={statuses} defaultValue="offer" />
      <NativeSelect label="Long option" options={notice} defaultValue="2w" />
      <NativeSelect label="With a description" options={statuses} placeholder="Choose a status" description="Where the application stands." />
      <NativeSelect label="Invalid" options={statuses} placeholder="Choose a status" required invalid error="Choose a status." />
      <NativeSelect label="Disabled" options={statuses} disabled defaultValue="offer" />
      <NativeSelect label="Disabled with placeholder" options={statuses} placeholder="Choose a status" disabled />
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
