# Introduction

Sherbet is bright, a little weird, and carefully made. Its pages use sherbet pastels (tangerine, peach, mint) around components drawn in black, white, and gray, so it can be playful without looking unserious. It is built to be reused: components only ever read neutral semantic tokens, so another site or brand can use them as they are and bring its own colors to the layout.

## Principles

1. **Playful in the details, serious in the structure.** Personality lives in the layout's color, headlines, copy, and hot dog mode. Components, forms, and navigation stay neutral and predictable.
2. **One loud thing per screen.** Use `brand` (tangerine) for a single hero band or feature moment per view, and one primary button for the main action. Everything else stays on `bg`, `surface`, and `ink`.
3. **Accessible by default.** Every pairing in every theme meets WCAG AA. See the Accessibility page, which is a set of rules, not suggestions.
4. **Tokens or it doesn't ship.** No raw colors, sizes, or durations in component code. If a value is missing, add a token.
5. **HSL only.** Colors are written as `hsl()`, never hex, so a value can be read and adjusted by eye: hue picks the color, saturation its intensity, and lightness its depth.
