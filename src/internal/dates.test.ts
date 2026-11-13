import { arSA, de, enGB, enUS, ja, pt, sr } from "date-fns/locale";
import { describe, expect, it } from "vitest";
import { formatShown, isRealDate, monthOf, readDate, readValue, shownPattern, textOf, toDate, toIso } from "@/internal/dates";

describe("dates", () => {
  describe("isRealDate", () => {
    it("is true only for yyyy-mm-dd dates that exist", () => {
      expect(isRealDate("2026-11-12")).toBe(true);
      expect(isRealDate("2028-02-29")).toBe(true);
      expect(isRealDate("0026-03-04")).toBe(true); // a year below 100 isn't read as 19xx
      for (const text of ["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-5", "12/11/2026", "", undefined]) {
        expect(isRealDate(text)).toBe(false);
      }
    });
  });

  describe("toDate and toIso", () => {
    it("treat a date as local midnight, so it never shifts a day in a zone far from UTC", () => {
      const date = toDate("2026-11-12");
      expect(date.getDate()).toBe(12);
      expect(date.getHours()).toBe(0);
      expect(toIso(date)).toBe("2026-11-12");
    });

    it("keep years below 100 as they are", () => {
      expect(toIso(toDate("0026-03-04"))).toBe("0026-03-04");
    });

    it("give the first of the month", () => {
      expect(monthOf("2026-11-12")).toBe("2026-11-01");
    });
  });

  describe("the shown pattern", () => {
    it("is the locale's medium date with a four-digit year", () => {
      expect(formatShown("2026-11-12", enUS)).toBe("Nov 12, 2026");
      expect(formatShown("2026-11-12", enGB)).toBe("12 Nov 2026");
      expect(formatShown("2026-11-12", pt)).toBe("12 de nov de 2026");
      expect(shownPattern(sr)).not.toMatch(/(^|[^y])yy?([^y]|$)/);
    });

    it("falls back to the short pattern where date-fns can't read its own medium one back", () => {
      // Saudi Arabic's medium pattern names the month, which date-fns can't read back, so the field shows numbers
      expect(arSA.formatLong!.date({ width: "medium" })).toMatch(/MMM/);
      expect(shownPattern(arSA)).not.toMatch(/MMM/);
      expect(readDate(formatShown("2026-11-12", arSA), arSA)).toBe("2026-11-12");
    });
  });

  describe("readDate", () => {
    it.each([
      ["Nov 12, 2026", enUS],
      ["2026-11-12", enUS],
      ["2026/11/12", de],
      ["11/12/2026", enUS],
      ["12/11/2026", enGB],
      ["12.11.2026", de],
      ["2026/11/12", ja],
      ["12th November 2026", enUS],
      ["12-Nov-2026", enUS],
    ] as const)("reads %s", (text, locale) => {
      expect(readDate(text, locale)).toBe("2026-11-12");
    });

    it.each(["11/12/26", "Feb 30, 2026", "next Tuesday", "2026-11/12", "12345", "Nov 12, 20266"])("doesn't read %s", (text) => {
      expect(readDate(text, enUS)).toBeNull();
    });
  });

  describe("readValue and textOf", () => {
    it("give a date for text that reads as one, and the text, trimmed, otherwise", () => {
      expect(readValue(" Nov 12, 2026 ")).toBe("2026-11-12");
      expect(readValue("  next   Tuesday ")).toBe("next Tuesday");
      expect(readValue("   ")).toBe("");
    });

    it("show a date in the shown pattern and anything else as it is", () => {
      expect(textOf("2026-11-12")).toBe("Nov 12, 2026");
      expect(textOf("soon")).toBe("soon");
      expect(textOf("")).toBe("");
    });
  });
});
