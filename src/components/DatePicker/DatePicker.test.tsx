import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as locales from "date-fns/locale";
import { de, enGB } from "date-fns/locale";
import { createRef, useState } from "react";
import type { ReactElement, Ref } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { DatePicker, isDateValue } from "@/components/DatePicker/DatePicker";
import * as designSystem from "@/index";
import type { DateLocale, DatePickerChangeDetails, DatePickerProps, DatePickerSize } from "@/components/DatePicker/DatePicker";

const today = "2026-11-13";
const getInput = () => screen.getByRole<HTMLInputElement>("textbox");
const getButton = (name: string | RegExp = /^Choose date/) => screen.getByRole("button", { name });
const queryDialog = () => screen.queryByRole("dialog");
/** The <label> element. Its words are in a span inside it, which the calendar button's name points at. */
const getLabel = (text = "Start date") => {
  const label = screen.getByText(text).closest("label");
  expect(label).not.toBeNull();
  return label!;
};
const getBox = (container: HTMLElement) => container.querySelector<HTMLElement>(".date-picker__box")!;
/** The hidden input the form submits. */
const getHidden = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
/** Every entry a form sends, as name to list of values, so a second input with the same name shows up. */
const submitted = (form: HTMLFormElement) => {
  const entries: Record<string, FormDataEntryValue[]> = {};
  for (const [name, value] of new FormData(form)) (entries[name] ??= []).push(value);
  return entries;
};
const lastCall = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1);
/** Replaces the field's text in one change, faster than typing it key by key. */
const setText = (text: string) => fireEvent.change(getInput(), { target: { value: text } });

/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends. */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}

describe("DatePicker", () => {
  describe("rendering", () => {
    it("renders a text field named by its label", () => {
      render(<DatePicker label="Start date" today={today} />);
      const input = screen.getByRole("textbox", { name: "Start date" });
      expect(input.tagName).toBe("INPUT");
      expect(input).toHaveAttribute("type", "text");
    });

    it("renders the input with the shared and its own class, inside the box", () => {
      const { container } = render(<DatePicker label="Start date" today={today} />);
      expect(getInput()).toHaveClass("text-field__control", "date-picker__control");
      expect(getBox(container)).toContainElement(getInput());
    });

    it("renders the label as a <label> pointing at the input", () => {
      render(<DatePicker label="Start date" today={today} />);
      const label = getLabel();
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("field-label", "date-picker__label");
      expect(label).toHaveAttribute("for", getInput().id);
    });

    it("defaults to the md size, on the outer element with the shared text field class", () => {
      const { container } = render(<DatePicker label="Start date" today={today} />);
      expect(container.firstElementChild).toHaveClass("text-field", "date-picker");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<DatePicker label="Start date" size={size} today={today} />);
      expect(container.firstElementChild).toHaveClass("date-picker");
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never sets the native size attribute", () => {
      render(<DatePicker label="Start date" size="lg" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("size");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<DatePicker aria-label="Due date" today={today} />);
      expect(screen.getByRole("textbox", { name: "Due date" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the field", () => {
      const { container } = render(
        <DatePicker label="Start date" description="For example, Nov 27, 2026." invalid error="Enter a start date." today={today} />,
      );
      const parts = ["date-picker__label", "date-picker__description", "date-picker__error", "date-picker__box"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared field class on the description", () => {
      render(<DatePicker label="Start date" description="For example, Nov 27, 2026." today={today} />);
      expect(screen.getByText("For example, Nov 27, 2026.")).toHaveClass("field-description", "date-picker__description");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<DatePicker label="Start date" className="mt-4" today={today} />);
      expect(container.firstElementChild).toHaveClass("date-picker", "mt-4");
    });

    it("passes other props through to the input", () => {
      render(<DatePicker label="Start date" placeholder="Nov 27, 2026" data-testid="start" title="Start" today={today} />);
      expect(screen.getByTestId("start")).toBe(getInput());
      expect(getInput()).toHaveAttribute("placeholder", "Nov 27, 2026");
      expect(getInput()).toHaveAttribute("title", "Start");
    });

    it("turns autocomplete off by default, and lets autoComplete replace it", () => {
      const { rerender } = render(<DatePicker label="Start date" today={today} />);
      expect(getInput()).toHaveAttribute("autocomplete", "off");
      rerender(<DatePicker label="Start date" autoComplete="bday" today={today} />);
      expect(getInput()).toHaveAttribute("autocomplete", "bday");
    });

    it("sets no inputmode, so phones show the full keyboard: month names need letters", () => {
      render(<DatePicker label="Start date" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("inputmode");
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <DatePicker label="Start date" size="lg" invalid disabled error="Bad" description="More" defaultValue="2026-11-12" today={today} />,
      );
      expect(getBox(container)).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/date-picker--/);
    });
  });

  describe("calendar button", () => {
    it("names the button after the field, so two date fields don't give two identical buttons", () => {
      render(
        <>
          <DatePicker label="Start date" today={today} />
          <DatePicker label="End date" today={today} />
        </>,
      );
      expect(screen.getByRole("button", { name: "Choose date, Start date" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Choose date, End date" })).toBeInTheDocument();
    });

    it("names it after an aria-label when the field has one", () => {
      render(<DatePicker aria-label="Due date" today={today} />);
      expect(getButton("Choose date, Due date")).toBeInTheDocument();
    });

    it("keeps the button's name when the page adds its own aria-labelledby to the input", () => {
      render(
        <>
          <span id="row">Row 3</span>
          <DatePicker label="Start date" aria-labelledby="row" today={today} />
        </>,
      );
      expect(getButton("Choose date, Start date")).toBeInTheDocument();
    });

    it("is an inset button after the input, announcing that it opens a dialog", () => {
      const { container } = render(<DatePicker label="Start date" today={today} />);
      const button = getButton();
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveClass("inset-button", "date-picker__button");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(getInput().compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(getBox(container)).toHaveAttribute("data-button");
    });

    it("draws a calendar icon hidden from screen readers", () => {
      render(<DatePicker label="Start date" today={today} />);
      const icon = getButton().querySelector("svg");
      expect(icon).toHaveClass("inset-button__icon", "date-picker__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    });

    it("is the second Tab stop, after the input", async () => {
      const user = userEvent.setup();
      render(
        <>
          <DatePicker label="Start date" today={today} />
          <button type="button">Next</button>
        </>,
      );
      await user.tab();
      expect(getInput()).toHaveFocus();
      await user.tab();
      expect(getButton()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });
  });

  describe("typing", () => {
    it("reads the text on every keystroke and reports the value read so far", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      await user.type(getInput(), "11/12/2026");
      expect(onValueChange).toHaveBeenCalledTimes(10);
      expect(onValueChange.mock.calls[0]).toEqual(["1", { reason: "type", text: "1", isDate: false }]);
      expect(lastCall(onValueChange)).toEqual(["2026-11-12", { reason: "type", text: "11/12/2026", isDate: true }]);
    });

    it("tidies a date into the shown format on leaving the field, without reporting a change", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      await user.type(getInput(), "11/12/2026");
      const calls = onValueChange.mock.calls.length;
      await user.tab();
      expect(getInput()).toHaveValue("Nov 12, 2026");
      expect(onValueChange).toHaveBeenCalledTimes(calls);
    });

    it.each([
      ["the shown format", "Nov 12, 2026"],
      ["in lower case", "nov 12, 2026"],
      ["year first with dashes", "2026-11-12"],
      ["year first with slashes", "2026/11/12"],
      ["year first with dots", "2026.11.12"],
      ["numbers in en-US order", "11/12/2026"],
      ["the full month name", "November 12, 2026"],
      ["the day first", "12 Nov 2026"],
      ["an ordinal", "Nov 12th 2026"],
      ["dashes between words", "12-Nov-2026"],
      ["extra spaces", "  Nov   12,  2026 "],
      ["a non-breaking space", "Nov 12, 2026"],
    ])("reads %s", (_how, text) => {
      const onValueChange = vi.fn();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      setText(text);
      expect(lastCall(onValueChange)?.[0]).toBe("2026-11-12");
    });

    it("reads one-digit days and months in the locale's order", () => {
      const onValueChange = vi.fn();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      setText("1/2/2026");
      expect(lastCall(onValueChange)?.[0]).toBe("2026-01-02");
    });

    it.each([
      ["a two-digit year", "11/12/26", "11/12/26"],
      ["a day that doesn't exist", "Feb 30, 2026", "Feb 30, 2026"],
      ["words", "next Tuesday", "next Tuesday"],
      ["mixed separators", "2026-11/12", "2026-11/12"],
      ["text with spaces around it", "  next   Tuesday ", "next Tuesday"],
      ["only spaces", "   ", ""],
    ])("keeps %s as the value, trimmed, so the page can say it isn't a real date", (_how, text, value) => {
      const onValueChange = vi.fn();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      setText(text);
      expect(lastCall(onValueChange)?.[0]).toBe(value);
    });

    it("keeps a yyyy-mm-dd day that doesn't exist as typed text, and says it isn't a date", () => {
      const onValueChange = vi.fn();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      setText("2026-11-31");
      expect(lastCall(onValueChange)).toEqual(["2026-11-31", { reason: "type", text: "2026-11-31", isDate: false }]);
      // A pattern alone would take it for a date; isDateValue doesn't
      expect(/^\d{4}-\d{2}-\d{2}$/.test("2026-11-31")).toBe(true);
      expect(isDateValue("2026-11-31")).toBe(false);
    });

    it("says in onValueChange's details whether the value is a date, on every keystroke", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      await user.type(getInput(), "11/12/2026");
      const flags = onValueChange.mock.calls.map(([, details]) => details.isDate);
      expect(flags.slice(0, -1).every((flag) => flag === false)).toBe(true);
      expect(flags.at(-1)).toBe(true);
      await user.clear(getInput());
      expect(lastCall(onValueChange)).toEqual(["", { reason: "type", text: "", isDate: false }]);
    });

    it("leaves text that isn't a date as typed on leaving the field", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" today={today} />);
      await user.type(getInput(), "next Tuesday");
      await user.tab();
      expect(getInput()).toHaveValue("next Tuesday");
    });

    it("reports every edit, even one that doesn't change the value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.click(getInput());
      await user.keyboard("{End} ");
      expect(lastCall(onValueChange)).toEqual(["2026-11-12", { reason: "type", text: "Nov 12, 2026 ", isDate: true }]);
    });

    it("changes nothing when the field is tabbed through without typing", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.tab();
      await user.tab();
      expect(getInput()).toHaveValue("Nov 12, 2026");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("rewrites text only after an edit: Enter without typing changes nothing", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="soon" today={today} />);
      await user.click(getInput());
      await user.keyboard("{Enter}");
      expect(getInput()).toHaveValue("soon");
    });

    it("shows defaultValue in the shown format, and any other text as it is", () => {
      const { rerender } = render(<DatePicker key="a" label="Start date" defaultValue="2026-11-12" today={today} />);
      expect(getInput()).toHaveValue("Nov 12, 2026");
      rerender(<DatePicker key="b" label="Start date" defaultValue="sometime soon" today={today} />);
      expect(getInput()).toHaveValue("sometime soon");
    });

    it("shows and reads dates in the locale's format", () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<DatePicker key="gb" label="Start date" defaultValue="2026-11-12" locale={enGB} onValueChange={onValueChange} today={today} />);
      expect(getInput()).toHaveValue("12 Nov 2026");
      setText("12/11/2026");
      expect(lastCall(onValueChange)?.[0]).toBe("2026-11-12");
      rerender(<DatePicker key="de" label="Start date" locale={de} onValueChange={onValueChange} today={today} />);
      setText("12.11.2026");
      expect(lastCall(onValueChange)?.[0]).toBe("2026-11-12");
    });

    // Renders a field for each of date-fns's ~95 locales, so it needs more than the default 5 seconds when the unit and
    // story projects run together
    it("reads back what it shows, as shown and in lower case, in every date-fns locale", { timeout: 30_000 }, () => {
      const failures: string[] = [];
      for (const [name, locale] of Object.entries(locales)) {
        const onValueChange = vi.fn();
        const { unmount } = render(<DatePicker label="Date" defaultValue="2026-11-12" locale={locale} onValueChange={onValueChange} today={today} />);
        const shown = getInput().value;
        for (const text of [shown, shown.toLowerCase()]) {
          setText("");
          setText(text);
          if (lastCall(onValueChange)?.[0] !== "2026-11-12") failures.push(`${name}: ${JSON.stringify(text)}`);
        }
        unmount();
      }
      expect(failures).toEqual([]);
    });

    it("calls the page's onFocus, and its onBlur after tidying the text", async () => {
      const seen: string[] = [];
      const user = userEvent.setup();
      render(
        <DatePicker
          label="Start date"
          onFocus={() => seen.push("focus")}
          onBlur={(event) => seen.push(`blur ${event.target.value}`)}
          today={today}
        />,
      );
      await user.type(getInput(), "11/12/2026");
      await user.tab();
      expect(seen).toEqual(["focus", "blur Nov 12, 2026"]);
    });

    it("calls the page's onKeyDown first; preventing Enter leaves the text as typed", async () => {
      const onKeyDown = vi.fn((event: { key: string; preventDefault: () => void }) => {
        if (event.key === "Enter") event.preventDefault();
      });
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onKeyDown={onKeyDown} today={today} />);
      await user.type(getInput(), "11/12/2026{Enter}");
      expect(onKeyDown).toHaveBeenCalled();
      expect(getInput()).toHaveValue("11/12/2026");
    });

    it("tidies the text on Enter when the page doesn't prevent it", async () => {
      const onKeyDown = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onKeyDown={onKeyDown} today={today} />);
      await user.type(getInput(), "11/12/2026{Enter}");
      expect(onKeyDown).toHaveBeenCalled();
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("still calls a native onChange with the input's own event", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" onChange={onChange} today={today} />);
      await user.type(getInput(), "1");
      expect(onChange).toHaveBeenCalled();
      expect(lastCall(onChange)?.[0].target).toBe(getInput());
    });

    it("focuses the input when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" today={today} />);
      await user.click(screen.getByText("Start date"));
      expect(getInput()).toHaveFocus();
    });
  });

  describe("controlled", () => {
    it("shows the value it's given, in the shown format", () => {
      const { rerender } = render(<DatePicker label="Start date" value="2026-11-12" today={today} />);
      expect(getInput()).toHaveValue("Nov 12, 2026");
      rerender(<DatePicker label="Start date" value="" today={today} />);
      expect(getInput()).toHaveValue("");
    });

    it("shows a value that isn't a date as it is, and leaves it alone", () => {
      const { rerender } = render(<DatePicker label="Start date" value="Nov 12, 2026" today={today} />);
      expect(getInput()).toHaveValue("Nov 12, 2026");
      rerender(<DatePicker label="Start date" value="Nov 12, 2026" today={today} />);
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("undoes a keystroke the page doesn't follow, like a controlled input", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" value="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.click(getInput());
      await user.keyboard("{End}x");
      expect(lastCall(onValueChange)?.[0]).toBe("Nov 12, 2026x");
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("keeps the text as typed when the page follows onValueChange, without rewriting it mid-word", async () => {
      function Controlled() {
        const [value, setValue] = useState("");
        return (
          <>
            <DatePicker label="Start date" value={value} onValueChange={setValue} today={today} />
            <output>{value}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.type(getInput(), "11/1");
      expect(getInput()).toHaveValue("11/1");
      expect(screen.getByRole("status")).toHaveTextContent("11/1");
      await user.type(getInput(), "2/2026");
      expect(getInput()).toHaveValue("11/12/2026");
      expect(screen.getByRole("status")).toHaveTextContent("2026-11-12");
      await user.tab();
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("replaces the text when the page sets a new value, even while the field has focus", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DatePicker label="Start date" value="" onValueChange={() => {}} today={today} />);
      await user.click(getInput());
      rerender(<DatePicker label="Start date" value="2027-01-05" onValueChange={() => {}} today={today} />);
      expect(getInput()).toHaveValue("Jan 5, 2027");
      expect(getInput()).toHaveFocus();
    });
  });

  describe("the calendar", () => {
    it("opens a dialog named after the field, with focus on the chosen day", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" today={today} />);
      await user.click(getButton());
      const dialog = await screen.findByRole("dialog", { name: "Choose date, Start date" });
      expect(dialog).toHaveClass("date-picker__popup");
      expect(getButton()).toHaveAttribute("aria-expanded", "true");
      await waitFor(() => expect(screen.getByRole("button", { name: /November 12, 2026, selected/ })).toHaveFocus());
    });

    it("opens on today's month with today focused when the field is empty", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" today="2027-03-09" />);
      await user.click(getButton());
      expect(await screen.findByRole("grid", { name: "March 2027" })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("button", { name: /^Today, / })).toHaveFocus());
    });

    it("opens on min's month when the value is earlier", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-01-15" min="2026-06-10" today="2026-06-20" />);
      await user.click(getButton());
      expect(await screen.findByRole("grid", { name: "June 2026" })).toBeInTheDocument();
    });

    it("picks a day: reports it, shows it, closes, and puts focus back on the button", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.click(getButton());
      await user.click(await screen.findByRole("button", { name: /November 20,/ }));
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith("2026-11-20", { reason: "pick", text: "Nov 20, 2026", isDate: true });
      expect(getInput()).toHaveValue("Nov 20, 2026");
      await waitFor(() => expect(queryDialog()).toBeNull());
      await waitFor(() => expect(getButton()).toHaveFocus());
    });

    it("picks with the keyboard", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      getButton().focus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(screen.getByRole("button", { name: /November 12,/ })).toHaveFocus());
      await user.keyboard("{ArrowRight}{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("2026-11-13", { reason: "pick", text: "Nov 13, 2026", isDate: true });
    });

    it("just closes when the day already chosen is picked again", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.click(getButton());
      await user.click(await screen.findByRole("button", { name: /November 12,/ }));
      await waitFor(() => expect(queryDialog()).toBeNull());
      expect(onValueChange).not.toHaveBeenCalled();
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("closes with Escape and puts focus back on the button", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" today={today} />);
      await user.click(getButton());
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(queryDialog()).toBeNull());
      await waitFor(() => expect(getButton()).toHaveFocus());
    });

    it("can't pick days outside min and max, or ruled out by isDateUnavailable", async () => {
      const user = userEvent.setup();
      const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00`).getDay());
      render(<DatePicker label="Start date" min="2026-11-03" max="2026-11-25" isDateUnavailable={weekend} today={today} />);
      await user.click(getButton());
      expect(await screen.findByRole("button", { name: /November 2,/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /November 26,/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /November 14,/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /November 4,/ })).toBeEnabled();
    });

    it("carries the field's theme and pointer settings into the portalled popup", async () => {
      const user = userEvent.setup();
      render(
        <div data-theme="hotdog" data-pointer="coarse" lang="pl">
          <DatePicker label="Start date" today={today} />
        </div>,
      );
      await user.click(getButton());
      const dialog = await screen.findByRole("dialog");
      expect(dialog.closest("[data-theme]")).toHaveAttribute("data-theme", "hotdog");
      expect(dialog.closest("[data-pointer]")).toHaveAttribute("data-pointer", "coarse");
      expect(dialog.closest("[lang]")).toHaveAttribute("lang", "pl");
      expect(dialog.closest("[data-theme]")).toHaveAttribute("data-base-ui-portal");
    });

    it("ships none of DayPicker's own classes", async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Start date" defaultValue="2026-11-12" min="2026-11-03" today={today} />);
      await user.click(getButton());
      await screen.findByRole("grid");
      expect(document.body.innerHTML).not.toMatch(/rdp-/);
    });

    it("closes, with focus on the input, when the field becomes read-only while open", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DatePicker label="Start date" today={today} />);
      await user.click(getButton());
      await screen.findByRole("dialog");
      rerender(<DatePicker label="Start date" readOnly today={today} />);
      await waitFor(() => expect(queryDialog()).toBeNull());
      await waitFor(() => expect(getInput()).toHaveFocus());
      // Editable again, it stays closed: it doesn't reopen by itself and take focus
      rerender(<DatePicker label="Start date" today={today} />);
      await act(async () => {});
      expect(getButton()).toHaveAttribute("aria-expanded", "false");
      expect(queryDialog()).toBeNull();
      expect(getInput()).toHaveFocus();
    });

    it("closes when the field becomes disabled while open", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DatePicker label="Start date" today={today} />);
      await user.click(getButton());
      await screen.findByRole("dialog");
      rerender(<DatePicker label="Start date" disabled today={today} />);
      await waitFor(() => expect(queryDialog()).toBeNull());
      rerender(<DatePicker label="Start date" today={today} />);
      await act(async () => {});
      expect(getButton()).toHaveAttribute("aria-expanded", "false");
      expect(queryDialog()).toBeNull();
    });

    it("moves to the new value's month when the page changes it while open", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DatePicker label="Start date" value="2026-11-12" onValueChange={() => {}} today={today} />);
      await user.click(getButton());
      await screen.findByRole("grid", { name: "November 2026" });
      rerender(<DatePicker label="Start date" value="2027-02-03" onValueChange={() => {}} today={today} />);
      expect(await screen.findByRole("grid", { name: "February 2027" })).toBeInTheDocument();
    });
  });

  describe("disabled", () => {
    it("blocks typing and the calendar, and is marked disabled", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<DatePicker label="Start date" disabled defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      expect(getInput()).toBeDisabled();
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(getLabel()).toHaveAttribute("data-disabled");
      expect(getButton()).toBeDisabled();
      expect(getButton()).toHaveAttribute("data-disabled");
      await user.type(getInput(), "5");
      await user.click(getButton());
      expect(queryDialog()).toBeNull();
      expect(getInput()).toHaveValue("Nov 12, 2026");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is skipped by Tab, button and all", async () => {
      const user = userEvent.setup();
      render(
        <>
          <DatePicker label="Off" disabled today={today} />
          <DatePicker label="On" today={today} />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("textbox", { name: "On" })).toHaveFocus();
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<DatePicker label="Start date" readOnly defaultValue="2026-11-12" today={today} />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(getInput()).toHaveAccessibleName("Start date");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<DatePicker label="Start date" defaultValue="2026-11-12" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<DatePicker label="Start date" readOnly disabled defaultValue="2026-11-12" today={today} />);
      expect(getInput()).toHaveAttribute("readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("leaves out the calendar button, which couldn't be used, and the box's mark", () => {
      const { container } = render(<DatePicker label="Start date" readOnly defaultValue="2026-11-12" today={today} />);
      expect(getInput()).toHaveAttribute("readonly");
      expect(screen.queryAllByRole("button")).toEqual([]);
      expect(getBox(container)).not.toHaveAttribute("data-button");
    });

    it("blocks typing but keeps its value, and stays in the tab order", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker label="Start date" readOnly defaultValue="2026-11-12" onValueChange={onValueChange} today={today} />);
      await user.tab();
      expect(getInput()).toHaveFocus();
      await user.keyboard("5");
      expect(getInput()).toHaveValue("Nov 12, 2026");
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      render(<DatePicker label="Start date (required)" required today={today} />);
      expect(getInput()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<DatePicker label="Start date" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toBeRequired();
    });

    it("is announced as invalid", () => {
      render(<DatePicker label="Start date" invalid today={today} />);
      expect(getInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<DatePicker label="Start date" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the input, outside its name", () => {
      render(<DatePicker label="Start date" description="For example, Nov 27, 2026." today={today} />);
      expect(getInput()).toHaveAccessibleDescription("For example, Nov 27, 2026.");
      expect(getInput()).toHaveAccessibleName("Start date");
    });

    it("shows the error, linked to the input, when invalid", () => {
      render(<DatePicker label="Start date" invalid error="Enter a real date, like Nov 27, 2026." today={today} />);
      expect(getInput()).toHaveAccessibleDescription("Error: Enter a real date, like Nov 27, 2026.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<DatePicker label="Start date" invalid error="Enter a start date." today={today} />);
      const error = screen.getByText("Enter a start date.").closest(".date-picker__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the field is valid", () => {
      render(<DatePicker label="Start date" error="Enter a start date." today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByText("Enter a start date.")).not.toBeInTheDocument();
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">You can change it later.</p>
          <DatePicker label="Start date" description="For example, Nov 27, 2026." invalid error="Enter a start date." aria-describedby="hint" today={today} />
        </>,
      );
      expect(getInput()).toHaveAccessibleDescription("You can change it later. For example, Nov 27, 2026. Error: Enter a start date.");
    });
  });

  describe("in a form", () => {
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits the yyyy-mm-dd date once, under its name, from a hidden input; the visible input has no name", () => {
      const { container } = render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" defaultValue="2026-11-12" today={today} />
        </form>,
      );
      expect(getInput()).toHaveValue("Nov 12, 2026");
      expect(getInput()).not.toHaveAttribute("name");
      expect(getHidden(container)).toHaveAttribute("name", "start");
      expect(submitted(getForm())).toEqual({ start: ["2026-11-12"] });
    });

    it("submits what was typed: a date once it reads as one, the text otherwise", () => {
      render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" today={today} />
        </form>,
      );
      setText("11/12/2026");
      expect(submitted(getForm())).toEqual({ start: ["2026-11-12"] });
      setText("next Tuesday");
      expect(submitted(getForm())).toEqual({ start: ["next Tuesday"] });
    });

    it("submits an empty string when empty", () => {
      const { container } = render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" today={today} />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("name", "start");
      expect(submitted(getForm())).toEqual({ start: [""] });
    });

    it("submits a read-only value", () => {
      render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" readOnly defaultValue="2026-11-12" today={today} />
        </form>,
      );
      expect(submitted(getForm())).toEqual({ start: ["2026-11-12"] });
    });

    it("does not submit when disabled", () => {
      const { container } = render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" disabled defaultValue="2026-11-12" today={today} />
        </form>,
      );
      expect(getHidden(container)).toHaveAttribute("name", "start");
      expect(submitted(getForm())).toEqual({});
    });

    it("fails the form's own validation when required and empty, and only then", () => {
      render(
        <form data-testid="form">
          <DatePicker label="Start date (required)" name="start" required today={today} />
        </form>,
      );
      expect(getForm().checkValidity()).toBe(false);
      setText("next Tuesday");
      expect(getForm().checkValidity()).toBe(true);
    });

    it("submits the new date when Enter is pressed straight after typing it", async () => {
      const sent: (string | null)[] = [];
      const user = userEvent.setup();
      render(
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            sent.push(new FormData(event.currentTarget).get("start") as string | null);
          }}
        >
          <DatePicker label="Start date" name="start" today={today} />
          <button type="submit">Save dates</button>
        </form>,
      );
      await user.type(getInput(), "11/12/2026{Enter}");
      expect(sent).toEqual(["2026-11-12"]);
      expect(getInput()).toHaveValue("Nov 12, 2026");
    });

    it("goes back to defaultValue when the form is reset", async () => {
      const { container } = render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" defaultValue="2026-11-12" today={today} />
        </form>,
      );
      setText("next Tuesday");
      await act(async () => {
        getForm().reset();
      });
      await waitFor(() => expect(getInput()).toHaveValue("Nov 12, 2026"));
      expect(getHidden(container)).toHaveValue("2026-11-12");
    });

    it("leaves a controlled value alone when the form is reset, and doesn't report a change", async () => {
      const onValueChange = vi.fn();
      render(
        <form data-testid="form">
          <DatePicker label="Start date" name="start" value="2027-01-05" onValueChange={onValueChange} today={today} />
        </form>,
      );
      await act(async () => {
        getForm().reset();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(getInput()).toHaveValue("Jan 5, 2027");
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("id and form", () => {
    it("puts id on the input, and the label points to it", () => {
      render(<DatePicker label="Start date" id="start" today={today} />);
      expect(getInput()).toHaveAttribute("id", "start");
      expect(getLabel()).toHaveAttribute("for", "start");
    });

    it("submits with a form it sits outside of", () => {
      const { container } = render(
        <>
          <form id="dates" data-testid="outside-form" />
          <DatePicker label="Start date" name="start" form="dates" defaultValue="2026-11-12" today={today} />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect(submitted(form)).toEqual({ start: ["2026-11-12"] });
      expect(getInput()).toHaveAttribute("form", "dates");
      expect(getHidden(container)).toHaveAttribute("form", "dates");
    });
  });

  describe("refs", () => {
    it("forwards ref to the visible input", () => {
      const ref = createRef<HTMLInputElement>();
      render(<DatePicker label="Start date" ref={ref} today={today} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(getInput());
    });
  });

  describe("server rendering", () => {
    const field = () => <DatePicker label="Start date" name="start" defaultValue="2026-11-12" today={today} />;

    it("sends the label, the shown date, and the submitted date in the server HTML", () => {
      const host = serverHtml(field());
      expect(host.querySelector("label")).toHaveTextContent("Start date");
      expect(host.querySelector<HTMLInputElement>(".date-picker__control")).toHaveValue("Nov 12, 2026");
      expect(getHidden(host)).toHaveValue("2026-11-12");
    });

    it("hydrates the server HTML without a mismatch", () => {
      const host = serverHtml(field());
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, field());
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      expect(host.querySelector(".date-picker__control")).toHaveValue("Nov 12, 2026");
    });
  });

  describe("props it leaves out", () => {
    // Each is kept out of the props type; these check that passing one anyway from JavaScript changes nothing.
    const untyped = (props: Record<string, unknown>) => props as unknown as Partial<DatePickerProps>;

    it.each([
      ["type", "date", "type", "text"],
    ])("drops %s, so the input stays a text field", (prop, given, attribute, kept) => {
      render(<DatePicker label="Start date" today={today} {...untyped({ [prop]: given })} />);
      expect(getInput()).toHaveAttribute(attribute, kept);
    });

    it.each([
      ["inputMode", "numeric", "inputmode"],
      ["pattern", "[0-9]*", "pattern"],
      ["maxLength", 10, "maxlength"],
      ["minLength", 1, "minlength"],
      ["list", "suggestions", "list"],
      ["multiple", true, "multiple"],
      ["step", 7, "step"],
    ])("drops %s, which would check or shape the shown text", (prop, given, attribute) => {
      render(<DatePicker label="Start date" today={today} {...untyped({ [prop]: given })} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute(attribute);
    });

    it("never puts min and max on the visible input", () => {
      render(<DatePicker label="Start date" min="2026-01-01" max="2026-12-31" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(getInput()).not.toHaveAttribute("min");
      expect(getInput()).not.toHaveAttribute("max");
    });

    it("drops render, so the input stays the field's own", () => {
      render(<DatePicker label="Start date" today={today} {...untyped({ render: <textarea data-testid="swapped" /> })} />);
      expect(getInput().tagName).toBe("INPUT");
      expect(screen.queryByTestId("swapped")).toBeNull();
    });

    it("drops children", () => {
      render(<DatePicker label="Start date" today={today} {...untyped({ children: <span data-testid="child" /> })} />);
      expect(getInput()).toBeInTheDocument();
      expect(screen.queryByTestId("child")).toBeNull();
    });
  });

  describe("isDateValue", () => {
    it.each(["2026-11-12", "2028-02-29", "0026-03-04"])("is true for %s, a day that exists", (value) => {
      expect(isDateValue(value)).toBe(true);
    });

    it.each(["", "2026-11-31", "2026-02-29", "2026-13-01", "2026-1-5", "Nov 12, 2026", "next Tuesday"])(
      "is false for %j",
      (value) => {
        expect(isDateValue(value)).toBe(false);
      },
    );

    it("agrees with the field: every value it calls a date is one the field reads and shows as a date", () => {
      const onValueChange = vi.fn();
      render(<DatePicker label="Start date" onValueChange={onValueChange} today={today} />);
      for (const text of ["11/12/2026", "2026-11-31", "next Tuesday", "Nov 12, 2026", ""]) {
        setText(text);
        const [value, details] = lastCall(onValueChange) ?? ["", { isDate: false }];
        expect(isDateValue(value)).toBe(details.isDate);
      }
    });

    it("is exported from the package, next to the component", () => {
      expect(designSystem.isDateValue).toBe(isDateValue);
      expect(designSystem.DatePicker).toBe(DatePicker);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<DatePickerProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<DatePickerProps>();
      expectTypeOf<object>().not.toExtend<DatePickerProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<DatePickerProps>();
      expectTypeOf<{ label: null }>().not.toExtend<DatePickerProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<DatePickerProps>();
    });

    it("takes and reports strings", () => {
      expectTypeOf<DatePickerProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<DatePickerProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<DatePickerProps["min"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<DatePickerProps["max"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<DatePickerProps["today"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NonNullable<DatePickerProps["onValueChange"]>>().parameter(0).toEqualTypeOf<string>();
      expectTypeOf<NonNullable<DatePickerProps["onValueChange"]>>().parameter(1).toEqualTypeOf<DatePickerChangeDetails>();
      expectTypeOf<DatePickerChangeDetails>().toEqualTypeOf<{ reason: "type" | "pick"; text: string; isDate: boolean }>();
      expectTypeOf(isDateValue).toEqualTypeOf<(value: string) => boolean>();
      expectTypeOf<NonNullable<DatePickerProps["isDateUnavailable"]>>().parameter(0).toEqualTypeOf<string>();
    });

    it("only accepts the two sizes, and a date-fns locale", () => {
      expectTypeOf<DatePickerProps["size"]>().toEqualTypeOf<DatePickerSize | undefined>();
      expectTypeOf<DatePickerSize>().toEqualTypeOf<"md" | "lg">();
      expectTypeOf(enGB).toExtend<DateLocale>();
      expectTypeOf<DatePickerProps["locale"]>().toEqualTypeOf<DateLocale | undefined>();
    });

    it("leaves out the input attributes that would break a date field", () => {
      expectTypeOf<DatePickerProps>().not.toHaveProperty("type");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("inputMode");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("pattern");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("maxLength");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("minLength");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("list");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("multiple");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("step");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("children");
      expectTypeOf<DatePickerProps>().not.toHaveProperty("render");
    });

    it("types className as a string and the ref as the visible input", () => {
      expectTypeOf<DatePickerProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<DatePickerProps["ref"]>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<DatePicker label="" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] DatePicker: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("warns when min is after max", () => {
      render(<DatePicker label="Start date" min="2026-12-01" max="2026-11-01" today={today} />);
      expect(getInput()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        '[design-system] DatePicker: min ("2026-12-01") is after max ("2026-11-01"), so no day can be picked. Swap them.',
      ]);
    });

    it.each(["min", "max", "today"] as const)("warns when %s isn't a yyyy-mm-dd date", (prop) => {
      render(<DatePicker label="Start date" today={today} {...{ [prop]: "12/11/2026" }} />);
      expect(getInput()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        `[design-system] DatePicker: ${prop} ("12/11/2026") isn't a date in yyyy-mm-dd form, such as "2026-11-12", so it's ignored.`,
      ]);
    });

    it("doesn't warn about a value or defaultValue that isn't a date, which is valid text", () => {
      render(<DatePicker label="Start date" defaultValue="soon" today={today} />);
      expect(getInput()).toHaveValue("soon");
    });
  });
});
