import type { CSSProperties } from "react";
import { warn } from "@/internal/warn";

/** The color of a rating's filled stars: `"gold"` (the default), `"brand"`, or any CSS color. */
export type RatingColor = "gold" | "brand" | (string & {});

/** Values every CSS property accepts, which on a custom property reset or inherit it rather than color anything */
const cssWideKeywords = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);

/**
 * Turns Rating's and RatingSlider's `color` prop into what their wrapper renders. A keyword, matched ignoring case and
 * spaces, becomes `data-color`, and the component's CSS sets the matching token (`--rating-gold`, the default, or
 * `--rating-brand`). Any other value is set inline as `--rating-color`, used as given in every theme. A value the
 * browser can't use as a color warns in development, as does `transparent`, which hides the stars; on the server,
 * which can't tell what the browser reads, only the CSS-wide keywords and `transparent` do.
 * Internal: only the type is exported from the package.
 */
export function ratingColor(
  component: "Rating" | "RatingSlider",
  color: string | undefined,
): { "data-color": "gold" | "brand" | "custom"; style: CSSProperties | undefined } {
  const trimmed = color?.trim() ?? "";
  const keyword = trimmed.toLowerCase();
  if (keyword === "" || keyword === "gold") return { "data-color": "gold", style: undefined };
  if (keyword === "brand") return { "data-color": "brand", style: undefined };

  if (keyword === "transparent") {
    warn(component, `color "${trimmed}" hides the filled stars. Use "gold", "brand", or a color that reaches 3:1 against the page.`);
    return { "data-color": "custom", style: { "--rating-color": trimmed } as CSSProperties };
  }
  const unreadable =
    cssWideKeywords.has(keyword) ||
    (typeof CSS !== "undefined" && typeof CSS?.supports === "function" && !CSS.supports("color", trimmed));
  if (unreadable) {
    warn(component, `color must be "gold", "brand", or a CSS color, like "hsl(210 80% 46%)". Got "${trimmed}".`);
  }
  return { "data-color": "custom", style: { "--rating-color": trimmed } as CSSProperties };
}
