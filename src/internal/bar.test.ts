import { describe, expect, it } from "vitest";
import { barPercent, percentText } from "./bar";

describe("barPercent", () => {
  it("gives how far the value is between min and max, from 0 to 100", () => {
    expect(barPercent(60, 0, 100)).toBe(60);
    expect(barPercent(12, 0, 20)).toBe(60);
    expect(barPercent(15, 10, 20)).toBe(50);
    expect(barPercent(0, 0, 100)).toBe(0);
    expect(barPercent(100, 0, 100)).toBe(100);
  });

  it("clamps a value outside the range to its ends, as Base UI does", () => {
    expect(barPercent(25, 0, 20)).toBe(100);
    expect(barPercent(-5, 0, 20)).toBe(0);
    expect(barPercent(Infinity, 0, 20)).toBe(100);
    expect(barPercent(-Infinity, 0, 20)).toBe(0);
  });

  it("treats a value that isn't a number as the minimum", () => {
    expect(barPercent(Number.NaN, 0, 20)).toBe(0);
  });

  it("gives 0 when the range is empty or backwards", () => {
    expect(barPercent(5, 10, 10)).toBe(0);
    expect(barPercent(5, 20, 10)).toBe(0);
  });
});

describe("percentText", () => {
  it("writes a whole percent", () => {
    expect(percentText(60)).toBe("60%");
    expect(percentText(0)).toBe("0%");
    expect(percentText(100)).toBe("100%");
  });

  it("rounds to a whole number", () => {
    expect(percentText(33.333)).toBe("33%");
    expect(percentText(66.666)).toBe("67%");
  });

  it("says 0% and 100% only at the ends, so the words never claim an empty or full bar that isn't", () => {
    expect(percentText(0.4)).toBe("1%");
    expect(percentText(99.6)).toBe("99%");
    expect(percentText(99.4)).toBe("99%");
    expect(percentText(0)).toBe("0%");
    expect(percentText(100)).toBe("100%");
  });

  it("writes it in English whatever the reader's language, so the server and the browser agree", () => {
    // fr-FR would write "60 %" with a narrow no-break space, and de-DE "60 %"
    expect(percentText(60)).not.toMatch(/\s/);
    expect(percentText(60)).toBe(new Intl.NumberFormat("en-US", { style: "percent" }).format(0.6));
  });
});
