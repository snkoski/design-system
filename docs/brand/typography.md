# Typography

- One family: **Geist** for everything, **Geist Mono** for code. Self-host both as variable woff2 files in production.
- Headings use the fluid styles `display`, `heading-xl`, `heading-lg`, `heading-md`, and `heading-sm`. They grow smoothly from phone to wide screen (ratio about 1.25 on phones to 1.333 on desktop). The exact `clamp()` for each is in its usage note.
- Use `display` once per page at most. Headings get `text-wrap: balance`.
- Running text is `body` (1rem) with `body-lg` for intros, kept within `measure`. Meta and helper text is `small`. `label` is for short uppercase eyebrows only.
- Numbers that line up in columns use `font-variant-numeric: tabular-nums`.
- Text in text fields, and the labels of form controls and groups, use the `leading-control` line height (1.5), so one line centers in a field.

## Sizes and limits

| Rule | Sherbet | Why |
| --- | --- | --- |
| Body text | `body`, 1rem (16px) | USWDS, Material, and most web systems use 16px as the readable minimum for running text. Apple's iOS default is 17pt. |
| Smallest text | `label`, 0.75rem (12px), short labels only | 12px is the floor in Carbon, Atlassian, and Primer. Apple's iOS minimum is 11pt. Never set sentences below `small` (14px). |
| Body line height | 1.6 | WCAG 1.4.12 assumes text can take 1.5; USWDS asks for at least 1.5 for long text. |
| Heading line height | 1.0–1.3 | Tighter for big display type, looser for small headings, as in GOV.UK and USWDS. |
| Line length | `measure` (40rem), about 65–75 characters | USWDS targets 66 (range 45–90), Material 40–60, GOV.UK at most 75, Primer about 80. |

## Phones and desktops

- **Body text stays the same size on every screen.** GOV.UK keeps body at 19px and USWDS keeps 16px at every width; the reading distance changes less than you'd think. Never shrink body text on phones.
- **Headings shrink on small screens.** That's what the fluid heading styles do: `display` runs from 39px on phones to 67px on wide screens. GOV.UK does the same with fixed steps at 640px.
- **Dense app screens can use `small` (14px) for table cells and metadata**, the way Primer, Atlassian, and Carbon use 14px body in product UI. Keep forms, instructions, and anything long at `body`.

## Readers who enlarge text

- All sizes are in rem, so text follows the reader's browser font setting. Never set `html { font-size }` in px (USWDS defaults to respecting the user's font size for the same reason).
- Layouts must survive text at 200% (WCAG 1.4.4) and the WCAG 1.4.12 spacing overrides: line height 1.5, paragraph spacing 2×, letter spacing 0.12em, and word spacing 0.16em. In practice: never give a text container a fixed height, and let buttons and chips grow to fit their label.
- Apple's advice for large text applies on the web too: as text grows, stack side-by-side items vertically, reduce the number of columns, and avoid truncating.
