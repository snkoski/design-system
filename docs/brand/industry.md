# Industry standards

How nine widely used design systems and WCAG 2.2 handle each topic, and what Sherbet chose. Numbers were read from each system's official documentation in October 2026. A dash means the system doesn't publish a number.

Systems compared: **Apple** Human Interface Guidelines, Google **Material** 3, GitHub **Primer**, **Atlassian**, IBM **Carbon**, Microsoft **Fluent** 2, Shopify **Polaris**, the **GOV.UK** Design System, and the U.S. Web Design System (**USWDS**).

## Target size

| Source | Touch | Mouse or pointer | Notes |
| --- | --- | --- | --- |
| WCAG 2.2 | 44px (AAA) | 24px (AA) | Smaller targets pass AA if a 24px circle around each doesn't overlap a neighbor |
| Apple | 44pt (iOS), 60pt (visionOS) | 28pt (macOS) | Minimums: 28pt iOS, 20pt macOS |
| Material | 48dp | 44dp | 8dp between targets |
| Fluent | 44px web, 44pt iOS, 48dp Android | — | |
| Polaris | 44px | — | |
| Primer | 44px recommended on mobile | 24px minimum | Warns against switching sizes on the *primary* pointer |
| **Sherbet** | **44px** | **24px** | Switches with `any-pointer: coarse`; 8px between targets |

## Control heights

| Source | Sizes | Default |
| --- | --- | --- |
| Primer | 24, 28, 32, 40, 48px | 32px |
| Carbon | 24, 32, 40, 48px (plus 64, 80px) | 40px inputs, 48px buttons common |
| Apple visionOS | 28, 32, 44, 52, 64pt | 44pt |
| Material | 56dp text fields | — |
| **Sherbet** | **32, 40, 48px (40 → 44 and 48 → 52 on touch)** | **40px** |

## Spacing and grid

| Source | Base | Notes |
| --- | --- | --- |
| Fluent, Polaris, Primer | 4px | Primer and Fluent add 2px and 6px steps |
| Material, Carbon, Atlassian | 8px | With 2px and 4px half-steps |
| GOV.UK | 5px | Spacing grows on screens wider than 640px |
| **Sherbet** | **4px (rem)** | Matches Tailwind; page spacing grows with width, component spacing doesn't |

## Typography

| Source | Body | Smallest | Line length |
| --- | --- | --- | --- |
| Apple | 17pt iOS, 13pt macOS | 11pt iOS, 10pt macOS | — |
| Material | 16sp (body large) | 11sp | 40–60 characters |
| Primer | 14–16px | 12px | about 80 characters |
| Atlassian | 14px in components, 16px long-form | 12px | — |
| Carbon | 14–16px | 12px | — |
| GOV.UK | 19px on every screen | 16px | at most 75 characters |
| USWDS | at least 16px | — | 45–90, target 66 |
| **Sherbet** | **16px (`body`), 14px in dense UI** | **12px, labels only** | **`measure`, about 65–75** |

Every system keeps body text the same size on phones and desktops. Headings are what change: GOV.UK shrinks them below 640px, and Sherbet's fluid headings do the same smoothly.

## Contrast and focus

| Source | Text | UI and icons | Focus indicator |
| --- | --- | --- | --- |
| WCAG 2.2 AA | 4.5:1 (3:1 large) | 3:1 | Visible; not hidden by sticky content |
| Primer | 4.5:1; 7:1 in high-contrast themes | 3:1 | 2px outline |
| Atlassian | 4.5:1 | 3:1 | 2px border |
| Carbon | 4.5:1 | 3:1, focus 3:1 | 2px border on inputs |
| USWDS | 4.5:1 | 3:1 | 4px solid outline |
| GOV.UK | 4.5:1 | 3:1 | Yellow background with a thick black underline |
| **Sherbet** | **4.5:1 in all three themes** | **3:1** | **2px outline, 2px offset, never a shadow alone** |

Primer ships nine themes, including high-contrast and colorblind variants. Carbon ships four. Sherbet has three, with high contrast as a future addition.

## Component color

| Source | Primary button and checked controls |
| --- | --- |
| Apple | The app's accent (tint) color, blue by default |
| Material 3 | The brand's primary color, or one drawn from the wallpaper (dynamic color) |
| Primer | Green primary button; blue checked controls |
| Atlassian, Carbon | The brand blue |
| GOV.UK | Green primary button; black checkbox ticks and radio dots |
| Polaris | Near black, since its 2023 redesign |
| shadcn/ui | Near black in its default theme |
| **Sherbet** | **Near black (near white in dark mode). Brand colors live in the layout, so the components suit any brand** |

## Motion

| Source | Durations | Reduced motion |
| --- | --- | --- |
| Atlassian | 50–600ms; exits 50–100ms shorter | Motion off and instant |
| Carbon | 70–700ms; productive and expressive curves | Provide alternatives |
| Polaris | 50–500ms | Respect `prefers-reduced-motion` |
| Material | 50–1000ms, mostly 200–500ms; now spring-based | — |
| Apple | Springs, no published durations | Replace slides with fades |
| WCAG | Anything that moves for more than 5 seconds can be paused | Interaction animations can be turned off (AAA) |
| **Sherbet** | **120, 200, and 320ms; exits faster** | **Slides become fades; no bounce** |

## Breakpoints

| Source | Breakpoints |
| --- | --- |
| Material | 600, 840, 1200, 1600dp |
| Primer | 544, 768, 1012, 1280, 1400px |
| Atlassian | 480, 768, 1024, 1440, 1768px |
| Carbon | 672, 1056, 1312, 1584px |
| Fluent | 480, 640, 1024, 1366, 1920px |
| Polaris | 490, 768, 1040, 1440px |
| USWDS | 480, 640, 1024px (plus optional steps) |
| GOV.UK | 640px for type and spacing |
| **Sherbet** | **640, 768, 1024, 1280, 1536px (in em)** |

## Density

| Source | Approach |
| --- | --- |
| Material | Opt-in density steps; never denser by default; never denser for menus or dialogs |
| Primer | Condensed, normal, and spacious spacing per component |
| Atlassian | Compact buttons for tables |
| Polaris | Don't mix densities on one page |
| **Sherbet** | **Comfortable by default; `data-density="compact"` for desktop tables and toolbars** |

## Writing

| Rule | Who does it | Sherbet |
| --- | --- | --- |
| Sentence case for UI text | Primer, Atlassian, Carbon, Polaris, GOV.UK, Fluent (web) | Yes |
| Oxford comma | Atlassian, Polaris | Yes |
| Buttons start with a verb, no punctuation | Primer, Atlassian, Polaris, Fluent, GOV.UK | Yes |
| At most one exclamation mark per page | Atlassian, Polaris, Carbon | Yes |
| Errors say what went wrong and how to fix it | Primer, Atlassian, Polaris, GOV.UK | Yes |
| No "invalid," "oops," "please," or "sorry" in errors | GOV.UK, Polaris | Yes |
| No humor in errors | Primer, Atlassian | Yes |

## Buttons

| System | Emphasis levels, highest first | Danger |
| --- | --- | --- |
| Uber Base | Primary, secondary, tertiary, and outline | On primary, secondary, and tertiary |
| Carbon | Primary, secondary, tertiary, and ghost | On primary, tertiary, and ghost |
| Primer | Primary, default, and invisible | Its own variant |
| Atlassian | Primary, default, and subtle | Its own `danger` and `warning` styles |
| **Sherbet** | **Primary, secondary, and ghost** | **A tone on secondary and ghost: red words and edge, no fill** |

Every system limits primary buttons: Carbon to one per page (dialogs and side panels aside), Primer to one per group and rarely more than one per page. Sherbet allows one per view.

Some systems offer more than one button shape. Material 3's expressive update has round and square buttons, Uber's Base has a `shape` prop (pill, round, square, and others), and SwiftUI buttons take a capsule or rounded-rectangle border. Carbon and GOV.UK use square corners only. Sherbet has a rectangle with small rounded corners by default, and a pill.

When a label doesn't fit, most systems let it wrap onto more lines: Carbon (which says not to truncate), Fluent, Polaris, GOV.UK, USWDS, Spectrum, and Base Web. Atlassian, and Material's web component, cut it off with an ellipsis. Primer keeps it on one line and relies on short labels. WCAG only allows a cut-off label when something else shows the full text. Sherbet wraps.

## Loading

| System | Name | What screen readers hear | Sizes | Delay before it shows |
| --- | --- | --- | --- | --- |
| Primer | Spinner | `srText`, "Loading" by default and hidden. No live region: the page adds one | Small, medium, and large | `delay`: off, 300ms, 1000ms, or any number |
| Atlassian | Spinner | `label`, which its guidance says to always set | Five, from extra small to extra large, or a number | `delay` in ms, default 0. It fades in, so it's never seen in under about 150ms |
| Fluent 2 | Spinner | A visible `label`, linked with `aria-labelledby`; `role="progressbar"` | Eight, 16 to 44px; 32px by default | `delay` in ms, default 0 |
| Polaris | Spinner (React, now archived) and `s-spinner` | `accessibilityLabel`, no default; `role="status"` | Two or three | None. Its guidance: only show one when loading takes over 500ms |
| Carbon | Loading, and InlineLoading for small actions | "loading" by default, hidden; InlineLoading has visible words ("Saving…"). Both use an assertive live region | Large and small | None |
| Material 3 | Circular progress indicator, and a newer loading indicator | An `aria-label` the page sets | 48px on the web | Not documented |
| Apple | Activity indicator | Not documented in the guidelines | Not documented | Not documented. Prefers a determinate indicator when possible |
| shadcn/ui | Spinner | `role="status"` and `aria-label="Loading"` on the icon, not visible | One, resized with classes | None |
| GOV.UK, USWDS | None | | | |
| **Sherbet** | **Spinner** | **A required label, visible by default (`hideLabel` hides it), announced once through a polite status region** | **16, 20, and 24px** | **`delay` in ms, default 0, then a fade. Done in CSS, so it works before JavaScript runs** |

Most systems hide the words and say "Loading" by default. Sherbet makes the label required and visible, because `voice.md` asks for loading text that says what's loading, and Fluent and Carbon's inline loader show it too. Carbon, Atlassian, and Polaris all say to show only one at a time; so does Sherbet's guidance. Every system with guidance agrees that a spinner is for short waits of unknown length: Primer shows nothing under one second and a determinate indicator over three, and Apple, Material, and Fluent prefer a progress bar whenever progress can be measured.

## Forms

| Rule | GOV.UK | Primer | Atlassian | Carbon | Polaris | USWDS | Sherbet |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mark required or optional | Optional | Required | Required (asterisk) | The minority | Optional | Required (asterisk) | **Optional, no asterisks** |
| When to validate | On submit | On submit | As you type | On leaving a field | On leaving a field | — | **On submit, then as you type** |
| Error summary | Always | 3+ errors | — | — | — | — | **2+ errors** |
| Where an inline error goes | Above the field | Below the field | Below the field | Below the field | Below the field | Above the field | **Above the field** |
| Disable submit button | No | No | No | Short forms only | — | — | **No** |
| Placeholder as label | No | No | — | — | No essential info | — | **No** |

## Sources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Material Design 3](https://m3.material.io/foundations/designing/structure)
- [GitHub Primer](https://primer.style/product/getting-started/foundations/responsive/)
- [Atlassian Design System](https://atlassian.design/foundations/spacing)
- [IBM Carbon](https://carbondesignsystem.com/components/button/style/) and [Carbon buttons](https://carbondesignsystem.com/components/button/usage)
- [Primer buttons](https://primer.style/components/button)
- [Atlassian buttons](https://developer.atlassian.com/platform/forge/ui-kit/components/button)
- [Material 3 buttons](https://m3.material.io/components/buttons/overview)
- [Uber Base buttons](https://baseweb.design/components/button/)
- [SwiftUI button border shapes](https://developer.apple.com/documentation/swiftui/buttonbordershape)
- [Primer button guidelines](https://primer.style/product/components/button/guidelines/)
- [Fluent 2 buttons](https://fluent2.microsoft.design/components/web/react/core/button/usage)
- [Spectrum web components buttons](https://opensource.adobe.com/spectrum-web-components/components/button/)
- [WCAG 2.2: Understanding Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [Microsoft Fluent 2](https://fluent2.microsoft.design/layout)
- [Shopify Polaris](https://polaris-react.shopify.com/content/grammar-and-mechanics)
- [GOV.UK Design System](https://design-system.service.gov.uk/patterns/question-pages)
- [U.S. Web Design System](https://designsystem.digital.gov/components/typography/)
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Primer Spinner](https://primer.style/product/components/spinner/), its [accessibility notes](https://primer.style/product/components/spinner/accessibility), and the [loading pattern](https://primer.style/product/ui-patterns/loading/)
- [Atlassian Spinner](https://atlassian.design/components/spinner/usage)
- [Fluent 2 Spinner](https://fluent2.microsoft.design/components/web/react/core/spinner/usage) and its [source](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-spinner/library/src/components/Spinner)
- [Polaris Spinner](https://shopify.dev/docs/api/app-home/polaris-web-components/feedback-and-status-indicators/spinner)
- [Carbon Loading](https://carbondesignsystem.com/components/loading/usage/) and [Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/)
- [Material 3 progress indicators](https://m3.material.io/components/progress-indicators/guidelines) and [material-web's progress docs](https://github.com/material-components/material-web/blob/main/docs/components/progress.md)
- [Apple progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
- [shadcn/ui Spinner](https://ui.shadcn.com/docs/components/spinner)
