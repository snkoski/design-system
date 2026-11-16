import { DayPicker } from "@daypicker/react";
import type { ChevronProps, ClassNames, Matcher, Modifiers } from "@daypicker/react";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { isRealDate, monthOf, toDate, toIso } from "@/internal/dates";

/** The calendar inside DatePicker's popup: DayPicker with our classes, labels, and chevrons. Internal: not exported. */
export interface CalendarProps {
  /** The chosen date, `yyyy-mm-dd`, or `""` (or any text that isn't a date) for none. */
  value: string;
  /** Called with the `yyyy-mm-dd` date of every day activated, the chosen one included. */
  onPick: (date: string) => void;
  /** The month shown, as the `yyyy-mm-dd` date of its first day. */
  month: string;
  /** Called with the new month (`yyyy-mm-01`) when the person moves to another. */
  onMonthChange: (month: string) => void;
  /** Days before this `yyyy-mm-dd` date can't be picked, and Previous month stops at its month. */
  min?: string;
  /** Days after this `yyyy-mm-dd` date can't be picked, and Next month stops at its month. */
  max?: string;
  /** The day marked as today, `yyyy-mm-dd`. */
  today: string;
  /** More days that can't be picked. */
  isDateUnavailable?: (date: string) => boolean;
  /** Month and weekday names, and the first day of the week. Default: en-US. */
  locale?: Locale;
  /** Text direction; `rtl` swaps Left and Right and the chevrons. */
  dir?: "ltr" | "rtl";
  /** Focus the grid's Tab stop when it first renders. */
  autoFocus?: boolean;
}

/**
 * Every DayPicker part gets one of our classes, so no `rdp-` class ever ships. The states (today, chosen, can't be
 * picked, focused) are styled from DayPicker's `data-today`, `aria-selected`, and `data-disabled`, and `:focus-visible`,
 * so their keys map to nothing.
 */
const classNames: ClassNames = {
  root: "calendar",
  chevron: "inset-button__icon calendar__chevron",
  day: "calendar__day",
  day_button: "calendar__day-button",
  caption_label: "calendar__caption",
  dropdowns: "calendar__dropdowns",
  dropdown: "calendar__dropdown",
  dropdown_root: "calendar__dropdown-root",
  footer: "calendar__footer",
  month_grid: "calendar__grid",
  month_caption: "calendar__caption-row",
  months_dropdown: "calendar__months-dropdown",
  month: "calendar__month",
  months: "calendar__months",
  nav: "calendar__nav",
  button_next: "inset-button calendar__nav-button",
  button_previous: "inset-button calendar__nav-button",
  week: "calendar__week",
  weeks: "calendar__weeks",
  weekday: "calendar__weekday",
  weekdays: "calendar__weekdays",
  week_number: "calendar__week-number",
  week_number_header: "calendar__week-number-header",
  years_dropdown: "calendar__years-dropdown",
  disabled: "",
  hidden: "",
  outside: "",
  focused: "",
  today: "",
  range_end: "",
  range_middle: "",
  range_start: "",
  selected: "",
  weeks_before_enter: "",
  weeks_before_exit: "",
  weeks_after_enter: "",
  weeks_after_exit: "",
  caption_after_enter: "",
  caption_after_exit: "",
  caption_before_enter: "",
  caption_before_exit: "",
};

/**
 * A day's name: its full date in the locale's long form, with "Today, " and ", selected" around it, as DayPicker's own,
 * but with the day as a plain number. DayPicker's English name says "November 1st", which doesn't contain the "1" the
 * button shows, so it fails WCAG 2.5.3 (Label in Name; axe's label-content-name-mismatch).
 */
function labelDayButton(locale: Locale | undefined) {
  return (date: Date, modifiers: Modifiers) => {
    let label = format(date, "PPPP", { locale }).replace(/(\d+)(st|nd|rd|th)\b/, "$1");
    if (modifiers.today) label = `Today, ${label}`;
    if (modifiers.selected) label = `${label}, selected`;
    return label;
  };
}

/** Lucide's chevron-left and chevron-right. DayPicker passes the orientation, already swapped for right to left. */
function Chevron({ className, orientation }: ChevronProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={orientation === "right" ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
    </svg>
  );
}

/** The locale without any translated `labels` a DayPicker locale carries, so the calendar's own words stay English. */
function withoutLabels(locale: Locale | undefined): Locale | undefined {
  if (!locale || !("labels" in locale)) return locale;
  const { labels: _translated, ...rest } = locale as Locale & { labels?: unknown };
  return rest;
}

/** A month calendar for one date. Internal: DatePicker renders it in its popup. */
export function Calendar({
  value,
  onPick,
  month,
  onMonthChange,
  min,
  max,
  today,
  isDateUnavailable,
  locale,
  dir,
  autoFocus,
}: CalendarProps) {
  const unavailable: Matcher[] = [];
  if (min) unavailable.push({ before: toDate(min) });
  if (max) unavailable.push({ after: toDate(max) });
  if (isDateUnavailable) unavailable.push((date: Date) => isDateUnavailable(toIso(date)));
  return (
    <DayPicker
      mode="single"
      // Picking the chosen day again keeps it (without `required`, DayPicker would clear it) and still reports it
      required
      selected={isRealDate(value) ? toDate(value) : undefined}
      onSelect={(date) => onPick(toIso(date))}
      month={toDate(month)}
      onMonthChange={(shown) => onMonthChange(monthOf(toIso(shown)))}
      startMonth={min ? toDate(min) : undefined}
      endMonth={max ? toDate(max) : undefined}
      today={toDate(today)}
      disabled={unavailable}
      locale={withoutLabels(locale)}
      dir={dir}
      navLayout="around"
      animate={false}
      autoFocus={autoFocus}
      classNames={classNames}
      labels={{
        // The system's own words, in English and sentence case (DayPicker's say "Go to the Previous Month")
        labelPrevious: () => "Previous month",
        labelNext: () => "Next month",
        labelDayButton: labelDayButton(locale),
      }}
      components={{ Chevron }}
    />
  );
}

/**
 * The month the calendar opens on, as `yyyy-mm-01`: the value's month if it's a real date, else today's, moved into
 * the range from `min`'s month to `max`'s month.
 */
export function openingMonth({ value, today, min, max }: { value: string; today: string; min?: string; max?: string }): string {
  let month = monthOf(isRealDate(value) ? value : today);
  if (min && month < monthOf(min)) month = monthOf(min);
  if (max && month > monthOf(max)) month = monthOf(max);
  return month;
}
