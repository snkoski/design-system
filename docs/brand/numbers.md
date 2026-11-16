# Choosing a number field

A **NumberField** is for amounts and quantities: a salary, a number of guests, a percentage, a length of time. Its value is a number, or nothing when the field is empty. People can type the number with separators and symbols ("$1,234.5"), and the field formats it when they leave ("$1,234.50"). The arrow keys and the two buttons at the end of the field step it up and down. The form gets the plain number ("1234.5"), never the formatted text. See **Industry standards** for how other systems handle numbers.

## When not to use it

- **Codes and IDs made of digits aren't amounts.** A verification code, a postcode, or an account, card, or phone number can start with 0, and must never step or get separators. Don't use a NumberField for them. What to use instead is still open: see "A text field for codes and IDs" in `docs/revisit.md`.
- **Picking from a few fixed values** is a choice, not a number: use a RadioGroup or a SegmentedControl.

## Setting it up

- **Set `step` to the change people usually make with one press:** 1 for a count, 1000 for a salary, 0.25 for hours. Shift with an arrow key moves ten steps; Alt moves one. `step` never limits what can be typed, so 85,500 is fine in a field that steps by 1,000. If a page needs whole steps, it checks that itself, like any other rule.
- **Put the unit in `format`**, not in the placeholder or after the field: `{ style: "currency", currency: "USD" }`, `{ style: "percent" }`, or `{ style: "unit", unit: "minute", unitDisplay: "long" }`. The value of a percent field is a fraction: 0.15 shows as "15%".
- **Say the range in the description** ("From 0 to 100.") so nobody has to discover it by pressing a button that stops.
- **Leave the steppers out with `steppers={false}`** when stepping makes no sense for the amount, such as a price paid. The arrow keys still step.
- **Leave room for the longest number you expect** beside the two steppers, which take twice the field's height at the end.
- **Set `locale`** when the page is rendered on the server, so the server and the browser format the number alike.

## Numbers outside the range

`min` and `max` stop the steppers and the arrow keys. A number typed outside them stays as typed, so nothing someone typed changes without them seeing it. Check it when the form is submitted, and show an error that gives the range: "Enter a number from 0 to 100." A form that doesn't check its own fields (with no `noValidate`) is stopped by the browser instead.

## What it doesn't do

- **The scroll wheel never changes the number**, so scrolling the page past a focused field can't change it by accident.
- **It doesn't take `pattern` or a maximum length.** They would check the formatted text, so "$1,000" would fail `pattern="[0-9]*"`. Use `min`, `max`, and `step`.
- **A read-only field has no steppers**, which couldn't be used. It shows "Read only" beside the label, like every other read-only field.
