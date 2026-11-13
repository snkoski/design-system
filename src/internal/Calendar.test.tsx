import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { enGB } from "date-fns/locale";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Calendar, openingMonth } from "@/internal/Calendar";
import type { CalendarProps } from "@/internal/Calendar";

const base: CalendarProps = {
  value: "2026-11-12",
  onPick: () => {},
  month: "2026-11-01",
  onMonthChange: () => {},
  today: "2026-11-13",
};

const day = (name: RegExp | string) => screen.getByRole("button", { name });
const cell = (date: string) => document.querySelector<HTMLElement>(`[data-day="${date}"]`)!;
const getGrid = () => screen.getByRole("grid");

/** A calendar whose month moves, as DatePicker's does. */
function Controlled(props: Partial<CalendarProps>) {
  const [month, setMonth] = useState(props.month ?? base.month);
  return <Calendar {...base} {...props} month={month} onMonthChange={setMonth} />;
}

describe("Calendar", () => {
  describe("rendering", () => {
    it("renders a grid named by its month and year, with the month in a polite live region", () => {
      render(<Calendar {...base} />);
      expect(getGrid()).toHaveAccessibleName("November 2026");
      const caption = screen.getByRole("status");
      expect(caption).toHaveTextContent("November 2026");
      expect(caption).toHaveAttribute("aria-live", "polite");
      expect(caption).toHaveClass("calendar__caption");
    });

    it("uses only our own classes, never DayPicker's", () => {
      const { container } = render(<Calendar {...base} min="2026-11-03" />);
      expect(getGrid()).toBeInTheDocument();
      expect(container.firstElementChild).toHaveClass("calendar");
      expect(getGrid()).toHaveClass("calendar__grid");
      expect(cell("2026-11-12")).toHaveClass("calendar__day");
      expect(day(/November 12,/)).toHaveClass("calendar__day-button");
      expect(container.innerHTML).not.toMatch(/rdp-/);
    });

    it("names the month buttons in English sentence case and draws them as inset buttons, with no nav landmark", () => {
      const { container } = render(<Calendar {...base} />);
      for (const name of ["Previous month", "Next month"]) {
        const button = screen.getByRole("button", { name });
        expect(button).toHaveClass("inset-button", "calendar__nav-button");
        const icon = button.querySelector("svg");
        expect(icon).toHaveClass("inset-button__icon", "calendar__chevron");
        expect(icon).toHaveAttribute("aria-hidden", "true");
      }
      expect(container.querySelector("nav")).toBeNull();
    });

    it("puts Previous month, the caption, and Next month in that order", () => {
      render(<Calendar {...base} />);
      const parts = [screen.getByRole("button", { name: "Previous month" }), screen.getByRole("status"), screen.getByRole("button", { name: "Next month" })];
      for (let i = 1; i < parts.length; i++) {
        expect(parts[i - 1]!.compareDocumentPosition(parts[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it("drops any translated labels a locale brings, so its own words stay English", () => {
      const translated = { ...enGB, labels: { labelNext: () => "Następny miesiąc", labelPrevious: () => "Poprzedni miesiąc" } };
      render(<Calendar {...base} locale={translated} />);
      expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Następny miesiąc" })).toBeNull();
    });

    it("starts weeks on the locale's first day", () => {
      const { rerender } = render(<Calendar {...base} />);
      const firstWeekday = () => getGrid().querySelector("th")!.getAttribute("aria-label");
      expect(firstWeekday()).toBe("Sunday");
      rerender(<Calendar {...base} locale={enGB} />);
      expect(firstWeekday()).toBe("Monday");
    });
  });

  describe("days", () => {
    it("marks today, named as today", () => {
      render(<Calendar {...base} />);
      expect(cell("2026-11-13")).toHaveAttribute("data-today");
      expect(day(/November 13,/)).toHaveAccessibleName(/^Today, /);
      expect(cell("2026-11-12")).not.toHaveAttribute("data-today");
    });

    it("names each day with the number it shows as a word, so its name contains its label (WCAG 2.5.3)", () => {
      render(<Calendar {...base} />);
      const days = [...getGrid().querySelectorAll("button")];
      expect(days).toHaveLength(30);
      for (const button of days) {
        const words = (button.getAttribute("aria-label") ?? "").split(/[\s,]+/);
        expect(words).toContain(button.textContent);
      }
      expect(day(/November 1,/)).toHaveAccessibleName("Sunday, November 1, 2026");
    });

    it("marks the chosen day selected", () => {
      render(<Calendar {...base} />);
      expect(cell("2026-11-12")).toHaveAttribute("aria-selected", "true");
      expect(day(/November 12,/)).toHaveAccessibleName(/selected$/);
      expect(cell("2026-11-11")).not.toHaveAttribute("aria-selected", "true");
    });

    it("chooses nothing when the value isn't a date", () => {
      render(<Calendar {...base} value="next Tuesday" />);
      expect(getGrid()).toBeInTheDocument();
      expect(document.querySelector('[aria-selected="true"]')).toBeNull();
    });

    it("can't pick days before min, after max, or that isDateUnavailable rules out", () => {
      const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00`).getDay());
      render(<Calendar {...base} min="2026-11-03" max="2026-11-25" isDateUnavailable={weekend} />);
      expect(day(/November 2,/)).toBeDisabled();
      expect(cell("2026-11-02")).toHaveAttribute("data-disabled");
      expect(day(/November 26,/)).toBeDisabled();
      expect(day(/November 14,/)).toBeDisabled(); // a Saturday
      expect(day(/November 4,/)).toBeEnabled();
    });

    it("has exactly one day in the Tab order: the chosen one", () => {
      render(<Calendar {...base} />);
      const stops = [...getGrid().querySelectorAll("button")].filter((b) => b.tabIndex === 0);
      expect(stops).toEqual([day(/November 12,/)]);
    });

    it("focuses the Tab-stop day with autoFocus", () => {
      render(<Calendar {...base} autoFocus />);
      expect(day(/November 12,/)).toHaveFocus();
    });
  });

  describe("picking", () => {
    it("calls onPick with the day's yyyy-mm-dd date", async () => {
      const onPick = vi.fn();
      const user = userEvent.setup();
      render(<Calendar {...base} onPick={onPick} />);
      await user.click(day(/November 20,/));
      expect(onPick).toHaveBeenCalledWith("2026-11-20");
    });

    it("calls onPick again for the chosen day, and keeps it chosen", async () => {
      const onPick = vi.fn();
      const user = userEvent.setup();
      render(<Calendar {...base} onPick={onPick} />);
      await user.click(day(/November 12,/));
      expect(onPick).toHaveBeenCalledWith("2026-11-12");
      expect(cell("2026-11-12")).toHaveAttribute("aria-selected", "true");
    });

    it("picks with Enter from the keyboard", async () => {
      const onPick = vi.fn();
      const user = userEvent.setup();
      render(<Calendar {...base} onPick={onPick} autoFocus />);
      await user.keyboard("{ArrowRight}{Enter}");
      expect(onPick).toHaveBeenCalledWith("2026-11-13");
    });
  });

  describe("months", () => {
    it("calls onMonthChange with the first of the next month", async () => {
      const onMonthChange = vi.fn();
      const user = userEvent.setup();
      render(<Calendar {...base} onMonthChange={onMonthChange} />);
      await user.click(screen.getByRole("button", { name: "Next month" }));
      expect(onMonthChange).toHaveBeenCalledWith("2026-12-01");
    });

    it("shows the month it's given", () => {
      render(<Calendar {...base} month="2027-02-01" />);
      expect(getGrid()).toHaveAccessibleName("February 2027");
    });

    it("marks Previous month unavailable at min's month and Next month at max's, without the disabled attribute", () => {
      render(<Calendar {...base} min="2026-11-03" max="2026-11-25" />);
      for (const name of ["Previous month", "Next month"]) {
        const button = screen.getByRole("button", { name });
        expect(button).toHaveAttribute("aria-disabled", "true");
        expect(button).toHaveAttribute("tabindex", "-1");
      }
    });

    it("leaves the month buttons available inside the range", () => {
      render(<Calendar {...base} min="2026-01-01" max="2027-12-31" />);
      for (const name of ["Previous month", "Next month"]) {
        expect(screen.getByRole("button", { name })).not.toHaveAttribute("aria-disabled", "true");
      }
    });

    it("moves a month with Page Down", async () => {
      const user = userEvent.setup();
      render(<Controlled autoFocus />);
      await user.keyboard("{PageDown}");
      expect(getGrid()).toHaveAccessibleName("December 2026");
      expect(day(/December 12,/)).toHaveFocus();
    });
  });

  describe("right to left", () => {
    it("swaps Left and Right", async () => {
      const user = userEvent.setup();
      render(<Calendar {...base} dir="rtl" autoFocus />);
      await user.keyboard("{ArrowRight}");
      expect(day(/November 11,/)).toHaveFocus();
    });

    it("points the chevrons the other way", () => {
      const { rerender } = render(<Calendar {...base} />);
      const previousPath = () => screen.getByRole("button", { name: "Previous month" }).querySelector("path")?.getAttribute("d");
      expect(previousPath()).toBe("m15 18-6-6 6-6");
      rerender(<Calendar {...base} dir="rtl" />);
      expect(previousPath()).toBe("m9 18 6-6-6-6");
    });
  });
});

describe("openingMonth", () => {
  it("opens on the value's month when it's a real date", () => {
    expect(openingMonth({ value: "2027-03-09", today: "2026-11-13" })).toBe("2027-03-01");
  });

  it("opens on today's month when the value is empty or isn't a date", () => {
    expect(openingMonth({ value: "", today: "2026-11-13" })).toBe("2026-11-01");
    expect(openingMonth({ value: "next Tuesday", today: "2026-11-13" })).toBe("2026-11-01");
    expect(openingMonth({ value: "2026-02-30", today: "2026-11-13" })).toBe("2026-11-01");
  });

  it("moves the month into the range from min's month to max's", () => {
    expect(openingMonth({ value: "2026-01-15", today: "2026-11-13", min: "2026-06-10" })).toBe("2026-06-01");
    expect(openingMonth({ value: "2028-01-15", today: "2026-11-13", max: "2027-02-10" })).toBe("2027-02-01");
    expect(openingMonth({ value: "", today: "2026-11-13", min: "2027-01-05", max: "2027-12-31" })).toBe("2027-01-01");
  });
});
