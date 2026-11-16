import { format, isValid, parse } from "date-fns";
import type { Locale } from "date-fns";
import { enUS } from "date-fns/locale";

/*
 * Date-only strings for DatePicker and its calendar. A date is a `yyyy-mm-dd` string, and becomes a `Date` only as
 * local midnight (`new Date(year, month - 1, day)`), never with `new Date("2026-11-12")`, which reads it as UTC and
 * shows the 11th west of Greenwich. Internal: not exported from the package.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether the text is a `yyyy-mm-dd` date that exists ("2026-02-30" doesn't). */
export function isRealDate(text: string | undefined): text is string {
  const match = text ? ISO.exec(text) : null;
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  date.setFullYear(year); // years 0 to 99 would otherwise mean 1900 to 1999
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** A `yyyy-mm-dd` date as local midnight. Only call it with a real date. */
export function toDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  date.setFullYear(year); // years 0 to 99 would otherwise mean 1900 to 1999
  return date;
}

/** A `Date`'s local day as `yyyy-mm-dd`. */
export function toIso(date: Date): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The first of a `yyyy-mm-dd` date's month, as `yyyy-mm-01`. */
export function monthOf(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Today in the browser's time zone, as `yyyy-mm-dd`. */
export function todayIso(): string {
  return toIso(new Date());
}

/** A locale's pattern with every run of `y` outside quoted literals made `yyyy`, so the year always shows in full. */
function fourDigitYear(pattern: string): string {
  return pattern
    .split("'")
    .map((part, i) => (i % 2 === 0 ? part.replace(/y+/g, "yyyy") : part))
    .join("'");
}

/** Reads text with one date-fns pattern, or gives null. The date must exist ("Feb 30" doesn't roll into March). */
function tryPattern(text: string, pattern: string, locale: Locale): string | null {
  const date = parse(text, pattern, new Date(2000, 0, 1), { locale });
  return isValid(date) ? toIso(date) : null;
}

const shownPatterns = new WeakMap<Locale, string>();

/**
 * The pattern a field shows dates in for a locale: the locale's medium pattern ("Nov 12, 2026"), with a four-digit
 * year. In the few locales where date-fns can't read its own medium pattern back (it can't read some month
 * abbreviations), the short one ("12.11.2026"), which reads back in every locale. Worked out once per locale.
 */
export function shownPattern(locale: Locale = enUS): string {
  const known = shownPatterns.get(locale);
  if (known) return known;
  const medium = fourDigitYear(locale.formatLong!.date({ width: "medium" }));
  const sample = new Date(2026, 10, 12);
  const readsBack = tryPattern(format(sample, medium, { locale }), medium, locale) === "2026-11-12";
  const pattern = readsBack ? medium : fourDigitYear(locale.formatLong!.date({ width: "short" }));
  shownPatterns.set(locale, pattern);
  return pattern;
}

/** A `yyyy-mm-dd` date in the shown pattern. */
export function formatShown(iso: string, locale: Locale = enUS): string {
  return format(toDate(iso), shownPattern(locale), { locale });
}

/** The order of day, month, and year in the locale's short pattern ("dmy" for en-GB, "mdy" for en-US). */
function numberOrder(locale: Locale): string {
  const short = locale.formatLong!.date({ width: "short" }).replace(/'[^']*'/g, "");
  const order = [...short].filter((ch) => "dMy".includes(ch));
  return [...new Set(order)].join("").toLowerCase();
}

/** Trims the text and makes every run of whitespace (tabs and non-breaking spaces too) one space. */
export function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Reads typed text as a date, or gives null. The rules, in order (the first that gives a real date wins):
 * 0. the shown pattern itself; 1. year first: four digits, then month and day, with one separator throughout
 * (- / . or a space); 2. numbers in the locale's order, with one separator throughout; 3. a month name with the day
 * (or an ordinal) and the year, in any of three orders. The year must be exactly four digits in the text.
 */
export function readDate(rawText: string, locale: Locale = enUS): string | null {
  const text = normalize(rawText);
  const digitRuns = text.match(/\d+/g) ?? [];
  if (!digitRuns.some((run) => run.length === 4) || digitRuns.some((run) => run.length > 4)) return null;

  // 0. The shown pattern
  const shown = tryPattern(text, shownPattern(locale), locale);
  if (shown) return shown;

  // 1. Year first
  const yearFirst = /^(\d{4})([-/. ])(\d{1,2})\2(\d{1,2})$/.exec(text);
  if (yearFirst) {
    const iso = `${yearFirst[1]}-${yearFirst[3]!.padStart(2, "0")}-${yearFirst[4]!.padStart(2, "0")}`;
    return isRealDate(iso) ? iso : null;
  }

  // 2. Numbers in the locale's order
  const numbers = /^(\d{1,4})([-/. ])(\d{1,4})\2(\d{1,4})$/.exec(text);
  if (numbers) {
    const parts = [numbers[1]!, numbers[3]!, numbers[4]!];
    const order = numberOrder(locale);
    const at = (letter: string) => parts[order.indexOf(letter)] ?? "";
    const [day, month, year] = [at("d"), at("m"), at("y")];
    if (year.length !== 4 || day.length > 2 || month.length > 2) return null;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    return isRealDate(iso) ? iso : null;
  }

  // 3. A month name. Commas go, dashes and slashes between parts become spaces, and a dot after a word is optional.
  const spaced = normalize(text.replace(/,/g, " ").replace(/[-/]/g, " "));
  const candidates = [...new Set([spaced, spaced.replace(/(\p{L})\./gu, "$1")])];
  for (const candidate of candidates) {
    for (const month of ["MMMM", "MMM", "LLLL", "LLL"]) {
      for (const day of ["d", "do"]) {
        for (const pattern of [`${day} ${month} yyyy`, `${month} ${day} yyyy`, `yyyy ${month} ${day}`]) {
          const iso = tryPattern(candidate, pattern, locale);
          if (iso) return iso;
        }
      }
    }
  }
  return null;
}

/** The value typed text gives: its `yyyy-mm-dd` date if it reads as one, else the text, normalized. */
export function readValue(text: string, locale?: Locale): string {
  return readDate(text, locale) ?? normalize(text);
}

/** The text a value shows as: a real date in the shown pattern, anything else as it is. */
export function textOf(value: string, locale?: Locale): string {
  return isRealDate(value) ? formatShown(value, locale) : value;
}
