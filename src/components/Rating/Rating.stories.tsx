import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { Rating } from "@/components/Rating/Rating";
import ratingCss from "@/components/Rating/rating.css?inline";
import choiceGroupCss from "@/internal/choice-group.css?inline";
import fieldCss from "@/internal/field.css?inline";
import insetButtonCss from "@/internal/inset-button.css?inline";
import visuallyHiddenCss from "@/internal/visually-hidden.css?inline";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** The opacity of each star's fill, in order: 1 for a filled star, 0 for an empty one */
const fills = (root: HTMLElement) =>
  [...root.querySelectorAll<SVGElement>(".rating__fill")].map((fill) => Number(getComputedStyle(fill).opacity));

const meta = {
  title: "Components/Rating",
  component: Rating,
  args: {
    label: "Interest",
    name: "interest",
    defaultValue: 3,
    max: 5,
    required: false,
    disabled: false,
    readOnly: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    value: { control: false },
    ref: { control: false },
    max: { control: { type: "number", min: 1, max: 10, step: 1 } },
    color: {
      control: "select",
      options: ["gold (default)", "brand", "custom"],
      mapping: { "gold (default)": undefined, brand: "brand", custom: "hsl(210 80% 46%)" },
    },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Nothing chosen, one chosen, and every state side by side. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-6">
      <Rating {...args} label="Three stars" name="three" />
      <Rating {...args} label="Nothing chosen" name="nothing" defaultValue={undefined} />
      <Rating {...args} label="Invalid" name="invalid" defaultValue={undefined} invalid error="Choose how interested you are." />
      <Rating {...args} label="Invalid, with stars" name="invalid-chosen" invalid error="Choose 2 stars or more to apply." defaultValue={1} />
      <Rating {...args} label="Disabled" name="disabled" disabled />
      <Rating {...args} label="Read only" name="read-only" readOnly />
      <Rating {...args} label="Required" name="required" required />
    </div>
  ),
};

/** No star is chosen, and there's no Clear button yet. */
export const Empty: Story = {
  args: { defaultValue: undefined },
};

/**
 * The chosen star and every star before it fill in, so the state is a change of shape, not only of color. Clear
 * appears after the stars. The story chooses each star and checks which ones are drawn filled.
 */
export const Chosen: Story = {
  args: { defaultValue: undefined },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.queryByRole("button", { name: "Clear rating, Interest" })).toBeNull();
    await userEvent.click(canvas.getByRole("radio", { name: "3 stars" }));
    await waitFor(() => expect(fills(canvasElement)).toEqual([1, 1, 1, 0, 0]));
    await expect(canvas.getByRole("button", { name: "Clear rating, Interest" })).toBeVisible();
  },
};

/** The description sits between the label and the stars, and is linked to them. */
export const WithDescription: Story = {
  args: { description: "How much you want this job, from 1 to 5." },
};

/** Pair `invalid` with `error`: the message has an icon and words, and the empty stars' outlines turn red. */
export const Invalid: Story = {
  args: { defaultValue: undefined, required: true, invalid: true, error: "Choose how interested you are." },
};

/**
 * `required` announces the rating as required and stops the form from submitting until a star is chosen. Don't mark
 * it in the label: mark the fields that aren't required "(optional)" instead. A required rating has no Clear button: it
 * can be changed, not emptied. To show your own error, give the form `noValidate`, then set `invalid` and `error`.
 */
export const Required: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number | null>(null);
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
        <Rating
          {...args}
          required
          defaultValue={undefined}
          value={value}
          onValueChange={setValue}
          invalid={submitted && value === null}
          error="Choose how interested you are."
        />
        <Button type="submit">Save rating</Button>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByText("Choose how interested you are.")).toBeVisible();
    await expect(canvas.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    await userEvent.click(canvas.getByRole("radio", { name: "4 stars" }));
    // Base UI takes the error away a render after the change, so wait for it rather than checking straight away
    await waitFor(() => expect(canvas.queryByText("Choose how interested you are.")).toBeNull());
    await expect(canvas.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
    await expect(canvas.queryByRole("button", { name: /^Clear rating/ })).toBeNull();
  },
};

/** Read-only keeps the rating readable, focusable, and submitted, but blocks changes. There's no Clear button. */
export const ReadOnly: Story = {
  args: { readOnly: true },
};

/** A disabled rating can't be changed, and isn't submitted. Its label stays readable. Tab still reaches its chosen star. */
export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * With no visible label, an `aria-label` is required. Clear's name uses it. The rating is still at least `target-min`
 * tall, so stacked ratings without labels don't take each other's clicks. The story checks it with a mouse and on touch.
 */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Interest" },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("radiogroup", { name: "Interest" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear rating, Interest" })).toBeInTheDocument();
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const wrapper = canvasElement.querySelector(".rating")!;
      await expect(wrapper.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
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

/** `max` sets how many stars there are. */
export const ThreeStars: Story = {
  args: { label: "Difficulty", name: "difficulty", max: 3, defaultValue: 2 },
};

/**
 * Ten stars in a 320px space wrap onto a second line rather than push the page sideways, and Clear follows them.
 * Keep to 5 or fewer on pages used on phones. The story checks nothing sticks out, with a mouse and on touch.
 */
export const TenStars: Story = {
  args: { label: "Score", name: "score", max: 10, defaultValue: 7 },
  render: (args) => (
    <div className="w-80" data-testid="narrow">
      <Rating {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const check = async () => {
      const container = canvas.getByTestId("narrow").getBoundingClientRect();
      for (const part of [...canvas.getAllByRole("radio"), canvas.getByRole("button", { name: "Clear rating, Score" })]) {
        await expect(part.getBoundingClientRect().right).toBeLessThanOrEqual(container.right + 0.5);
      }
    };
    await check();
    canvasElement.dataset.pointer = "coarse";
    try {
      await check();
      // On touch, ten 44px stars don't fit in one line
      const tops = new Set(canvas.getAllByRole("radio").map((star) => Math.round(star.getBoundingClientRect().top)));
      await expect(tops.size).toBeGreaterThan(1);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * Each star's square is its whole hit area: 32px with a mouse and 44px on touch, never less than `target-min`. The
 * squares touch, with no gap and no overlap, and Clear sits `target-gap` after them. The story clicks each star's
 * center and just inside each edge two stars share, with a mouse and on touch.
 */
export const HitAreas: Story = {
  play: async ({ canvas, canvasElement }) => {
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const row = measure("--choice-row", canvasElement);
      const stars = canvas.getAllByRole("radio");
      const hit = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[role="radio"], button');
      for (const [index, star] of stars.entries()) {
        const box = star.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(target);
        await expect(box.height).toBeGreaterThanOrEqual(target);
        await expect(Math.abs(box.height - row)).toBeLessThan(0.5);
        const middle = box.top + box.height / 2;
        await expect(hit(box.left + box.width / 2, middle)).toBe(star);
        await expect(hit(box.left + 1, middle)).toBe(star);
        await expect(hit(box.right - 1, middle)).toBe(star);
        const next = stars[index + 1];
        if (next) await expect(Math.abs(next.getBoundingClientRect().left - box.right)).toBeLessThan(0.5);
      }
      const clear = canvas.getByRole("button", { name: "Clear rating, Interest" });
      const clearBox = clear.getBoundingClientRect();
      await expect(clearBox.width).toBeGreaterThanOrEqual(target);
      await expect(clearBox.height).toBeGreaterThanOrEqual(target);
      await expect(hit(clearBox.left + clearBox.width / 2, clearBox.top + clearBox.height / 2)).toBe(clear);
      const gap = clearBox.left - stars.at(-1)!.getBoundingClientRect().right;
      await expect(gap).toBeGreaterThanOrEqual(measure("--target-gap", canvasElement) - 0.5);
    };
    // With a mouse, target-min is 24px
    await check(24);
    // On touch, target-min is 44px, and the squares grow with choice-row
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * The arrow keys move between stars and choose them; Tab reaches the chosen star, then Clear, then leaves. Clear
 * empties the rating and puts focus back on the stars, without choosing one again.
 */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: "3 stars" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Clear rating, Interest" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const tabStop = canvas.getAllByRole("radio").find((star) => star.tabIndex === 0);
    await expect(tabStop).toHaveFocus();
    for (const star of canvas.getAllByRole("radio")) await expect(star).toHaveAttribute("aria-checked", "false");
  },
};

/**
 * Clear empties the rating, and the form then sends nothing for it. Resetting the form puts the rating back to where
 * it started, in the stars and in what the form sends.
 */
export const Clearing: Story = {
  render: (args) => {
    const [sent, setSent] = useState("Nothing sent yet");
    return (
      <form
        className="grid justify-items-start gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("interest");
          setSent(value === null ? "Sent no rating" : `Sent ${value}`);
        }}
      >
        <Rating {...args} />
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
    await userEvent.click(canvas.getByRole("radio", { name: "5 stars" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 5");
    await userEvent.click(canvas.getByRole("button", { name: "Clear rating, Interest" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent no rating");
    await userEvent.click(canvas.getByRole("button", { name: "Reset form" }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: "3 stars" })).toHaveAttribute("aria-checked", "true"));
    await userEvent.click(canvas.getByRole("button", { name: "Save rating" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 3");
  },
};

/** Controlled with `value` and `onValueChange`: `null` means no rating, and Clear reports `null`. */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(4);
    return (
      <div className="grid justify-items-start gap-3">
        <Rating label="Recipe" value={value} onValueChange={setValue} />
        <output>{value === null ? "Not rated" : `Rated ${value} of 5`}</output>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "2 stars" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Rated 2 of 5");
    await userEvent.click(canvas.getByRole("button", { name: "Clear rating, Recipe" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Not rated");
  },
};

function ShadowRating() {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  // A layout effect, so the shadow root and its parts are there before the play function starts
  useLayoutEffect(() => {
    const element = host.current;
    if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-shadow-host="">
      {root &&
        createPortal(
          <>
            {[fieldCss, choiceGroupCss, visuallyHiddenCss, insetButtonCss, ratingCss].map((css, i) => (
              <style key={i}>{css}</style>
            ))}
            <Rating label="Interest" defaultValue={3} />
          </>,
          root,
        )}
    </div>
  );
}

/**
 * Rating's group is a real `<fieldset>`, which the browser draws with a border, padding, and margin. Storybook loads
 * Tailwind's reset, which hides them, so this rating sits in a shadow root with only its own CSS. None of the
 * browser's fieldset look is left.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowRating />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>("[data-shadow-host]")!;
    await waitFor(() => expect(host.shadowRoot?.querySelector("fieldset")).toBeTruthy());
    const style = getComputedStyle(host.shadowRoot!.querySelector("fieldset")!);
    await expect(style.borderTopWidth).toBe("0px");
    await expect(style.borderLeftWidth).toBe("0px");
    await expect(style.paddingTop).toBe("0px");
    await expect(style.paddingLeft).toBe("0px");
    await expect(style.marginLeft).toBe("0px");
    await expect(style.marginRight).toBe("0px");
    await expect(style.minInlineSize).toBe("0px");
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
      <Rating label="Gold, the default" name="gold" defaultValue={3} />
      <Rating label="Brand" name="brand" color="brand" defaultValue={3} />
      <Rating label="Custom" name="custom" color="hsl(210 80% 46%)" defaultValue={3} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const theme = canvasElement.querySelector<HTMLElement>("[data-theme]")!;
    const ratings = [...theme.querySelectorAll<HTMLElement>(".rating")];
    await expect(ratings).toHaveLength(3);
    const [gold, brand, custom] = ratings.map((rating) => getComputedStyle(rating.querySelector(".rating__fill")!).fill);
    await expect(gold).toBe(resolveColor("var(--rating-gold)", theme));
    await expect(brand).toBe(resolveColor("var(--rating-brand)", theme));
    await expect(custom).toBe(resolveColor("hsl(210 80% 46%)", theme));
    await expect(gold).not.toBe(brand);
  },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <Rating label="Chosen" defaultValue={3} />
      <Rating label="Nothing chosen" />
      <Rating label="All five" defaultValue={5} />
      <Rating label="With a description" description="How much you want this job." defaultValue={2} />
      <Rating label="Invalid" invalid error="Choose how interested you are." />
      <Rating label="Invalid, with stars" invalid error="Choose 2 stars or more to apply." defaultValue={1} />
      <Rating label="Disabled" disabled defaultValue={4} />
      <Rating label="Read only" readOnly defaultValue={4} />
      <Rating label="Required" required defaultValue={2} />
      <Rating label="Three stars" max={3} defaultValue={1} />
      <Rating label="Brand color" color="brand" defaultValue={3} />
      <Rating label="Custom color" color="hsl(210 80% 46%)" defaultValue={3} />
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
