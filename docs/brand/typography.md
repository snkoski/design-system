# Typography

- One family: **Geist** for everything, **Geist Mono** for code. Self-host both as variable woff2 files in production.
- Headings use the fluid styles `display`, `heading-xl`, `heading-lg`, `heading-md`, and `heading-sm`. They grow smoothly from phone to wide screen (ratio about 1.25 on phones to 1.333 on desktop). The exact `clamp()` for each is in its usage note.
- Use `display` once per page at most. Headings get `text-wrap: balance`.
- Running text is `body` (1rem) with `body-lg` for intros, kept within `measure`. Meta and helper text is `small`. `label` is for short uppercase eyebrows only.
- Numbers that line up in columns use `font-variant-numeric: tabular-nums`.
