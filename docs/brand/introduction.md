# Introduction

Sherbet is bright, a little weird, and carefully made. It pairs sherbet pastels (tangerine, peach, mint) with a deep espresso ink, so it can be playful without looking unserious. It is built to be reused: components only ever read semantic tokens, so another site can re-brand it by overriding a short list of values.

## Principles

1. **Playful in the details, serious in the structure.** Personality lives in color, headlines, copy, and hot dog mode. Layout, forms, and navigation stay predictable.
2. **One loud thing per screen.** Use `action` (tangerine) for a single primary action or hero moment per view. Everything else stays on `bg`, `surface`, and `ink`.
3. **Accessible by default.** Every pairing in every theme meets WCAG AA. See the Accessibility page, which is a set of rules, not suggestions.
4. **Tokens or it doesn't ship.** No raw colors, sizes, or durations in component code. If a value is missing, add a token.
5. **HSL only.** Colors are written as `hsl()`, never hex, so a value can be read and adjusted by eye: hue picks the color, saturation its intensity, and lightness its depth.
