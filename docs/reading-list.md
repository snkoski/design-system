<!-- Generated from docs/reading-list.json by scripts/build-reading-list.mjs. Edit the JSON, then run `pnpm reading-list`. -->

# Reading list

Articles, guides, and references to read later. When something here changes a decision, record the decision in `docs/brand/`.

Design system links appear twice on purpose: once by system, to see everything one system says, and again by topic, to compare how every system handles, say, design tokens or checkboxes. Both come from the same entry in `docs/reading-list.json`, so a link is only ever added once. `docs/reading-list.html` is the same list as a page you can search and filter.

## Contents

- [Choosing and building colors](#choosing-and-building-colors)
  - [Building a palette](#building-a-palette)
  - [Choosing brand colors](#choosing-brand-colors)
  - [Color psychology](#color-psychology)
- [Accessibility standards](#accessibility-standards)
  - [WCAG](#wcag)
  - [ARIA Authoring Practices Guide](#aria-authoring-practices-guide)
- [Design systems, by system](#design-systems-by-system)
  - [Apple Human Interface Guidelines](#apple-human-interface-guidelines)
  - [Material Design 3 (Google)](#material-design-3-google)
  - [GitHub Primer](#github-primer)
  - [Atlassian Design System](#atlassian-design-system)
  - [IBM Carbon](#ibm-carbon)
  - [Microsoft Fluent 2](#microsoft-fluent-2)
  - [Shopify Polaris](#shopify-polaris)
  - [GOV.UK Design System](#govuk-design-system)
  - [U.S. Web Design System](#us-web-design-system)
- [Design systems, by topic](#design-systems-by-topic)
  - [Getting started](#getting-started)
  - [Design tokens](#design-tokens)
  - [Color](#color)
  - [Typography](#typography)
  - [Spacing, layout, and grids](#spacing-layout-and-grids)
  - [Shape and elevation](#shape-and-elevation)
  - [Motion](#motion)
  - [Icons](#icons)
  - [Writing and content](#writing-and-content)
  - [Accessibility](#accessibility)
  - [Focus](#focus)
  - [Platforms and input](#platforms-and-input)
- [Components, by type](#components-by-type)
  - [Buttons](#buttons)
  - [Checkboxes](#checkboxes)
  - [Radio buttons](#radio-buttons)
  - [Switches](#switches)
  - [Segmented controls](#segmented-controls)
  - [Text fields](#text-fields)
  - [Text areas](#text-areas)
  - [Forms and errors](#forms-and-errors)
  - [Dialogs](#dialogs)
  - [Tooltips](#tooltips)
  - [Navigation](#navigation)
  - [Loading indicators](#loading-indicators)
  - [Separators](#separators)
  - [Badges](#badges)
  - [Meters and progress bars](#meters-and-progress-bars)
  - [Selects](#selects)
  - [Number fields](#number-fields)
  - [Date pickers](#date-pickers)

## Choosing and building colors

### Building a palette

- [Refactoring UI: Building your color palette](https://refactoringui.com/previews/building-your-color-palette): the most practical short read. Grays, primary, and accent colors, and how to build 9 to 10 shades of each.
- [Stripe: Designing accessible color systems](https://stripe.com/blog/accessible-color-systems): why HSL lightness doesn't match how bright a color looks, and how Stripe rebuilt its palette so every hue has the same contrast at each step.
- [Matt Strom: How to generate color palettes for design systems](https://mattstromawn.com/writing/generating-color-palettes/): perceptual color spaces, shifting hue as colors get lighter or darker, and generating scales from formulas.
- [Radix Colors: Composing a palette](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette): choosing a brand color, a gray tinted toward it, and status colors.
- [Radix Colors: Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale): what each of 12 shades is for: backgrounds, borders, fills, and text.
- [OneSignal: 11 shades of gray](https://onesignal.com/blog/11-shades-of-gray-a-color-system-story/): A case study of building a gray scale.
- [The 60-30-10 rule for UI design](https://bootcamp.uxdesign.cc/the-60-30-10-color-rule-for-ui-design-32695d04a7c2): A rough guide to how much of a screen is neutral, supporting color, and accent.

### Choosing brand colors

- [Shopify: How to choose brand colors](https://www.shopify.com/blog/choose-brand-colors): A general branding guide.
- [Adobe: Picking your brand colors](https://www.adobe.com/express/learn/blog/3-easy-steps-to-picking-your-brand-colors): another general guide, in three steps.

### Color psychology

- [Color psychology: how colors influence the mind](https://www.psychologytoday.com/intl/blog/habits-not-hacks/201408/color-psychology-how-colors-influence-the-mind): A skeptical, research-based take. Fit with the brand's personality and standing out matter more than what a hue "means."
- [Labrecque and Milne, "Exciting red and competent blue"](https://colab.ws/articles/10.1007/s11747-010-0245-y): research on how hue, saturation, and lightness shift a brand's perceived personality.
- [Singh, "Impact of color on marketing"](https://newion.uwinnipeg.ca/~ssingh5/x/color.pdf): the source of the often-quoted "up to 90% of snap judgments" figure. Widely repeated, loosely sourced.

## Accessibility standards

Each design system's own accessibility pages are under Accessibility in the design systems section.

### WCAG

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): the full standard.
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/): the easier way in: every criterion, filterable, with techniques.
- [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [Understanding WCAG: Target size (minimum)](https://w3c.github.io/wcag/understanding/target-size-minimum.html): where the 24px minimum comes from.
- [Understanding WCAG: Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [Understanding WCAG: Focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)

### ARIA Authoring Practices Guide

How each kind of component should work with a keyboard and screen reader. Read the matching pattern before building a component.

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [APG pattern: Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [APG pattern: Dialog (modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [APG pattern: Menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [APG pattern: Menu bar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
- [APG pattern: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [APG pattern: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [WAI-ARIA 1.2: the meter role](https://www.w3.org/TR/wai-aria-1.2/#meter)
- [Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)

## Design systems, by system

Everything we read from each system, grouped by topic.

### Apple Human Interface Guidelines

- **Getting started:** [Home](https://developer.apple.com/design/human-interface-guidelines/)
- **Color:** [Dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- **Typography:** [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- **Spacing, layout, and grids:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **Motion:** [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Icons:** [Icons](https://developer.apple.com/design/human-interface-guidelines/icons) and [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- **Accessibility:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Focus:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
- **Platforms and input:** [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices) and [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos) (where the 28pt Mac target size comes from)
- **Buttons:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- **Checkboxes:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Radio buttons:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Switches:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Segmented controls:** [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)
- **Text fields:** [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- **Text areas:** [Text views](https://developer.apple.com/design/human-interface-guidelines/text-views)
- **Dialogs:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), and [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- **Tooltips:** [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help) (help tags; there's no tooltip page)
- **Navigation:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- **Loading indicators:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), [Loading](https://developer.apple.com/design/human-interface-guidelines/loading) (show placeholder text, graphics, or animations as content loads; a progress indicator for longer waits), and [redacted(reason:) (SwiftUI)](https://developer.apple.com/documentation/swiftui/view/redacted(reason:)) (apple's skeleton: the real view, masked into placeholder shapes of the same size)
- **Separators:** [Divider (SwiftUI)](https://developer.apple.com/documentation/swiftui/divider) (no options: it runs across a stack, so it turns vertical inside a row)
- **Badges:** [Notifications (badging)](https://developer.apple.com/design/human-interface-guidelines/notifications) (apple's badge is only the unread count on an app icon)
- **Meters and progress bars:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) and [Gauges](https://developer.apple.com/design/human-interface-guidelines/gauges) (A value within a range, with its current value and both ends labelled)
- **Selects:** [Pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons) and [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons)
- **Number fields:** [Steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)
- **Date pickers:** [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)

### Material Design 3 (Google)

- **Getting started:** [Home](https://m3.material.io/) and [Structure](https://m3.material.io/foundations/designing/structure)
- **Typography:** [Typography (Android)](https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md)
- **Spacing, layout, and grids:** [Window size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes) (material's breakpoints) and [Window size classes (Android)](https://developer.android.com/guide/topics/ui/layout/window-size-classes)
- **Motion:** [Motion (Android)](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- **Buttons:** [Buttons (Android)](https://github.com/material-components/material-components-android/blob/master/docs/components/Button.md)
- **Checkboxes:** [Checkbox](https://m3.material.io/components/checkbox/guidelines)
- **Radio buttons:** [Radio button](https://m3.material.io/components/radio-button/guidelines)
- **Switches:** [Switch](https://m3.material.io/components/switch/guidelines)
- **Segmented controls:** [Segmented buttons](https://m3.material.io/components/segmented-buttons/overview) and [Button groups](https://m3.material.io/components/button-groups/overview) (the newer connected button group)
- **Text fields:** [Text fields](https://m3.material.io/components/text-fields/guidelines) (multi-line text is part of text fields; there's no separate text area)
- **Text areas:** [Text fields](https://m3.material.io/components/text-fields/guidelines) (multi-line text is part of text fields; there's no separate text area)
- **Dialogs:** [Dialogs](https://m3.material.io/components/dialogs/guidelines)
- **Tooltips:** [Tooltips](https://m3.material.io/components/tooltips/guidelines)
- **Loading indicators:** [Progress indicators](https://m3.material.io/components/progress-indicators/guidelines) and [Progress (material-web)](https://github.com/material-components/material-web/blob/main/docs/components/progress.md) (the web component's sizes and labelling)
- **Separators:** [Divider (material-web)](https://github.com/material-components/material-web/blob/main/docs/components/divider.md) (inset variants; decorative unless you add role="separator")
- **Badges:** [Badges (MDC-Android)](https://github.com/material-components/material-components-android/blob/master/docs/components/BadgeDrawable.md) (material's badge is a count or dot on navigation and icons)
- **Meters and progress bars:** [Progress indicators](https://m3.material.io/components/progress-indicators/guidelines)
- **Selects:** [Material Web select](https://material-web.dev/components/select/)
- **Number fields:** [Text field](https://material-web.dev/components/text-field/) (material Web's text field, which takes type="number")
- **Date pickers:** [Date pickers guidelines](https://m3.material.io/components/date-pickers/guidelines) and [Date pickers accessibility](https://m3.material.io/components/date-pickers/accessibility)

### GitHub Primer

- **Getting started:** [Home](https://primer.style/) and [Product foundations](https://primer.style/product)
- **Design tokens:** [Primitives](https://primer.style/product/primitives) and [Token names](https://primer.style/product/primitives/token-names/)
- **Color:** [Color usage](https://primer.style/product/getting-started/foundations/color-usage/) and [Color primitives](https://primer.style/product/primitives/color/)
- **Typography:** [Typography](https://primer.style/product/getting-started/foundations/typography/) and [Typography primitives](https://primer.style/product/primitives/typography/)
- **Spacing, layout, and grids:** [Layout](https://primer.style/product/getting-started/foundations/layout/), [Responsive](https://primer.style/product/getting-started/foundations/responsive/), and [Size primitives](https://primer.style/product/primitives/size/)
- **Writing and content:** [Content](https://primer.style/product/getting-started/foundations/content/)
- **Accessibility:** [Accessibility](https://primer.style/accessibility), [Color considerations](https://primer.style/accessibility/design-guidance/color-considerations/), [Focus management](https://primer.style/accessibility/design-guidance/focus-management/), [Links and buttons](https://primer.style/accessibility/design-guidance/links-and-buttons/), [Motion and animation](https://primer.style/accessibility/design-guidance/motion-and-animation/), [Text resize and spacing](https://primer.style/accessibility/design-guidance/text-resize-and-spacing/), and [Mobile checklist](https://primer.style/accessibility/tools-and-resources/checklists/mobile-checklist/)
- **Buttons:** [Button](https://primer.style/product/components/button/) and [Button group](https://primer.style/product/components/button-group)
- **Checkboxes:** [Checkbox](https://primer.style/product/components/checkbox)
- **Radio buttons:** [RadioGroup](https://primer.style/product/components/radio-group)
- **Switches:** [ToggleSwitch](https://primer.style/product/components/toggle-switch)
- **Segmented controls:** [SegmentedControl](https://primer.style/product/components/segmented-control)
- **Text fields:** [TextInput](https://primer.style/product/components/text-input)
- **Text areas:** [Textarea](https://primer.style/product/components/textarea)
- **Forms and errors:** [Forms](https://primer.style/product/ui-patterns/forms/)
- **Dialogs:** [Dialog](https://primer.style/product/components/dialog)
- **Tooltips:** [Tooltip](https://primer.style/product/components/tooltip)
- **Loading indicators:** [Spinner](https://primer.style/product/components/spinner/), [Spinner accessibility](https://primer.style/product/components/spinner/accessibility) (no built-in announcement: the page adds its own live region), [Loading](https://primer.style/product/ui-patterns/loading/) (which loading indicator for how long a wait: nothing under one second), [SkeletonText](https://primer.style/product/components/skeleton-text) (lines that follow the type styles, the last at 65%), and [ProgressBar](https://primer.style/product/components/progress-bar/)
- **Separators:** [ActionList dividers](https://primer.style/product/components/action-list/) (primer has no standalone divider; ActionList's is hidden from screen readers)
- **Badges:** [Label](https://primer.style/product/components/label/) (ten variants, and a warning not to rely on the variant's color alone)
- **Meters and progress bars:** [ProgressBar](https://primer.style/product/components/progress-bar/)
- **Selects:** [Select guidelines](https://primer.style/product/components/select/guidelines/) and [SelectPanel](https://primer.style/product/components/select-panel/)
- **Number fields:** [TextInput](https://primer.style/product/components/text-input)
- **Date pickers:** [DatePicker (internal)](https://primer.style/product/internal-components/date-picker/) (gitHub's own; not for use outside GitHub)

### Atlassian Design System

- **Getting started:** [Home](https://atlassian.design/) and [Components](https://atlassian.design/components)
- **Design tokens:** [Design tokens](https://atlassian.design/foundations/tokens)
- **Color:** [Color](https://atlassian.design/foundations/color) and [Color (new)](https://atlassian.design/foundations/color-new)
- **Typography:** [Typography](https://atlassian.design/foundations/typography)
- **Spacing, layout, and grids:** [Spacing](https://atlassian.design/foundations/spacing) and [Grid](https://atlassian.design/foundations/grid)
- **Shape and elevation:** [Radius](https://atlassian.design/foundations/radius), [Border](https://atlassian.design/foundations/border), and [Elevation](https://atlassian.design/foundations/elevation)
- **Motion:** [Motion](https://atlassian.design/foundations/motion) and [Applying motion](https://atlassian.design/foundations/motion/applying-motion)
- **Writing and content:** [Content](https://atlassian.design/foundations/content), [Voice and tone](https://atlassian.design/foundations/content/voice-tone), [Language and grammar](https://atlassian.design/foundations/content/language-and-grammar), and [Designing messages](https://atlassian.design/foundations/content/designing-messages)
- **Accessibility:** [Accessibility](https://atlassian.design/foundations/accessibility)
- **Focus:** [Focus ring](https://atlassian.design/components/focus-ring/usage) and [Focusable](https://atlassian.design/components/primitives/focusable)
- **Buttons:** [Button usage](https://atlassian.design/components/button/usage), [Button examples](https://atlassian.design/components/button/examples), [Evolving buttons and links](https://atlassian.design/whats-new/evolving-button-and-links), and [Button (Forge UI Kit)](https://developer.atlassian.com/platform/forge/ui-kit/components/button) (default, primary, subtle, warning, and danger)
- **Checkboxes:** [Checkbox](https://atlassian.design/components/checkbox/usage)
- **Radio buttons:** [Radio](https://atlassian.design/components/radio/usage)
- **Switches:** [Toggle](https://atlassian.design/components/toggle/usage)
- **Text fields:** [Text field usage](https://atlassian.design/components/textfield/usage) and [Text field examples](https://atlassian.design/components/textfield/examples)
- **Text areas:** [Text area](https://atlassian.design/components/textarea/usage)
- **Forms and errors:** [Form](https://atlassian.design/components/form/usage)
- **Dialogs:** [Modal dialog](https://atlassian.design/components/modal-dialog/usage)
- **Tooltips:** [Tooltip](https://atlassian.design/components/tooltip/usage/)
- **Loading indicators:** [Spinner](https://atlassian.design/components/spinner/usage), [Skeleton](https://atlassian.design/components/skeleton/usage) (one shape with a width, height, and radius, and an optional shimmer), and [Progress bar](https://atlassian.design/components/progress-bar/usage)
- **Separators:** [Menu sections with separators](https://atlassian.design/components/menu/code) (no standalone divider: a menu Section's hasSeparator draws a border)
- **Badges:** [Lozenge](https://atlassian.design/components/lozenge/usage) (atlassian's status label (its Badge is a count): sentence case, never interactive)
- **Meters and progress bars:** [Progress bar](https://atlassian.design/components/progress-bar/usage)
- **Selects:** [Components for LLMs (Select)](https://atlassian.design/llms-components.txt)
- **Number fields:** [Text field usage](https://atlassian.design/components/textfield/usage)
- **Date pickers:** [Date picker usage](https://atlassian.design/components/datetime-picker/date-picker/usage) and [Date picker code](https://atlassian.design/components/datetime-picker/date-picker/code)

### IBM Carbon

- **Getting started:** [Home](https://carbondesignsystem.com/)
- **Color:** [Color](https://carbondesignsystem.com/elements/color/overview/) and [Themes](https://carbondesignsystem.com/elements/themes/overview/)
- **Typography:** [Typography](https://carbondesignsystem.com/elements/typography/overview/) and [Type sets](https://carbondesignsystem.com/elements/typography/type-sets/)
- **Spacing, layout, and grids:** [Spacing](https://carbondesignsystem.com/elements/spacing/overview/) and [2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/)
- **Motion:** [Motion](https://carbondesignsystem.com/elements/motion/overview/)
- **Writing and content:** [Writing style](https://carbondesignsystem.com/guidelines/content/writing-style/)
- **Accessibility:** [Accessibility](https://carbondesignsystem.com/guidelines/accessibility/overview/)
- **Buttons:** [Button usage](https://carbondesignsystem.com/components/button/usage/) (emphasis levels, one primary per page, and danger buttons) and [Button style](https://carbondesignsystem.com/components/button/style/)
- **Checkboxes:** [Checkbox](https://www.carbondesignsystem.com/building-blocks/core/components/checkbox/guidelines)
- **Radio buttons:** [Radio button](https://www.carbondesignsystem.com/building-blocks/core/components/radio-button)
- **Switches:** [Toggle](https://www.carbondesignsystem.com/building-blocks/core/components/toggle)
- **Segmented controls:** [Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher)
- **Text fields:** [Text input](https://www.carbondesignsystem.com/building-blocks/core/components/text-input) (text areas are a section of this page) and [Text input style](https://carbondesignsystem.com/components/text-input/style/)
- **Text areas:** [Text input](https://www.carbondesignsystem.com/building-blocks/core/components/text-input) (text areas are a section of this page)
- **Forms and errors:** [Forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/)
- **Dialogs:** [Modal](https://www.carbondesignsystem.com/building-blocks/core/components/modal)
- **Tooltips:** [Tooltip](https://www.carbondesignsystem.com/building-blocks/core/components/tooltip)
- **Loading indicators:** [Loading](https://carbondesignsystem.com/components/loading/usage/), [Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/), [Loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/) (skeletons only on containers and data, never on toasts, menus, or modals), [Progress bar](https://carbondesignsystem.com/components/progress-bar/usage/) (under 5 seconds, use a loading spinner instead), and [Progress bar accessibility](https://carbondesignsystem.com/components/progress-bar/accessibility/) (announces its helper text in a polite live region)
- **Badges:** [Tag](https://carbondesignsystem.com/components/tag/usage/) (twelve colors, under 20 characters, and long text cut off with a tooltip)
- **Meters and progress bars:** [Progress bar](https://carbondesignsystem.com/components/progress-bar/usage/) (under 5 seconds, use a loading spinner instead) and [Progress bar accessibility](https://carbondesignsystem.com/components/progress-bar/accessibility/) (announces its helper text in a polite live region)
- **Selects:** [Select](https://carbondesignsystem.com/components/select/usage/) and [Dropdown](https://carbondesignsystem.com/components/dropdown/usage/)
- **Number fields:** [Number input usage](https://carbondesignsystem.com/components/number-input/usage/)
- **Date pickers:** [Date picker usage](https://carbondesignsystem.com/components/date-picker/usage/)

### Microsoft Fluent 2

- **Getting started:** [Home](https://fluent2.microsoft.design/) and [Getting started](https://fluent2.microsoft.design/get-started/design)
- **Design tokens:** [Design tokens](https://fluent2.microsoft.design/design-tokens)
- **Color:** [Color](https://fluent2.microsoft.design/color)
- **Typography:** [Typography](https://fluent2.microsoft.design/typography)
- **Spacing, layout, and grids:** [Layout](https://fluent2.microsoft.design/layout)
- **Shape and elevation:** [Shapes](https://fluent2.microsoft.design/shapes) and [Elevation](https://fluent2.microsoft.design/elevation)
- **Motion:** [Motion](https://fluent2.microsoft.design/motion)
- **Writing and content:** [Content design](https://fluent2.microsoft.design/content-design)
- **Accessibility:** [Accessibility](https://fluent2.microsoft.design/accessibility)
- **Buttons:** [Button (web)](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Button (iOS)](https://fluent2.microsoft.design/components/ios/core/button/usage), and [Button (Android)](https://fluent2.microsoft.design/components/android/core/button/usage) (how one system sizes a control per platform)
- **Checkboxes:** [Checkbox](https://fluent2.microsoft.design/components/web/react/core/checkbox/usage)
- **Radio buttons:** [Radio group](https://fluent2.microsoft.design/components/web/react/core/radiogroup/usage)
- **Switches:** [Switch](https://fluent2.microsoft.design/components/web/react/core/switch/usage)
- **Segmented controls:** [Segmented control (iOS)](https://fluent2.microsoft.design/components/ios/core/segmentedcontrol/usage) (IOS only; the web has none)
- **Text fields:** [Input](https://fluent2.microsoft.design/components/web/react/core/input/usage) and [Field](https://fluent2.microsoft.design/components/web/react/core/field/usage)
- **Text areas:** [Textarea](https://fluent2.microsoft.design/components/web/react/core/textarea/usage)
- **Dialogs:** [Dialog](https://fluent2.microsoft.design/components/web/react/core/dialog/usage)
- **Tooltips:** [Tooltip](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage)
- **Loading indicators:** [Spinner](https://fluent2.microsoft.design/components/web/react/core/spinner/usage), [Spinner source](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-spinner/library/src/components/Spinner) (sizes, role, and delay, which the usage page doesn't list), [Skeleton](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-skeleton/stories/src/Skeleton) (an area plus shapes, like Sherbet's; announces with aria-busy), and [ProgressBar](https://fluent2.microsoft.design/components/web/react/core/progressbar/usage)
- **Separators:** [Divider](https://fluent2.microsoft.design/components/web/react/core/divider/usage) (vertical, four strengths, inset, and words in the middle. No built-in margin; hide a purely visual one with aria-hidden)
- **Badges:** [Badge](https://fluent2.microsoft.design/components/web/react/core/badge/usage) (eight colors, four looks, six sizes, and an optional icon; CounterBadge for counts)
- **Meters and progress bars:** [ProgressBar](https://fluent2.microsoft.design/components/web/react/core/progressbar/usage)
- **Selects:** [Select](https://fluent2.microsoft.design/components/web/react/core/select/usage) and [Dropdown](https://fluent2.microsoft.design/components/web/react/core/dropdown/usage)
- **Number fields:** [Spin button usage](https://fluent2.microsoft.design/components/web/react/core/spin/usage)
- **Date pickers:** [DatePicker (compat)](https://storybooks.fluentui.dev/react/iframe.html?viewMode=docs&id=compat-components-datepicker--docs)

### Shopify Polaris

- **Getting started:** [Polaris React](https://polaris-react.shopify.com/), [Polaris web components](https://shopify.dev/docs/api/polaris) (the newer version), and [App design guidelines](https://shopify.dev/docs/apps/design)
- **Design tokens:** [Space](https://polaris-react.shopify.com/tokens/space), [Font](https://polaris-react.shopify.com/tokens/font), [Text](https://polaris-react.shopify.com/tokens/text), [Breakpoints](https://polaris-react.shopify.com/tokens/breakpoints), [Border](https://polaris-react.shopify.com/tokens/border), [Shadow](https://polaris-react.shopify.com/tokens/shadow), and [Motion](https://polaris-react.shopify.com/tokens/motion)
- **Color:** [Visual design](https://shopify.dev/docs/apps/design/visual-design)
- **Typography:** [Font tokens](https://polaris-react.shopify.com/tokens/font) and [Text tokens](https://polaris-react.shopify.com/tokens/text)
- **Spacing, layout, and grids:** [Space tokens](https://polaris-react.shopify.com/tokens/space), [Breakpoint tokens](https://polaris-react.shopify.com/tokens/breakpoints), and [Layout](https://shopify.dev/docs/apps/design/layout)
- **Shape and elevation:** [Border tokens](https://polaris-react.shopify.com/tokens/border) and [Shadow tokens](https://polaris-react.shopify.com/tokens/shadow)
- **Motion:** [Motion tokens](https://polaris-react.shopify.com/tokens/motion)
- **Writing and content:** [Grammar and mechanics](https://polaris-react.shopify.com/content/grammar-and-mechanics), [Actionable language](https://polaris-react.shopify.com/content/actionable-language), and [Error messages](https://polaris-react.shopify.com/content/error-messages)
- **Accessibility:** [Accessibility](https://polaris-react.shopify.com/foundations/accessibility) and [App accessibility](https://shopify.dev/docs/apps/build/accessibility)
- **Buttons:** [Button](https://polaris-react.shopify.com/components/actions/button)
- **Checkboxes:** [Checkbox (web components)](https://shopify.dev/docs/api/app-home/latest/web-components/forms/checkbox) (the React page now redirects here)
- **Radio buttons:** [Radio button](https://polaris-react.shopify.com/components/selection-and-input/radio-button) and [Choice list](https://polaris-react.shopify.com/components/selection-and-input/choice-list)
- **Segmented controls:** [Button group](https://polaris-react.shopify.com/components/actions/button-group) (its segmented variant)
- **Text fields:** [Text field](https://polaris-react.shopify.com/components/selection-and-input/text-field) (for a text area, use its multiline option)
- **Text areas:** [Text field](https://polaris-react.shopify.com/components/selection-and-input/text-field) (for a text area, use its multiline option)
- **Tooltips:** [Tooltip](https://polaris-react.shopify.com/components/overlays/tooltip)
- **Loading indicators:** [Spinner](https://shopify.dev/docs/api/app-home/polaris-web-components/feedback-and-status-indicators/spinner) and [Skeleton body text](https://polaris.shopify.com/components/feedback-indicators/skeleton-body-text) (match the number of lines; the last line is shorter)
- **Separators:** [Divider (web components)](https://shopify.dev/docs/api/app-home/polaris-web-components/layout-and-structure/divider) (whitespace often groups better than lines, and too many add clutter)
- **Badges:** [Badge](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/feedback-indicators/badge.mdx) (one or two words, past tense; warning and critical only when really needed)
- **Selects:** [Select (docs source)](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/selection-and-input/select.mdx)
- **Number fields:** [Number field](https://shopify.dev/docs/api/app-home/latest/web-components/forms/number-field)
- **Date pickers:** [Date field](https://shopify.dev/docs/api/app-home/latest/web-components/forms/date-field)

### GOV.UK Design System

- **Getting started:** [Home](https://design-system.service.gov.uk/)
- **Color:** [Colour](https://design-system.service.gov.uk/styles/colour/)
- **Typography:** [Type scale](https://design-system.service.gov.uk/styles/type-scale/) and [The new type scale](https://design-system.service.gov.uk/get-started/new-type-scale/)
- **Spacing, layout, and grids:** [Spacing](https://design-system.service.gov.uk/styles/spacing/) and [Layout](https://design-system.service.gov.uk/styles/layout/)
- **Accessibility:** [Accessibility strategy](https://design-system.service.gov.uk/accessibility/accessibility-strategy/)
- **Focus:** [Focus states](https://design-system.service.gov.uk/get-started/focus-states/) (the yellow focus style)
- **Buttons:** [Button](https://design-system.service.gov.uk/components/button/)
- **Checkboxes:** [Checkboxes](https://design-system.service.gov.uk/components/checkboxes/)
- **Radio buttons:** [Radios](https://design-system.service.gov.uk/components/radios/)
- **Text fields:** [Text input](https://design-system.service.gov.uk/components/text-input/)
- **Text areas:** [Textarea](https://design-system.service.gov.uk/components/textarea/)
- **Forms and errors:** [Question pages](https://design-system.service.gov.uk/patterns/question-pages) (where "mark optional fields, no asterisks" comes from), [Error message](https://design-system.service.gov.uk/components/error-message/), and [Error summary](https://design-system.service.gov.uk/components/error-summary/)
- **Separators:** [Section break](https://design-system.service.gov.uk/styles/section-break/) (an <hr> whose margin is the point; the line is optional)
- **Badges:** [Tag](https://design-system.service.gov.uk/components/tag/) (never a link or button; made lighter because tags were mistaken for buttons)
- **Selects:** [Select](https://design-system.service.gov.uk/components/select/)
- **Number fields:** [Text input](https://design-system.service.gov.uk/components/text-input/)
- **Date pickers:** [Date input](https://design-system.service.gov.uk/components/date-input/) and [Dates pattern](https://design-system.service.gov.uk/patterns/dates/)

### U.S. Web Design System

- **Getting started:** [Home](https://designsystem.digital.gov/) and [Settings](https://designsystem.digital.gov/documentation/settings/)
- **Design tokens:** [Color tokens](https://designsystem.digital.gov/design-tokens/color/overview/) and [Spacing units](https://designsystem.digital.gov/design-tokens/spacing-units/)
- **Color:** [Color tokens](https://designsystem.digital.gov/design-tokens/color/overview/)
- **Typography:** [Typography](https://designsystem.digital.gov/components/typography/)
- **Spacing, layout, and grids:** [Spacing units](https://designsystem.digital.gov/design-tokens/spacing-units/) and [Layout grid](https://designsystem.digital.gov/utilities/layout-grid/)
- **Accessibility:** [Button accessibility tests](https://designsystem.digital.gov/components/button/accessibility-tests/) (an example of publishing how each component was tested)
- **Focus:** [Outline](https://designsystem.digital.gov/utilities/outline/) (the 4px focus outline)
- **Buttons:** [Button](https://designsystem.digital.gov/components/button/)
- **Checkboxes:** [Checkbox](https://designsystem.digital.gov/components/checkbox/)
- **Radio buttons:** [Radio buttons](https://designsystem.digital.gov/components/radio-buttons/)
- **Segmented controls:** [Button group](https://designsystem.digital.gov/components/button-group/) (its segmented variant)
- **Text fields:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)
- **Text areas:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)
- **Forms and errors:** [Form](https://designsystem.digital.gov/components/form/)
- **Dialogs:** [Modal](https://designsystem.digital.gov/components/modal/)
- **Tooltips:** [Tooltip](https://designsystem.digital.gov/components/tooltip/)
- **Badges:** [Tag](https://designsystem.digital.gov/components/tag/) (static, and announced with a live region when loaded after the page)
- **Selects:** [Select](https://designsystem.digital.gov/components/select/) and [Combo box](https://designsystem.digital.gov/components/combo-box/)
- **Number fields:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)
- **Date pickers:** [Date picker](https://designsystem.digital.gov/components/date-picker/) and [Memorable date](https://designsystem.digital.gov/components/memorable-date/)

## Design systems, by topic

The same links as the by-system section, grouped so each topic can be compared across systems. A system missing from a topic has no page for it.

### Getting started

- **Apple Human Interface Guidelines:** [Home](https://developer.apple.com/design/human-interface-guidelines/)
- **Material Design 3 (Google):** [Home](https://m3.material.io/) and [Structure](https://m3.material.io/foundations/designing/structure)
- **GitHub Primer:** [Home](https://primer.style/) and [Product foundations](https://primer.style/product)
- **Atlassian Design System:** [Home](https://atlassian.design/) and [Components](https://atlassian.design/components)
- **IBM Carbon:** [Home](https://carbondesignsystem.com/)
- **Microsoft Fluent 2:** [Home](https://fluent2.microsoft.design/) and [Getting started](https://fluent2.microsoft.design/get-started/design)
- **Shopify Polaris:** [Polaris React](https://polaris-react.shopify.com/), [Polaris web components](https://shopify.dev/docs/api/polaris) (the newer version), and [App design guidelines](https://shopify.dev/docs/apps/design)
- **GOV.UK Design System:** [Home](https://design-system.service.gov.uk/)
- **U.S. Web Design System:** [Home](https://designsystem.digital.gov/) and [Settings](https://designsystem.digital.gov/documentation/settings/)

### Design tokens

- **GitHub Primer:** [Primitives](https://primer.style/product/primitives) and [Token names](https://primer.style/product/primitives/token-names/)
- **Atlassian Design System:** [Design tokens](https://atlassian.design/foundations/tokens)
- **Microsoft Fluent 2:** [Design tokens](https://fluent2.microsoft.design/design-tokens)
- **Shopify Polaris:** [Space](https://polaris-react.shopify.com/tokens/space), [Font](https://polaris-react.shopify.com/tokens/font), [Text](https://polaris-react.shopify.com/tokens/text), [Breakpoints](https://polaris-react.shopify.com/tokens/breakpoints), [Border](https://polaris-react.shopify.com/tokens/border), [Shadow](https://polaris-react.shopify.com/tokens/shadow), and [Motion](https://polaris-react.shopify.com/tokens/motion)
- **U.S. Web Design System:** [Color tokens](https://designsystem.digital.gov/design-tokens/color/overview/) and [Spacing units](https://designsystem.digital.gov/design-tokens/spacing-units/)

### Color

- **Apple Human Interface Guidelines:** [Dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- **GitHub Primer:** [Color usage](https://primer.style/product/getting-started/foundations/color-usage/) and [Color primitives](https://primer.style/product/primitives/color/)
- **Atlassian Design System:** [Color](https://atlassian.design/foundations/color) and [Color (new)](https://atlassian.design/foundations/color-new)
- **IBM Carbon:** [Color](https://carbondesignsystem.com/elements/color/overview/) and [Themes](https://carbondesignsystem.com/elements/themes/overview/)
- **Microsoft Fluent 2:** [Color](https://fluent2.microsoft.design/color)
- **Shopify Polaris:** [Visual design](https://shopify.dev/docs/apps/design/visual-design)
- **GOV.UK Design System:** [Colour](https://design-system.service.gov.uk/styles/colour/)
- **U.S. Web Design System:** [Color tokens](https://designsystem.digital.gov/design-tokens/color/overview/)

### Typography

- **Apple Human Interface Guidelines:** [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- **Material Design 3 (Google):** [Typography (Android)](https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md)
- **GitHub Primer:** [Typography](https://primer.style/product/getting-started/foundations/typography/) and [Typography primitives](https://primer.style/product/primitives/typography/)
- **Atlassian Design System:** [Typography](https://atlassian.design/foundations/typography)
- **IBM Carbon:** [Typography](https://carbondesignsystem.com/elements/typography/overview/) and [Type sets](https://carbondesignsystem.com/elements/typography/type-sets/)
- **Microsoft Fluent 2:** [Typography](https://fluent2.microsoft.design/typography)
- **Shopify Polaris:** [Font tokens](https://polaris-react.shopify.com/tokens/font) and [Text tokens](https://polaris-react.shopify.com/tokens/text)
- **GOV.UK Design System:** [Type scale](https://design-system.service.gov.uk/styles/type-scale/) and [The new type scale](https://design-system.service.gov.uk/get-started/new-type-scale/)
- **U.S. Web Design System:** [Typography](https://designsystem.digital.gov/components/typography/)

### Spacing, layout, and grids

- **Apple Human Interface Guidelines:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **Material Design 3 (Google):** [Window size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes) (material's breakpoints) and [Window size classes (Android)](https://developer.android.com/guide/topics/ui/layout/window-size-classes)
- **GitHub Primer:** [Layout](https://primer.style/product/getting-started/foundations/layout/), [Responsive](https://primer.style/product/getting-started/foundations/responsive/), and [Size primitives](https://primer.style/product/primitives/size/)
- **Atlassian Design System:** [Spacing](https://atlassian.design/foundations/spacing) and [Grid](https://atlassian.design/foundations/grid)
- **IBM Carbon:** [Spacing](https://carbondesignsystem.com/elements/spacing/overview/) and [2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/)
- **Microsoft Fluent 2:** [Layout](https://fluent2.microsoft.design/layout)
- **Shopify Polaris:** [Space tokens](https://polaris-react.shopify.com/tokens/space), [Breakpoint tokens](https://polaris-react.shopify.com/tokens/breakpoints), and [Layout](https://shopify.dev/docs/apps/design/layout)
- **GOV.UK Design System:** [Spacing](https://design-system.service.gov.uk/styles/spacing/) and [Layout](https://design-system.service.gov.uk/styles/layout/)
- **U.S. Web Design System:** [Spacing units](https://designsystem.digital.gov/design-tokens/spacing-units/) and [Layout grid](https://designsystem.digital.gov/utilities/layout-grid/)

### Shape and elevation

- **Atlassian Design System:** [Radius](https://atlassian.design/foundations/radius), [Border](https://atlassian.design/foundations/border), and [Elevation](https://atlassian.design/foundations/elevation)
- **Microsoft Fluent 2:** [Shapes](https://fluent2.microsoft.design/shapes) and [Elevation](https://fluent2.microsoft.design/elevation)
- **Shopify Polaris:** [Border tokens](https://polaris-react.shopify.com/tokens/border) and [Shadow tokens](https://polaris-react.shopify.com/tokens/shadow)

### Motion

- **Apple Human Interface Guidelines:** [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- **Material Design 3 (Google):** [Motion (Android)](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- **Atlassian Design System:** [Motion](https://atlassian.design/foundations/motion) and [Applying motion](https://atlassian.design/foundations/motion/applying-motion)
- **IBM Carbon:** [Motion](https://carbondesignsystem.com/elements/motion/overview/)
- **Microsoft Fluent 2:** [Motion](https://fluent2.microsoft.design/motion)
- **Shopify Polaris:** [Motion tokens](https://polaris-react.shopify.com/tokens/motion)

### Icons

- **Apple Human Interface Guidelines:** [Icons](https://developer.apple.com/design/human-interface-guidelines/icons) and [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)

### Writing and content

- **GitHub Primer:** [Content](https://primer.style/product/getting-started/foundations/content/)
- **Atlassian Design System:** [Content](https://atlassian.design/foundations/content), [Voice and tone](https://atlassian.design/foundations/content/voice-tone), [Language and grammar](https://atlassian.design/foundations/content/language-and-grammar), and [Designing messages](https://atlassian.design/foundations/content/designing-messages)
- **IBM Carbon:** [Writing style](https://carbondesignsystem.com/guidelines/content/writing-style/)
- **Microsoft Fluent 2:** [Content design](https://fluent2.microsoft.design/content-design)
- **Shopify Polaris:** [Grammar and mechanics](https://polaris-react.shopify.com/content/grammar-and-mechanics), [Actionable language](https://polaris-react.shopify.com/content/actionable-language), and [Error messages](https://polaris-react.shopify.com/content/error-messages)

### Accessibility

- **Apple Human Interface Guidelines:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **GitHub Primer:** [Accessibility](https://primer.style/accessibility), [Color considerations](https://primer.style/accessibility/design-guidance/color-considerations/), [Focus management](https://primer.style/accessibility/design-guidance/focus-management/), [Links and buttons](https://primer.style/accessibility/design-guidance/links-and-buttons/), [Motion and animation](https://primer.style/accessibility/design-guidance/motion-and-animation/), [Text resize and spacing](https://primer.style/accessibility/design-guidance/text-resize-and-spacing/), and [Mobile checklist](https://primer.style/accessibility/tools-and-resources/checklists/mobile-checklist/)
- **Atlassian Design System:** [Accessibility](https://atlassian.design/foundations/accessibility)
- **IBM Carbon:** [Accessibility](https://carbondesignsystem.com/guidelines/accessibility/overview/)
- **Microsoft Fluent 2:** [Accessibility](https://fluent2.microsoft.design/accessibility)
- **Shopify Polaris:** [Accessibility](https://polaris-react.shopify.com/foundations/accessibility) and [App accessibility](https://shopify.dev/docs/apps/build/accessibility)
- **GOV.UK Design System:** [Accessibility strategy](https://design-system.service.gov.uk/accessibility/accessibility-strategy/)
- **U.S. Web Design System:** [Button accessibility tests](https://designsystem.digital.gov/components/button/accessibility-tests/) (an example of publishing how each component was tested)

### Focus

- **Apple Human Interface Guidelines:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
- **Atlassian Design System:** [Focus ring](https://atlassian.design/components/focus-ring/usage) and [Focusable](https://atlassian.design/components/primitives/focusable)
- **GOV.UK Design System:** [Focus states](https://design-system.service.gov.uk/get-started/focus-states/) (the yellow focus style)
- **U.S. Web Design System:** [Outline](https://designsystem.digital.gov/utilities/outline/) (the 4px focus outline)

### Platforms and input

- **Apple Human Interface Guidelines:** [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices) and [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos) (where the 28pt Mac target size comes from)

## Components, by type

Each system's page for the same kind of component. The names differ: Atlassian's "toggle" is a switch, and Carbon's "content switcher" is a segmented control.

### Buttons

- **Apple Human Interface Guidelines:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- **Material Design 3 (Google):** [Buttons (Android)](https://github.com/material-components/material-components-android/blob/master/docs/components/Button.md)
- **GitHub Primer:** [Button](https://primer.style/product/components/button/) and [Button group](https://primer.style/product/components/button-group)
- **Atlassian Design System:** [Button usage](https://atlassian.design/components/button/usage), [Button examples](https://atlassian.design/components/button/examples), [Evolving buttons and links](https://atlassian.design/whats-new/evolving-button-and-links), and [Button (Forge UI Kit)](https://developer.atlassian.com/platform/forge/ui-kit/components/button) (default, primary, subtle, warning, and danger)
- **IBM Carbon:** [Button usage](https://carbondesignsystem.com/components/button/usage/) (emphasis levels, one primary per page, and danger buttons) and [Button style](https://carbondesignsystem.com/components/button/style/)
- **Microsoft Fluent 2:** [Button (web)](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Button (iOS)](https://fluent2.microsoft.design/components/ios/core/button/usage), and [Button (Android)](https://fluent2.microsoft.design/components/android/core/button/usage) (how one system sizes a control per platform)
- **Shopify Polaris:** [Button](https://polaris-react.shopify.com/components/actions/button)
- **GOV.UK Design System:** [Button](https://design-system.service.gov.uk/components/button/)
- **U.S. Web Design System:** [Button](https://designsystem.digital.gov/components/button/)

### Checkboxes

- **Apple Human Interface Guidelines:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Material Design 3 (Google):** [Checkbox](https://m3.material.io/components/checkbox/guidelines)
- **GitHub Primer:** [Checkbox](https://primer.style/product/components/checkbox)
- **Atlassian Design System:** [Checkbox](https://atlassian.design/components/checkbox/usage)
- **IBM Carbon:** [Checkbox](https://www.carbondesignsystem.com/building-blocks/core/components/checkbox/guidelines)
- **Microsoft Fluent 2:** [Checkbox](https://fluent2.microsoft.design/components/web/react/core/checkbox/usage)
- **Shopify Polaris:** [Checkbox (web components)](https://shopify.dev/docs/api/app-home/latest/web-components/forms/checkbox) (the React page now redirects here)
- **GOV.UK Design System:** [Checkboxes](https://design-system.service.gov.uk/components/checkboxes/)
- **U.S. Web Design System:** [Checkbox](https://designsystem.digital.gov/components/checkbox/)

### Radio buttons

- **Apple Human Interface Guidelines:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Material Design 3 (Google):** [Radio button](https://m3.material.io/components/radio-button/guidelines)
- **GitHub Primer:** [RadioGroup](https://primer.style/product/components/radio-group)
- **Atlassian Design System:** [Radio](https://atlassian.design/components/radio/usage)
- **IBM Carbon:** [Radio button](https://www.carbondesignsystem.com/building-blocks/core/components/radio-button)
- **Microsoft Fluent 2:** [Radio group](https://fluent2.microsoft.design/components/web/react/core/radiogroup/usage)
- **Shopify Polaris:** [Radio button](https://polaris-react.shopify.com/components/selection-and-input/radio-button) and [Choice list](https://polaris-react.shopify.com/components/selection-and-input/choice-list)
- **GOV.UK Design System:** [Radios](https://design-system.service.gov.uk/components/radios/)
- **U.S. Web Design System:** [Radio buttons](https://designsystem.digital.gov/components/radio-buttons/)

### Switches

- **Apple Human Interface Guidelines:** [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) (switches, plus checkboxes and radio buttons in its macOS section)
- **Material Design 3 (Google):** [Switch](https://m3.material.io/components/switch/guidelines)
- **GitHub Primer:** [ToggleSwitch](https://primer.style/product/components/toggle-switch)
- **Atlassian Design System:** [Toggle](https://atlassian.design/components/toggle/usage)
- **IBM Carbon:** [Toggle](https://www.carbondesignsystem.com/building-blocks/core/components/toggle)
- **Microsoft Fluent 2:** [Switch](https://fluent2.microsoft.design/components/web/react/core/switch/usage)

### Segmented controls

- **Apple Human Interface Guidelines:** [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)
- **Material Design 3 (Google):** [Segmented buttons](https://m3.material.io/components/segmented-buttons/overview) and [Button groups](https://m3.material.io/components/button-groups/overview) (the newer connected button group)
- **GitHub Primer:** [SegmentedControl](https://primer.style/product/components/segmented-control)
- **IBM Carbon:** [Content switcher](https://www.carbondesignsystem.com/building-blocks/core/components/content-switcher)
- **Microsoft Fluent 2:** [Segmented control (iOS)](https://fluent2.microsoft.design/components/ios/core/segmentedcontrol/usage) (IOS only; the web has none)
- **Shopify Polaris:** [Button group](https://polaris-react.shopify.com/components/actions/button-group) (its segmented variant)
- **U.S. Web Design System:** [Button group](https://designsystem.digital.gov/components/button-group/) (its segmented variant)

### Text fields

- **Apple Human Interface Guidelines:** [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
- **Material Design 3 (Google):** [Text fields](https://m3.material.io/components/text-fields/guidelines) (multi-line text is part of text fields; there's no separate text area)
- **GitHub Primer:** [TextInput](https://primer.style/product/components/text-input)
- **Atlassian Design System:** [Text field usage](https://atlassian.design/components/textfield/usage) and [Text field examples](https://atlassian.design/components/textfield/examples)
- **IBM Carbon:** [Text input](https://www.carbondesignsystem.com/building-blocks/core/components/text-input) (text areas are a section of this page) and [Text input style](https://carbondesignsystem.com/components/text-input/style/)
- **Microsoft Fluent 2:** [Input](https://fluent2.microsoft.design/components/web/react/core/input/usage) and [Field](https://fluent2.microsoft.design/components/web/react/core/field/usage)
- **Shopify Polaris:** [Text field](https://polaris-react.shopify.com/components/selection-and-input/text-field) (for a text area, use its multiline option)
- **GOV.UK Design System:** [Text input](https://design-system.service.gov.uk/components/text-input/)
- **U.S. Web Design System:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)

### Text areas

- **Apple Human Interface Guidelines:** [Text views](https://developer.apple.com/design/human-interface-guidelines/text-views)
- **Material Design 3 (Google):** [Text fields](https://m3.material.io/components/text-fields/guidelines) (multi-line text is part of text fields; there's no separate text area)
- **GitHub Primer:** [Textarea](https://primer.style/product/components/textarea)
- **Atlassian Design System:** [Text area](https://atlassian.design/components/textarea/usage)
- **IBM Carbon:** [Text input](https://www.carbondesignsystem.com/building-blocks/core/components/text-input) (text areas are a section of this page)
- **Microsoft Fluent 2:** [Textarea](https://fluent2.microsoft.design/components/web/react/core/textarea/usage)
- **Shopify Polaris:** [Text field](https://polaris-react.shopify.com/components/selection-and-input/text-field) (for a text area, use its multiline option)
- **GOV.UK Design System:** [Textarea](https://design-system.service.gov.uk/components/textarea/)
- **U.S. Web Design System:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)

### Forms and errors

- **GitHub Primer:** [Forms](https://primer.style/product/ui-patterns/forms/)
- **Atlassian Design System:** [Form](https://atlassian.design/components/form/usage)
- **IBM Carbon:** [Forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/)
- **GOV.UK Design System:** [Question pages](https://design-system.service.gov.uk/patterns/question-pages) (where "mark optional fields, no asterisks" comes from), [Error message](https://design-system.service.gov.uk/components/error-message/), and [Error summary](https://design-system.service.gov.uk/components/error-summary/)
- **U.S. Web Design System:** [Form](https://designsystem.digital.gov/components/form/)

### Dialogs

- **Apple Human Interface Guidelines:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), and [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- **Material Design 3 (Google):** [Dialogs](https://m3.material.io/components/dialogs/guidelines)
- **GitHub Primer:** [Dialog](https://primer.style/product/components/dialog)
- **Atlassian Design System:** [Modal dialog](https://atlassian.design/components/modal-dialog/usage)
- **IBM Carbon:** [Modal](https://www.carbondesignsystem.com/building-blocks/core/components/modal)
- **Microsoft Fluent 2:** [Dialog](https://fluent2.microsoft.design/components/web/react/core/dialog/usage)
- **U.S. Web Design System:** [Modal](https://designsystem.digital.gov/components/modal/)

### Tooltips

- **Apple Human Interface Guidelines:** [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help) (help tags; there's no tooltip page)
- **Material Design 3 (Google):** [Tooltips](https://m3.material.io/components/tooltips/guidelines)
- **GitHub Primer:** [Tooltip](https://primer.style/product/components/tooltip)
- **Atlassian Design System:** [Tooltip](https://atlassian.design/components/tooltip/usage/)
- **IBM Carbon:** [Tooltip](https://www.carbondesignsystem.com/building-blocks/core/components/tooltip)
- **Microsoft Fluent 2:** [Tooltip](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage)
- **Shopify Polaris:** [Tooltip](https://polaris-react.shopify.com/components/overlays/tooltip)
- **U.S. Web Design System:** [Tooltip](https://designsystem.digital.gov/components/tooltip/)

### Navigation

- **Apple Human Interface Guidelines:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)

### Loading indicators

- **Apple Human Interface Guidelines:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), [Loading](https://developer.apple.com/design/human-interface-guidelines/loading) (show placeholder text, graphics, or animations as content loads; a progress indicator for longer waits), and [redacted(reason:) (SwiftUI)](https://developer.apple.com/documentation/swiftui/view/redacted(reason:)) (apple's skeleton: the real view, masked into placeholder shapes of the same size)
- **Material Design 3 (Google):** [Progress indicators](https://m3.material.io/components/progress-indicators/guidelines) and [Progress (material-web)](https://github.com/material-components/material-web/blob/main/docs/components/progress.md) (the web component's sizes and labelling)
- **GitHub Primer:** [Spinner](https://primer.style/product/components/spinner/), [Spinner accessibility](https://primer.style/product/components/spinner/accessibility) (no built-in announcement: the page adds its own live region), [Loading](https://primer.style/product/ui-patterns/loading/) (which loading indicator for how long a wait: nothing under one second), [SkeletonText](https://primer.style/product/components/skeleton-text) (lines that follow the type styles, the last at 65%), and [ProgressBar](https://primer.style/product/components/progress-bar/)
- **Atlassian Design System:** [Spinner](https://atlassian.design/components/spinner/usage), [Skeleton](https://atlassian.design/components/skeleton/usage) (one shape with a width, height, and radius, and an optional shimmer), and [Progress bar](https://atlassian.design/components/progress-bar/usage)
- **IBM Carbon:** [Loading](https://carbondesignsystem.com/components/loading/usage/), [Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/), [Loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/) (skeletons only on containers and data, never on toasts, menus, or modals), [Progress bar](https://carbondesignsystem.com/components/progress-bar/usage/) (under 5 seconds, use a loading spinner instead), and [Progress bar accessibility](https://carbondesignsystem.com/components/progress-bar/accessibility/) (announces its helper text in a polite live region)
- **Microsoft Fluent 2:** [Spinner](https://fluent2.microsoft.design/components/web/react/core/spinner/usage), [Spinner source](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-spinner/library/src/components/Spinner) (sizes, role, and delay, which the usage page doesn't list), [Skeleton](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-skeleton/stories/src/Skeleton) (an area plus shapes, like Sherbet's; announces with aria-busy), and [ProgressBar](https://fluent2.microsoft.design/components/web/react/core/progressbar/usage)
- **Shopify Polaris:** [Spinner](https://shopify.dev/docs/api/app-home/polaris-web-components/feedback-and-status-indicators/spinner) and [Skeleton body text](https://polaris.shopify.com/components/feedback-indicators/skeleton-body-text) (match the number of lines; the last line is shorter)

### Separators

- **Apple Human Interface Guidelines:** [Divider (SwiftUI)](https://developer.apple.com/documentation/swiftui/divider) (no options: it runs across a stack, so it turns vertical inside a row)
- **Material Design 3 (Google):** [Divider (material-web)](https://github.com/material-components/material-web/blob/main/docs/components/divider.md) (inset variants; decorative unless you add role="separator")
- **GitHub Primer:** [ActionList dividers](https://primer.style/product/components/action-list/) (primer has no standalone divider; ActionList's is hidden from screen readers)
- **Atlassian Design System:** [Menu sections with separators](https://atlassian.design/components/menu/code) (no standalone divider: a menu Section's hasSeparator draws a border)
- **Microsoft Fluent 2:** [Divider](https://fluent2.microsoft.design/components/web/react/core/divider/usage) (vertical, four strengths, inset, and words in the middle. No built-in margin; hide a purely visual one with aria-hidden)
- **Shopify Polaris:** [Divider (web components)](https://shopify.dev/docs/api/app-home/polaris-web-components/layout-and-structure/divider) (whitespace often groups better than lines, and too many add clutter)
- **GOV.UK Design System:** [Section break](https://design-system.service.gov.uk/styles/section-break/) (an <hr> whose margin is the point; the line is optional)

### Badges

- **Apple Human Interface Guidelines:** [Notifications (badging)](https://developer.apple.com/design/human-interface-guidelines/notifications) (apple's badge is only the unread count on an app icon)
- **Material Design 3 (Google):** [Badges (MDC-Android)](https://github.com/material-components/material-components-android/blob/master/docs/components/BadgeDrawable.md) (material's badge is a count or dot on navigation and icons)
- **GitHub Primer:** [Label](https://primer.style/product/components/label/) (ten variants, and a warning not to rely on the variant's color alone)
- **Atlassian Design System:** [Lozenge](https://atlassian.design/components/lozenge/usage) (atlassian's status label (its Badge is a count): sentence case, never interactive)
- **IBM Carbon:** [Tag](https://carbondesignsystem.com/components/tag/usage/) (twelve colors, under 20 characters, and long text cut off with a tooltip)
- **Microsoft Fluent 2:** [Badge](https://fluent2.microsoft.design/components/web/react/core/badge/usage) (eight colors, four looks, six sizes, and an optional icon; CounterBadge for counts)
- **Shopify Polaris:** [Badge](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/feedback-indicators/badge.mdx) (one or two words, past tense; warning and critical only when really needed)
- **GOV.UK Design System:** [Tag](https://design-system.service.gov.uk/components/tag/) (never a link or button; made lighter because tags were mistaken for buttons)
- **U.S. Web Design System:** [Tag](https://designsystem.digital.gov/components/tag/) (static, and announced with a live region when loaded after the page)

### Meters and progress bars

- **Apple Human Interface Guidelines:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) and [Gauges](https://developer.apple.com/design/human-interface-guidelines/gauges) (A value within a range, with its current value and both ends labelled)
- **Material Design 3 (Google):** [Progress indicators](https://m3.material.io/components/progress-indicators/guidelines)
- **GitHub Primer:** [ProgressBar](https://primer.style/product/components/progress-bar/)
- **Atlassian Design System:** [Progress bar](https://atlassian.design/components/progress-bar/usage)
- **IBM Carbon:** [Progress bar](https://carbondesignsystem.com/components/progress-bar/usage/) (under 5 seconds, use a loading spinner instead) and [Progress bar accessibility](https://carbondesignsystem.com/components/progress-bar/accessibility/) (announces its helper text in a polite live region)
- **Microsoft Fluent 2:** [ProgressBar](https://fluent2.microsoft.design/components/web/react/core/progressbar/usage)

### Selects

- **Apple Human Interface Guidelines:** [Pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons) and [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons)
- **Material Design 3 (Google):** [Material Web select](https://material-web.dev/components/select/)
- **GitHub Primer:** [Select guidelines](https://primer.style/product/components/select/guidelines/) and [SelectPanel](https://primer.style/product/components/select-panel/)
- **Atlassian Design System:** [Components for LLMs (Select)](https://atlassian.design/llms-components.txt)
- **IBM Carbon:** [Select](https://carbondesignsystem.com/components/select/usage/) and [Dropdown](https://carbondesignsystem.com/components/dropdown/usage/)
- **Microsoft Fluent 2:** [Select](https://fluent2.microsoft.design/components/web/react/core/select/usage) and [Dropdown](https://fluent2.microsoft.design/components/web/react/core/dropdown/usage)
- **Shopify Polaris:** [Select (docs source)](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/selection-and-input/select.mdx)
- **GOV.UK Design System:** [Select](https://design-system.service.gov.uk/components/select/)
- **U.S. Web Design System:** [Select](https://designsystem.digital.gov/components/select/) and [Combo box](https://designsystem.digital.gov/components/combo-box/)

### Number fields

- **Apple Human Interface Guidelines:** [Steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)
- **Material Design 3 (Google):** [Text field](https://material-web.dev/components/text-field/) (material Web's text field, which takes type="number")
- **GitHub Primer:** [TextInput](https://primer.style/product/components/text-input)
- **Atlassian Design System:** [Text field usage](https://atlassian.design/components/textfield/usage)
- **IBM Carbon:** [Number input usage](https://carbondesignsystem.com/components/number-input/usage/)
- **Microsoft Fluent 2:** [Spin button usage](https://fluent2.microsoft.design/components/web/react/core/spin/usage)
- **Shopify Polaris:** [Number field](https://shopify.dev/docs/api/app-home/latest/web-components/forms/number-field)
- **GOV.UK Design System:** [Text input](https://design-system.service.gov.uk/components/text-input/)
- **U.S. Web Design System:** [Text input](https://designsystem.digital.gov/components/text-input/) (text areas are a section of this page)

### Date pickers

- **Apple Human Interface Guidelines:** [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)
- **Material Design 3 (Google):** [Date pickers guidelines](https://m3.material.io/components/date-pickers/guidelines) and [Date pickers accessibility](https://m3.material.io/components/date-pickers/accessibility)
- **GitHub Primer:** [DatePicker (internal)](https://primer.style/product/internal-components/date-picker/) (gitHub's own; not for use outside GitHub)
- **Atlassian Design System:** [Date picker usage](https://atlassian.design/components/datetime-picker/date-picker/usage) and [Date picker code](https://atlassian.design/components/datetime-picker/date-picker/code)
- **IBM Carbon:** [Date picker usage](https://carbondesignsystem.com/components/date-picker/usage/)
- **Microsoft Fluent 2:** [DatePicker (compat)](https://storybooks.fluentui.dev/react/iframe.html?viewMode=docs&id=compat-components-datepicker--docs)
- **Shopify Polaris:** [Date field](https://shopify.dev/docs/api/app-home/latest/web-components/forms/date-field)
- **GOV.UK Design System:** [Date input](https://design-system.service.gov.uk/components/date-input/) and [Dates pattern](https://design-system.service.gov.uk/patterns/dates/)
- **U.S. Web Design System:** [Date picker](https://designsystem.digital.gov/components/date-picker/) and [Memorable date](https://designsystem.digital.gov/components/memorable-date/)
