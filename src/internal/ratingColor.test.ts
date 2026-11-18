import { afterEach, describe, expect, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { ratingColor } from "@/internal/ratingColor";

/** A browser's CSS.supports, where only "not-a-color" isn't a color */
const stubSupports = () =>
  vi.stubGlobal("CSS", { supports: (property: string, value: string) => property === "color" && value !== "not-a-color" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ratingColor", () => {
  it("is gold with no color, and sets no inline color", () => {
    expect(ratingColor("Rating", undefined)).toEqual({ "data-color": "gold", style: undefined });
  });

  it.each([
    ["gold", "gold"],
    ["brand", "brand"],
    ["Gold", "gold"],
    ["BRAND", "brand"],
    [" brand ", "brand"],
  ] as const)("treats %j as the keyword %s", (color, keyword) => {
    expect(ratingColor("Rating", color)).toEqual({ "data-color": keyword, style: undefined });
  });

  it.each(["", "   "])("treats %j as no color: gold", (color) => {
    expect(ratingColor("Rating", color)).toEqual({ "data-color": "gold", style: undefined });
  });

  it("passes any other color inline, trimmed", () => {
    expect(ratingColor("Rating", " hsl(210 80% 46%) ")).toEqual({
      "data-color": "custom",
      style: { "--rating-color": "hsl(210 80% 46%)" },
    });
  });

  it("passes a var() inline as given", () => {
    expect(ratingColor("RatingSlider", "var(--my-star)")).toEqual({
      "data-color": "custom",
      style: { "--rating-color": "var(--my-star)" },
    });
  });

  it("warns when the browser can't read the color, naming the component", () => {
    stubSupports();
    expect(ratingColor("RatingSlider", " not-a-color ")["data-color"]).toBe("custom");
    expect(takeWarnings()).toEqual([
      '[design-system] RatingSlider: color must be "gold", "brand", or a CSS color, like "hsl(210 80% 46%)". Got "not-a-color".',
    ]);
  });

  it.each(["inherit", "initial", "unset", "revert", "revert-layer", "Inherit"])(
    "warns for the CSS-wide keyword %j, which isn't a color",
    (color) => {
      stubSupports();
      ratingColor("Rating", color);
      expect(takeWarnings()).toEqual([
        `[design-system] Rating: color must be "gold", "brand", or a CSS color, like "hsl(210 80% 46%)". Got "${color}".`,
      ]);
    },
  );

  it.each(["transparent", " Transparent "])("warns that %j hides the filled stars", (color) => {
    stubSupports();
    expect(ratingColor("Rating", color)).toEqual({ "data-color": "custom", style: { "--rating-color": color.trim() } });
    expect(takeWarnings()).toEqual([
      `[design-system] Rating: color "${color.trim()}" hides the filled stars. Use "gold", "brand", or a color that reaches 3:1 against the page.`,
    ]);
  });

  it("doesn't warn for a color the browser reads", () => {
    stubSupports();
    expect(ratingColor("Rating", "hsl(210 80% 46%)")).toEqual({
      "data-color": "custom",
      style: { "--rating-color": "hsl(210 80% 46%)" },
    });
    expect(takeWarnings()).toEqual([]);
  });

  it("doesn't warn for a keyword, without asking the browser", () => {
    const supports = vi.fn(() => false);
    vi.stubGlobal("CSS", { supports });
    expect(ratingColor("Rating", "brand")["data-color"]).toBe("brand");
    expect(supports).not.toHaveBeenCalled();
    expect(takeWarnings()).toEqual([]);
  });

  it("doesn't warn where there's no CSS.supports, as on the server", () => {
    vi.stubGlobal("CSS", undefined);
    expect(ratingColor("Rating", "not-a-color")).toEqual({
      "data-color": "custom",
      style: { "--rating-color": "not-a-color" },
    });
    expect(takeWarnings()).toEqual([]);
  });
});
