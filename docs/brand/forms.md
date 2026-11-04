# Forms

Forms are where accessibility and clear writing matter most. These rules follow the patterns GOV.UK, Primer, Atlassian, Carbon, and Polaris have tested with real people.

## Labels and hints

- Every field has a visible label **above** it, left-aligned, in sentence case, with no colon. Keep labels short (1–3 words where possible).
- Hint text sits between the label and the field, in `small` and `ink-muted`: one short sentence, no links. Link it to the field with `aria-describedby`.
- **Never use placeholder text as a label or for essential information.** It disappears on typing and often fails contrast.
- Group related fields (an address, a set of radios) in a `<fieldset>` with a `<legend>`.
- One column. Field order matches visual order.
- Size fields to their expected input: a postcode field is narrow, an address field is wide.
- Set `type`, `inputmode`, and `autocomplete` so browsers and phones can help.
- To choose one option from a list, use a **NativeSelect**: a real `<select>`, which opens the phone's own picker and works with any form. Use **Select** only when the options need more than plain text, such as an icon or a second line. For two to five options that fit on screen, radios or a segmented control are often clearer than either.
- **Numbers** that are amounts or quantities (a salary, a count of minutes) use a **NumberField**, which can format as you type and step with the arrow keys. Don't use `type="number"`: the scroll wheel changes it by accident, it accepts "e", and it drops leading zeros. Codes and IDs that happen to be digits aren't numbers (see "A text field for codes and IDs" in `docs/revisit.md`).
- **Dates** use a **DatePicker**: a text field where the date can be typed, with a button that opens a calendar. It submits `yyyy-mm-dd`.

## Required and optional fields

The big systems disagree here: GOV.UK marks optional fields and bans asterisks, USWDS, Fluent, and Atlassian use asterisks, and Carbon marks whichever is the minority. Sherbet:

- **Ask only for what you need.** Most fields should be required.
- **Mark optional fields** by adding "(optional)" to the label.
- **No asterisks.** They're color and symbol only, and many people don't know what they mean.
- The one exception is a group of checkboxes where at least one must be ticked: ARIA has no required state for groups, so say "(required)" in the group's label.
- Use the `required` attribute on required inputs so browsers and screen readers know.

## Validation

- **Validate when the form is submitted**, not while someone is filling it in for the first time (GOV.UK and Primer).
- **After a failed submit, re-check each field as it changes**, so an error goes away as soon as it's fixed. This is the default in react-hook-form (`mode: "onSubmit"`, `reValidateMode: "onChange"`) and Base UI's `Field` (`validationMode="onSubmit"`). Without a library, it's one line in the field's `onChange`.
- **Don't re-check when a field loses focus.** Pressing the submit button is what takes focus away from the field. If the fix makes the error disappear then, everything below it moves up, the button moves out from under the pointer, and the click is lost.
- **Never disable the submit button** to show a form is incomplete. Let people submit and tell them what's missing (GOV.UK, Primer, and Atlassian).
- Never clear what someone typed, even if it's wrong.
- **The page validates, not the components.** Every form control takes `invalid` and `error` and leaves the timing above to the page. Components never depend on a form library, so they work with any library, or none.

## Errors

- **Inline error:** below the label and hint, directly above the field, in `danger` with a warning triangle and the word "Error:" for screen readers (hidden visually). It's read before the field, and a phone keyboard or autofill menu can't cover it. A single checkbox or switch, whose label sits beside it, shows its error above the whole row. The field gets a `danger` border and `aria-invalid="true"`, and the message is linked with `aria-describedby`. Every form control does this through the shared `FieldError`.
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

- Make inputs and buttons full width below `breakpoint-sm`. That's the page layout's job, not the component's: components never set their own width, so use Tailwind in the markup (`w-full`, then a width that fits the expected input from `sm:`).
- Inputs are at least 16px text (`body`), which also stops iPhones from zooming in on focus.
- Put the primary action at the bottom of long forms, where thumbs can reach.
