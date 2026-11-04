# Fonts to try

Fonts kept here for trying out later. Nothing imports them, so they never reach Storybook's pages or the published package.

## Paper Mono

A monospaced variable font, from Thin (100) to ExtraBold (800), under the SIL Open Font License (`fonts/PaperMono-OFL.txt`). It was compared with Geist on 2026-11-04, as headings only and for everything, and we kept Geist.

## Trying a font

1. Download it, and put the variable `.woff2` file and its license in `fonts/` here. A variable font is one file for every weight, so prefer it over one file per weight.
2. Write an `@font-face` for it, like `paper-mono.css`. Its `font-weight` range must match the font's own weight axis.
3. To see it on real components, write a Revisit story (`src/experiments/Revisit/`) with an entry in `docs/revisit.md`. Import the CSS from there, and switch fonts inside one option by setting `--font-sans` and `--font-mono` on its wrapper. Every component reads its font from those two variables. For headings only, set `font-family` on the `.text-display` and `.text-heading-*` classes.

## Adopting a font

1. Change the families in `tokens/tokens.json`: `type.families.sans` and `mono`, or a single group's `family` (the Headings group, say).
2. Load it from `src/styles/fonts.css`. If it's on npm (as Geist is, from `@fontsource-variable`), import the package. If it's a download, move the `.woff2` into `src/styles/` with an `@font-face`, and make `scripts/copy-css.mjs` copy the file into `dist/`. Today that script copies `fonts.css` but no font files.
3. Ship the license with the font, and update `docs/brand/typography.md`.
4. Check every component with Storybook in all three themes: a wider font makes labels wrap sooner.
