# Forms

Forms are where accessibility and clear writing matter most. These rules follow the patterns GOV.UK, Primer, Atlassian, Carbon, and Polaris have tested with real people.

## Labels and hints

- Every field has a visible label **above** it, left-aligned, in sentence case, with no colon. Keep labels short (1–3 words where possible).
- Hint text sits between the label and the field, in `small` and `ink-muted`: one short sentence, no period, no links. Link it to the field with `aria-describedby`.
- **Never use placeholder text as a label or for essential information.** It disappears on typing and often fails contrast.
- Group related fields (an address, a set of radios) in a `<fieldset>` with a `<legend>`.
- One column. Field order matches visual order.
- Size fields to their expected input: a postcode field is narrow, an address field is wide.
- Set `type`, `inputmode`, and `autocomplete` so browsers and phones can help.

## Required and optional fields

The big systems disagree here: GOV.UK marks optional fields and bans asterisks, USWDS, Fluent, and Atlassian use asterisks, and Carbon marks whichever is the minority. Sherbet:

- **Ask only for what you need.** Most fields should be required.
- **Mark optional fields** by adding "(optional)" to the label.
- **No asterisks.** They're color and symbol only, and many people don't know what they mean.
- The one exception is a group of checkboxes where at least one must be ticked: ARIA has no required state for groups, so say "(required)" in the group's label.
- Use the `required` attribute on required inputs so browsers and screen readers know.

## Validation

- **Validate when the form is submitted**, not while someone is typing (GOV.UK and Primer). After a failed submit, a field may re-check itself when the person leaves it.
- **Never disable the submit button** to show a form is incomplete. Let people submit and tell them what's missing (GOV.UK, Primer, and Atlassian).
- Never clear what someone typed, even if it's wrong.

## Errors

- **Inline error:** below the label and hint, directly above the field, in `danger` with an icon and the word "Error:" for screen readers (hidden visually). The field gets a `danger` border and `aria-invalid="true"`, and the message is linked with `aria-describedby`.
- **Error summary:** when a submit fails with **two or more errors**, show a summary at the top of the form, before the first heading inside it, titled "There is a problem." Each item links to its field. Move focus to the summary. For a single error, move focus to that field.
- Add "Error: " to the start of the page `<title>` while errors are showing.
- Write messages using the rules in **Voice and copy**: what went wrong and how to fix it, specific, no blame. The inline message and the summary use the same words.

## Buttons

- **One primary button per form,** labeled with what happens: "Send message," "Save changes," "Create account."
- On pages, buttons sit at the bottom, left-aligned with the fields. In dialogs, they sit at the bottom right with the primary button last.
- "Cancel" is a secondary or ghost button, never primary.
- Destructive actions use a confirmation step that names what will be lost.
- Prevent double submission by showing the button's loading state, not by disabling it.

## Phones

- Inputs and buttons are full width below `breakpoint-sm`.
- Inputs are at least 16px text (`body`), which also stops iPhones from zooming in on focus.
- Put the primary action at the bottom of long forms, where thumbs can reach.
