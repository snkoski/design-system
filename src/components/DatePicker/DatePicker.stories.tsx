import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker/DatePicker";
import datePickerCss from "@/components/DatePicker/date-picker.css?inline";
import { enGB } from "@/date-locales";
import { Calendar } from "@/internal/Calendar";
import calendarCss from "@/internal/calendar.css?inline";
import fieldCss from "@/internal/field.css?inline";
import insetButtonCss from "@/internal/inset-button.css?inline";
import textFieldCss from "@/internal/text-field.css?inline";
import visuallyHiddenCss from "@/internal/visually-hidden.css?inline";

// Every story fixes today, so the calendar and its screenshots don't change from day to day
const today = "2026-11-13";

/** The px value of a length token, measured in the browser. Pass a parent to see its data-pointer. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** A color token as the browser computes it, from a probe inside `parent` so its theme applies */
function tokenColor(token: string, parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  parent.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
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

/** The open calendar's dialog, which is portalled to the end of <body>, outside the story's canvas */
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const openCalendar = async (button: HTMLElement, click: (el: HTMLElement) => Promise<void>) => {
  await click(button);
  await waitFor(() => expect(dialog()).not.toBeNull());
  return dialog()!;
};

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

/** Stories that open the calendar: axe checks the whole page, so it reaches the portalled dialog */
const checksPopup = { a11y: { context: "body" } };

const meta = {
  title: "Components/Date picker",
  component: DatePicker,
  args: {
    label: "Start date",
    description: "For example, Nov 27, 2026.",
    size: "md",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    today,
    onValueChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    value: { control: false },
    ref: { control: false },
    locale: { control: false },
    isDateUnavailable: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {
  args: { defaultValue: "2026-11-12" },
};

/** Empty, filled, text that isn't a date, invalid, disabled, and read-only. A read-only field has no calendar button. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <DatePicker {...args} label="Empty" />
      <DatePicker {...args} label="Filled" defaultValue="2026-11-12" />
      <DatePicker {...args} label="Not a real date" invalid defaultValue="Nov 31, 2026" error="Enter a real date, like Nov 27, 2026." />
      <DatePicker {...args} label="Invalid (required)" required invalid error="Enter a start date." />
      <DatePicker {...args} label="Disabled" disabled defaultValue="2026-11-12" />
      <DatePicker {...args} label="Read only" readOnly defaultValue="2026-11-12" />
    </div>
  ),
};

/**
 * Medium is the default. Large matches a large button. Both are at least `target-min` tall: 24px with a mouse, 44px
 * on touch. The calendar button is square, as wide as the field is tall. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <DatePicker {...args} size="md" label="Medium" defaultValue="2026-11-12" />
      <DatePicker {...args} size="lg" label="Large" defaultValue="2026-11-12" />
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
        const button = field.parentElement!.querySelector(".date-picker__button")!;
        await expect(button.getBoundingClientRect().width).toBeCloseTo(height, 0);
      }
    });
  },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: { label: "Start date (required)", required: true, invalid: true, error: "Enter a start date." },
};

/** A disabled field can't be focused, changed, opened, or submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "2026-11-12" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Choose date, Start date" })).toBeDisabled();
  },
};

/** Read-only stays focusable and is submitted. It has no calendar button, which couldn't be used. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "2026-11-12" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toHaveAttribute("readonly");
    await expect(canvas.queryAllByRole("button")).toEqual([]);
  },
};

/** A date with no visible label, such as one in a table row, needs an `aria-label`. The button is named after it. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, description: undefined, "aria-label": "Due date", defaultValue: "2026-11-27" },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole("textbox", { name: "Due date" });
    await expect(canvas.getByRole("button", { name: "Choose date, Due date" })).toBeInTheDocument();
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      await expect(field.closest(".date-picker")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    });
  },
};

/**
 * `min` and `max` stop the calendar: days outside them are struck through, and the month buttons stop at their months.
 * A date typed outside them is kept, so the page can say what's wrong. Say the range in the description.
 */
export const MinAndMax: Story = {
  parameters: checksPopup,
  args: { label: "Interview date", description: "Between Nov 3 and Nov 25, 2026.", min: "2026-11-03", max: "2026-11-25", defaultValue: "2026-11-12" },
  play: async ({ canvas, userEvent }) => {
    const popup = await openCalendar(canvas.getByRole("button", { name: /^Choose date/ }), (el) => userEvent.click(el));
    await expect(popup.querySelector('[data-day="2026-11-02"] button')).toBeDisabled();
    await expect(popup.querySelector('[aria-label="Previous month"]')).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}");
  },
};

/** `isDateUnavailable` rules out more days, here weekends. Typed ones are kept: check them and show an error. */
export const UnavailableDays: Story = {
  parameters: checksPopup,
  args: {
    label: "Delivery date",
    description: "Weekdays only.",
    defaultValue: "2026-11-12",
    isDateUnavailable: (date: string) => [0, 6].includes(new Date(`${date}T12:00`).getDay()),
  },
  play: async ({ canvas, userEvent }) => {
    const popup = await openCalendar(canvas.getByRole("button", { name: /^Choose date/ }), (el) => userEvent.click(el));
    await expect(popup.querySelector('[data-day="2026-11-14"] button')).toBeDisabled();
    await userEvent.keyboard("{Escape}");
  },
};

/** With `locale={enGB}` (from `design-system/date-locales`), dates show and read day first, and weeks start on Monday. */
export const Locale: Story = {
  parameters: checksPopup,
  args: { locale: enGB, description: "For example, 27 Nov 2026.", defaultValue: "2026-11-12" },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toHaveValue("12 Nov 2026");
    const popup = await openCalendar(canvas.getByRole("button", { name: /^Choose date/ }), (el) => userEvent.click(el));
    await expect(popup.querySelector("th")).toHaveAttribute("aria-label", "Monday");
    await userEvent.keyboard("{Escape}");
  },
};

/**
 * Dates can be typed in several forms ("11/12/2026", "12 Nov 2026", "2026-11-12"). Each keystroke is read, and leaving
 * the field tidies a date into the shown format. The form gets `yyyy-mm-dd`.
 */
export const Typing: Story = {
  render: (args) => {
    const [sent, setSent] = useState("");
    return (
      <form
        className="grid gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get("start")));
        }}
      >
        <DatePicker {...args} name="start" />
        <Button type="submit" variant="secondary" className="justify-self-start">Save start date</Button>
        <output>{sent && `Saved: ${sent}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Start date" });
    await userEvent.type(field, "11/12/2026");
    await userEvent.tab();
    await expect(field).toHaveValue("Nov 12, 2026");
    await userEvent.click(canvas.getByRole("button", { name: "Save start date" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved: 2026-11-12");
  },
};

/** The calendar open, as a page shows it. */
export const Open: Story = {
  parameters: checksPopup,
  args: { defaultValue: "2026-11-12", min: "2026-11-03" },
  play: async ({ canvas, userEvent }) => {
    await openCalendar(canvas.getByRole("button", { name: /^Choose date/ }), (el) => userEvent.click(el));
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/November 12, 2026, selected/));
  },
};

/**
 * The calendar by keyboard: Enter on the button opens it on the chosen day; the arrows move; Enter picks and returns
 * focus to the button; Escape closes; Tab past the last day closes it too.
 */
export const Keyboard: Story = {
  parameters: checksPopup,
  args: { defaultValue: "2026-11-12" },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Start date" });
    const button = canvas.getByRole("button", { name: /^Choose date/ });
    await userEvent.click(field);
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/November 12, 2026, selected/));
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await waitFor(() => expect(dialog()).toBeNull());
    await expect(field).toHaveValue("Nov 13, 2026");
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(dialog()).not.toBeNull());
    // The focused day is the popup's last Tab stop, so Tab leaves it, which closes it
    await userEvent.tab();
    await waitFor(() => expect(dialog()).toBeNull());
  },
};

/**
 * The calendar is portalled to the end of the page, but takes the theme, pointer mode, and density of the section the
 * field is in. Here a dark section on a light page, then a hot dog one on touch.
 */
export const InheritsScope: Story = {
  parameters: { ...checksPopup, layout: "fullscreen" },
  render: (args) => (
    <div className="grid gap-4 p-8">
      <section data-theme="dark" className="grid p-4" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <DatePicker {...args} label="Dark section" defaultValue="2026-11-12" />
      </section>
      <section data-theme="hotdog" data-pointer="coarse" className="grid p-4" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <DatePicker {...args} label="Hot dog on touch" defaultValue="2026-11-12" />
      </section>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const [dark, hotdog] = [...canvasElement.querySelectorAll<HTMLElement>("section")];
    let popup = await openCalendar(canvas.getByRole("button", { name: "Choose date, Dark section" }), (el) => userEvent.click(el));
    await expect(getComputedStyle(popup.querySelector(".calendar__caption")!).color).toBe(tokenColor("--ink", dark!));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());

    popup = await openCalendar(canvas.getByRole("button", { name: "Choose date, Hot dog on touch" }), (el) => userEvent.click(el));
    await expect(parseFloat(getComputedStyle(popup).borderTopWidth)).toBe(measure("--border-thick", hotdog!));
    const cell = measure("--control-md", hotdog!);
    await expect(measure("--target-min", hotdog!)).toBeGreaterThanOrEqual(44); // the touch floor
    await expect(popup.querySelector(".calendar__day-button")!.getBoundingClientRect().height).toBeCloseTo(cell, 0);
    await userEvent.keyboard("{Escape}");
  },
};

/**
 * On touch, each day is 44px, so the calendar is 308px wide. It fits a 320px screen (WCAG reflow) because the popup adds
 * only its edge around it, and Base UI keeps it 4px from each side. The story checks the budget, in hot dog's thicker
 * edge: the popup is at most 312px wide.
 */
export const NarrowScreen: Story = {
  parameters: checksPopup,
  decorators: [(Story) => <div data-theme="hotdog" data-pointer="coarse" className="w-80 p-4" style={{ background: "var(--bg)" }}><Story /></div>],
  args: { defaultValue: "2026-11-12" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const scope = canvasElement.querySelector<HTMLElement>("[data-pointer]")!;
    await expect(measure("--target-min", scope)).toBeGreaterThanOrEqual(44); // on touch
    // Seven touch-sized days and the popup's two hot dog edges, which must fit 320px less 4px on each side
    const budget = 7 * measure("--control-md", scope) + 2 * measure("--border-thick", scope);
    await expect(budget).toBeLessThanOrEqual(320 - 2 * 4);
    const popup = await openCalendar(canvas.getByRole("button", { name: /^Choose date/ }), (el) => userEvent.click(el));
    await expect(popup.getBoundingClientRect().width).toBeLessThanOrEqual(budget + 0.5);
    await userEvent.keyboard("{Escape}");
  },
};

/**
 * The calendar button's hit area is the field's full height and a square of it, right up to the field's edge; the rest
 * of the field is the input. In the calendar, each day and month button is at least `target-min` both ways. Checked
 * with a real hit-test, with a mouse and on touch.
 */
export const HitAreas: Story = {
  parameters: checksPopup,
  args: { defaultValue: "2026-11-12" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    const button = canvas.getByRole("button", { name: /^Choose date/ });
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      const field = input.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(target);
      await expect(box.height).toBeGreaterThanOrEqual(target);
      const x = box.left + box.width / 2;
      for (const y of [box.top + box.height / 2, field.top + 1, field.bottom - 1]) {
        await expect(button.contains(document.elementFromPoint(x, y))).toBe(true);
      }
      await expect(button.contains(document.elementFromPoint(field.right - 1, field.top + field.height / 2))).toBe(true);
      await expect(document.elementFromPoint((field.left + box.left) / 2, field.top + field.height / 2)).toBe(input);

      const popup = await openCalendar(button, (el) => userEvent.click(el));
      // The popup is outside canvasElement, so on touch it takes data-pointer from the field's ancestors: here canvasElement
      for (const part of popup.querySelectorAll<HTMLElement>(".calendar__day-button, .calendar__nav-button")) {
        const rect = part.getBoundingClientRect();
        await expect(rect.width).toBeGreaterThanOrEqual(target);
        await expect(rect.height).toBeGreaterThanOrEqual(target);
      }
      const day = popup.querySelector<HTMLElement>('[data-day="2026-11-20"] button')!;
      const rect = day.getBoundingClientRect();
      await expect(day.contains(document.elementFromPoint(rect.left + 1, rect.top + 1))).toBe(true);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).toBeNull());
    });
  },
};

/** The field and the calendar in a shadow root, holding only their CSS, with no CSS reset */
function ShadowDatePicker() {
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
            {[fieldCss, textFieldCss, visuallyHiddenCss, insetButtonCss, datePickerCss, calendarCss].map((css, i) => (
              <style key={i}>{css}</style>
            ))}
            <DatePicker label="Start date" defaultValue="2026-11-12" today={today} />
            <div className="date-picker__popup">
              <Calendar value="2026-11-12" onPick={() => {}} month="2026-11-01" onMonthChange={() => {}} today={today} />
            </div>
          </>,
          root,
        )}
    </div>
  );
}

/**
 * On a site with no CSS reset, a `<button>` comes with a gray fill, a border, and padding, and a `<table>` with spacing
 * between its cells. Storybook loads Tailwind's reset, which would hide that, so this field and calendar sit in a shadow
 * root with only their own CSS. The buttons still draw nothing but their content at rest, and the days touch.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowDatePicker />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("[data-shadow-host]");
    await waitFor(() => expect(host?.shadowRoot?.querySelector(".calendar__grid")).toBeTruthy());
    const shadow = host!.shadowRoot!;
    const buttons = shadow.querySelectorAll(".date-picker__button, .calendar__nav-button, .calendar__day-button");
    await expect(buttons.length).toBeGreaterThan(30);
    for (const button of buttons) {
      const style = getComputedStyle(button);
      await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        await expect(style[`border${side}Width`]).toBe("0px");
        await expect(style[`padding${side}`]).toBe("0px");
      }
    }
    const grid = shadow.querySelector(".calendar__grid")!;
    await expect(["0px", "0px 0px"]).toContain(getComputedStyle(grid).borderSpacing);
    await expect(getComputedStyle(shadow.querySelector(".calendar__day")!).paddingTop).toBe("0px");
  },
};

/** A field whose calendar button shows the open look, for screenshots, without a popup covering the page */
function OpenButtonLook() {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    box.current?.querySelector(".date-picker__button")?.setAttribute("data-popup-open", "");
  }, []);
  return (
    <div ref={box}>
      <DatePicker label="Calendar open" defaultValue="2026-11-12" today={today} />
    </div>
  );
}

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <DatePicker label="Empty" description="For example, Nov 27, 2026." today={today} />
      <DatePicker label="Filled" defaultValue="2026-11-12" today={today} />
      <DatePicker label="Large" size="lg" defaultValue="2026-11-12" today={today} />
      <DatePicker aria-label="Due date" defaultValue="2026-11-27" today={today} />
      <DatePicker label="Not a real date" invalid defaultValue="Nov 31, 2026" error="Enter a real date, like Nov 27, 2026." today={today} />
      <DatePicker label="Disabled" disabled defaultValue="2026-11-12" today={today} />
      <DatePicker label="Read only" readOnly defaultValue="2026-11-12" today={today} />
      <OpenButtonLook />
      {/* The calendar as the popup draws it, inline so every theme's screenshot has it: chosen (12th), today (13th),
          days before min struck through, Previous month unavailable, and weekends ruled out */}
      <div className="date-picker__popup justify-self-start">
        <Calendar
          value="2026-11-12"
          onPick={() => {}}
          month="2026-11-01"
          onMonthChange={() => {}}
          today={today}
          min="2026-11-03"
          isDateUnavailable={(date) => date === "2026-11-26"}
        />
      </div>
    </div>
  );
}

/** Every state in all three themes at once, with the calendar. Chromatic snapshots this one. */
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
