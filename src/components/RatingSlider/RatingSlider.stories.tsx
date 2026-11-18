import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { RatingSlider } from "@/components/RatingSlider/RatingSlider";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** A point inside a star, as a share of its width from the left (0 is its left edge, 1 its right) */
function pointOnStar(root: Element, star: number, share: number) {
  const box = root.querySelectorAll(".rating-slider__star")[star - 1]!.getBoundingClientRect();
  return { clientX: box.left + box.width * share, clientY: box.top + box.height / 2 };
}

/** A point in the no-rating strip, left of the stars */
function pointOnStrip(root: Element) {
  const box = root.querySelector(".rating-slider__zero")!.getBoundingClientRect();
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
}

const control = (root: Element) => root.querySelector<HTMLElement>(".rating-slider__control")!;
const words = (root: Element) => root.querySelector(".rating-slider__value-text")?.textContent;

const meta = {
  title: "Components/Rating slider",
  component: RatingSlider,
  args: {
    label: "Interest",
    name: "interest",
    defaultValue: 3.5,
    max: 5,
    step: 0.5,
    showValue: true,
    showClear: true,
    disabled: false,
    readOnly: false,
    invalid: false,
    onValueChange: fn(),
    onValueCommitted: fn(),
  },
  argTypes: {
    step: { control: "inline-radio", options: [1, 0.5, 0.25] },
    max: { control: { type: "number", min: 1, max: 10, step: 1 } },
    value: { control: false },
    ref: { control: false },
    color: {
      control: "select",
      options: ["gold (default)", "brand", "custom"],
      mapping: { "gold (default)": undefined, brand: "brand", custom: "hsl(210 80% 46%)" },
    },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof RatingSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** No rating, a rating, and every state side by side. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-6">
      <RatingSlider {...args} label="Three and a half stars" name="half" />
      <RatingSlider {...args} label="No rating" name="none" defaultValue={undefined} />
      <RatingSlider {...args} label="Invalid" name="invalid" defaultValue={undefined} invalid error="Choose how interested you are." />
      <RatingSlider {...args} label="Disabled" name="disabled" disabled />
      <RatingSlider {...args} label="Read only" name="read-only" readOnly />
      <RatingSlider {...args} label="Without the words" name="no-words" showValue={false} />
      <RatingSlider {...args} label="Without the no-rating strip" name="no-strip" showClear={false} />
    </div>
  ),
};

/**
 * Whole stars behave like click-to-rate: a click anywhere on star 3, even near its left edge, gives 3, and a click in
 * the strip left of the stars gives no rating. The story checks both with a mouse and on touch.
 */
export const WholeStars: Story = {
  args: { step: 1, defaultValue: undefined },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    const check = async () => {
      // A real hit-test first: every star's center and the strip are inside the control, so a press there reaches it
      for (const star of [1, 2, 3, 4, 5]) {
        const { clientX, clientY } = pointOnStar(canvasElement, star, 0.5);
        await expect(control(canvasElement).contains(document.elementFromPoint(clientX, clientY))).toBe(true);
      }
      const strip = pointOnStrip(canvasElement);
      await expect(control(canvasElement).contains(document.elementFromPoint(strip.clientX, strip.clientY))).toBe(true);
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 3, 0.1) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "3 stars"));
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStrip(canvasElement) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "No rating"));
    };
    await check();
    canvasElement.dataset.pointer = "coarse";
    try {
      await check();
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * With `showClear={false}` there's no slashed circle, just the stars. A sliver left of the first star, half a step
 * wide, still means no rating, and so does dragging past the left edge, Home, or the left arrow. Every star fills as
 * it does with the strip. The story checks the sizes, a click in the sliver, a click on star 1, and a drag off the left
 * edge, with a mouse and on touch.
 */
export const WithoutClear: Story = {
  args: { showClear: false },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    await expect(canvasElement.querySelector(".rating-slider__zero")).toBeNull();
    const check = async () => {
      const row = measure("--choice-row", canvasElement);
      const box = control(canvasElement).getBoundingClientRect();
      const first = canvasElement.querySelector(".rating-slider__star")!.getBoundingClientRect();
      await expect(Math.abs(box.width - 5.25 * row)).toBeLessThan(0.5);
      await expect(Math.abs(first.width - row)).toBeLessThan(0.5);
      await expect(Math.abs(first.left - box.left - 0.25 * row)).toBeLessThan(0.5);

      // A real hit-test of the sliver: it's part of the control, so a press there reaches it
      const sliver = { clientX: (box.left + first.left) / 2, clientY: box.top + box.height / 2 };
      await expect(control(canvasElement).contains(document.elementFromPoint(sliver.clientX, sliver.clientY))).toBe(true);
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 3, 0.9) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "3 stars"));
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: sliver }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "No rating"));

      // Star 1's slices are unchanged: its left half is half a star, not no rating
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 1, 0.25) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "0.5 stars"));

      // A drag that ends past the left edge is no rating
      const start = pointOnStar(canvasElement, 3, 0.9);
      await userEvent.pointer([
        { keys: "[MouseLeft>]", target: control(canvasElement), coords: start },
        { coords: { clientX: box.left - 40, clientY: start.clientY } },
        { keys: "[/MouseLeft]" },
      ]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "No rating"));
    };
    await check();
    canvasElement.dataset.pointer = "coarse";
    try {
      await check();
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Half stars, the default: a click on the left half of star 3 gives 2.5, and on its right half 3. */
export const HalfStars: Story = {
  args: { defaultValue: undefined },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    for (const [share, text] of [[0.25, "2.5 stars"], [0.75, "3 stars"]] as const) {
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 3, share) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", text));
    }
  },
};

/** Quarter stars: each star fills in four slices. Hard to tell apart without the words, so keep `showValue`. */
export const QuarterStars: Story = {
  args: { step: 0.25, defaultValue: 2.75 },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 2, 0.3) }, { keys: "[/MouseLeft]" }]);
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "1.5 stars"));
  },
};

/**
 * With a mouse, the stars and the words fill to the value under the pointer, until it leaves. A key press stops the
 * preview until the pointer moves again, so the keys always show their own choice.
 */
export const HoverPreview: Story = {
  args: { defaultValue: 2 },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    await userEvent.pointer({ target: control(canvasElement), coords: pointOnStar(canvasElement, 4, 0.8) });
    await waitFor(() => expect(words(canvasElement)).toBe("4 of 5"));
    await expect(slider).toHaveAttribute("aria-valuenow", "2");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(words(canvasElement)).toBe("2.5 of 5"));
    await userEvent.pointer({ target: control(canvasElement), coords: pointOnStar(canvasElement, 1, 0.2) });
    await waitFor(() => expect(words(canvasElement)).toBe("0.5 of 5"));
    await userEvent.pointer({ target: canvasElement.ownerDocument.body, coords: { clientX: 0, clientY: 0 } });
    await waitFor(() => expect(words(canvasElement)).toBe("2.5 of 5"));
    // A finger has no hover: a touch moving over the stars previews nothing. (Testing Library can't move a finger
    // that isn't pressed, so the event is sent directly.)
    const finger = pointOnStar(canvasElement, 5, 0.9);
    control(canvasElement).dispatchEvent(new PointerEvent("pointermove", { ...finger, pointerType: "touch", bubbles: true }));
    // React renders a pointer move a little later, so give a preview two frames to appear before checking it didn't
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(words(canvasElement)).toBe("2.5 of 5");
  },
};

/** The arrows move a step, Page Up and Page Down a whole star, Home goes to no rating, and End to full. */
export const Keyboard: Story = {
  args: { defaultValue: 2 },
  play: async ({ canvas, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    await userEvent.tab();
    await expect(slider).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuetext", "2.5 stars");
    await userEvent.keyboard("{PageUp}");
    await expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuetext", "No rating");
  },
};

/** The form gets the rating as a number, and `0` for none. Resetting the form puts the rating back to where it started. */
export const FormSubmitAndReset: Story = {
  render: (args) => {
    const [sent, setSent] = useState("Nothing sent yet");
    return (
      <form
        className="grid justify-items-start gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(`Sent ${new FormData(event.currentTarget).get("interest")}`);
        }}
      >
        <RatingSlider {...args} />
        <div className="flex gap-3">
          <Button type="submit">Save rating</Button>
          <Button type="reset" variant="ghost">
            Reset form
          </Button>
        </div>
        <output>{sent}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    slider.focus();
    await userEvent.keyboard("{End}");
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 5");
    slider.focus();
    await userEvent.keyboard("{Home}");
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 0");
    await userEvent.click(canvas.getByRole("button", { name: "Reset form" }));
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars"));
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 3.5");
  },
};

/** The description sits between the label and the stars, and is linked to the slider. */
export const WithDescription: Story = {
  args: { description: "How much you want this job, in half stars." },
};

/** Pair `invalid` with `error`: the message has an icon and words, and the empty outlines turn red. */
export const Invalid: Story = {
  args: { defaultValue: undefined, invalid: true, error: "Choose how interested you are." },
};

/**
 * Read-only looks the same, with "Read only" beside the label. It can still be focused and is sent with the form, but
 * nothing changes it. The story presses star 5 and End and checks the rating stays.
 */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    await expect(slider).toHaveAttribute("aria-readonly", "true");
    await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 5, 0.9) }, { keys: "[/MouseLeft]" }]);
    slider.focus();
    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
    // No preview either: hovering leaves the words and stars at the real value
    await userEvent.pointer({ target: control(canvasElement), coords: pointOnStar(canvasElement, 1, 0.2) });
    await expect(words(canvasElement)).toBe("3.5 of 5");
  },
};

/** A disabled slider can't be reached with Tab and isn't sent. The stars dim; the label and words stay readable. Hovering previews nothing. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.pointer({ target: control(canvasElement), coords: pointOnStar(canvasElement, 5, 0.9) });
    await expect(words(canvasElement)).toBe("3.5 of 5");
  },
};

/** With no visible label, an `aria-label` is required. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Interest" },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("slider", { name: "Interest" })).toBeInTheDocument();
    // Without a label, the rating is still at least target-min tall, with a mouse and on touch
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      await expect(canvasElement.querySelector(".rating-slider")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    };
    await check(24);
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * The control is the target, and it's never shorter than `target-min`: `choice-row` tall, 32px with a mouse and 44px on
 * touch, with a star's cell as wide when there's room. The story checks both with probes.
 */
export const HitArea: Story = {
  play: async ({ canvasElement }) => {
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      const row = measure("--choice-row", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const box = control(canvasElement).getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(target);
      await expect(Math.abs(box.height - row)).toBeLessThan(0.5);
      await expect(Math.abs(box.width - 6 * row)).toBeLessThan(0.5);
      const star = canvasElement.querySelector(".rating-slider__star")!.getBoundingClientRect();
      await expect(Math.abs(star.width - row)).toBeLessThan(0.5);
    };
    await check(24);
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * In a narrow space the stars get narrower rather than push the page sideways. Ten stars on touch fit a 288px column
 * (a 320px phone with its gutters), and a click on star 3 still gives 3.
 */
export const Narrow: Story = {
  args: { max: 10, step: 1, defaultValue: 7, label: "Score" },
  render: (args) => (
    <div className="w-72" data-testid="narrow">
      <RatingSlider {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    canvasElement.dataset.pointer = "coarse";
    try {
      const column = canvas.getByTestId("narrow").getBoundingClientRect();
      await expect(control(canvasElement).getBoundingClientRect().right).toBeLessThanOrEqual(column.right + 0.5);
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(canvasElement), coords: pointOnStar(canvasElement, 3, 0.2) }, { keys: "[/MouseLeft]" }]);
      await waitFor(() => expect(canvas.getByRole("slider", { name: "Score" })).toHaveAttribute("aria-valuetext", "3 stars"));
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * In a centered row, the stars stay put whatever the words beside them say: the words keep the width of the longest
 * they can show. Otherwise the stars would shift under the pointer in the middle of a drag. The story checks the
 * control doesn't move between no rating, a half star, and full marks.
 */
export const Centered: Story = {
  args: { step: 0.25, defaultValue: undefined },
  render: (args) => (
    <div className="flex w-96 justify-center">
      <RatingSlider {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slider = canvas.getByRole("slider", { name: "Interest" });
    // Measure in Geist, not the fallback font shown until it loads (font-display: swap)
    await document.fonts.ready;
    const left = () => control(canvasElement).getBoundingClientRect().left;
    const start = left();
    slider.focus();
    for (const key of ["{ArrowRight}{ArrowRight}", "{End}", "{Home}"]) {
      await userEvent.keyboard(key);
      await expect(left()).toBe(start);
    }
  },
};

/** In a parent that sizes things by their content (a toolbar, a `w-max` box), the slider keeps its full size. */
export const ContentSized: Story = {
  render: (args) => (
    <div className="inline-flex w-max items-end gap-3" data-testid="toolbar">
      <RatingSlider {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = measure("--choice-row", canvasElement);
    await expect(Math.abs(control(canvasElement).getBoundingClientRect().width - 6 * row)).toBeLessThan(0.5);
  },
};

/**
 * The stars always fill left to right, even in a right-to-left page or inside a right-to-left `DirectionProvider`, so
 * a click on star 1 gives 1 and Right always adds.
 */
export const RightToLeft: Story = {
  args: { step: 1, defaultValue: undefined },
  render: (args) => (
    <div className="grid gap-6">
      <div dir="rtl" data-testid="rtl-page">
        <RatingSlider {...args} label="In a right-to-left page" name="rtl-page" />
      </div>
      <DirectionProvider direction="rtl">
        <div dir="rtl" data-testid="rtl-provider">
          <RatingSlider {...args} label="Inside a right-to-left provider" name="rtl-provider" />
        </div>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    for (const id of ["rtl-page", "rtl-provider"]) {
      const root = canvas.getByTestId(id);
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: control(root), coords: pointOnStar(root, 1, 0.5) }, { keys: "[/MouseLeft]" }]);
      const slider = root.querySelector('input[type="range"]')!;
      await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "1 star"));
      (slider as HTMLElement).focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(slider).toHaveAttribute("aria-valuetext", "2 stars");
    }
  },
};

/** The color a CSS value resolves to, from a probe inside the given element, so its theme applies */
function resolveColor(value: string, parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = value;
  parent.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/**
 * The filled stars are gold by default, the brand's hue with `color="brand"`, or any CSS color. Gold and brand are
 * tokens checked against every background in every theme; a custom color is up to the page. Shown in the light theme,
 * whatever the toolbar says, since gold and brand are both ketchup in hot dog.
 */
export const Colors: Story = {
  render: () => (
    <div data-theme="light" className="grid gap-6 p-4" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <RatingSlider label="Gold, the default" name="gold" defaultValue={3.5} />
      <RatingSlider label="Brand" name="brand" color="brand" defaultValue={3.5} />
      <RatingSlider label="Custom" name="custom" color="hsl(210 80% 46%)" defaultValue={3.5} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const theme = canvasElement.querySelector<HTMLElement>("[data-theme]")!;
    const ratings = [...theme.querySelectorAll<HTMLElement>(".rating-slider")];
    await expect(ratings).toHaveLength(3);
    const [gold, brand, custom] = ratings.map((rating) => getComputedStyle(rating.querySelector(".rating-slider__solid")!).fill);
    await expect(gold).toBe(resolveColor("var(--rating-gold)", theme));
    await expect(brand).toBe(resolveColor("var(--rating-brand)", theme));
    await expect(custom).toBe(resolveColor("hsl(210 80% 46%)", theme));
    await expect(gold).not.toBe(brand);
  },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <RatingSlider label="No rating" step={1} />
      <RatingSlider label="Whole stars" step={1} defaultValue={4} />
      <RatingSlider label="Half stars" defaultValue={3.5} />
      <RatingSlider label="Quarter stars" step={0.25} defaultValue={1.75} />
      <RatingSlider label="With a description" description="How much you want this job." defaultValue={2.5} />
      <RatingSlider label="Invalid" invalid error="Choose how interested you are." />
      <RatingSlider label="Invalid, with stars" invalid error="Choose 2 stars or more to apply." defaultValue={1.5} />
      <RatingSlider label="Disabled" disabled defaultValue={2.5} />
      <RatingSlider label="Read only" readOnly defaultValue={4.5} />
      <RatingSlider label="Without the words" showValue={false} defaultValue={3} />
      <RatingSlider label="Without the no-rating strip" showClear={false} defaultValue={2.5} />
      <RatingSlider label="Without the strip, no rating" showClear={false} />
      <RatingSlider label="Brand color" color="brand" defaultValue={3.5} />
      <RatingSlider label="Custom color" color="hsl(210 80% 46%)" defaultValue={3.5} />
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
