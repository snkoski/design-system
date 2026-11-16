# Choosing a date field

A **DatePicker** is for one date near today that people look up or plan: a start date, a deadline, an interview. People can type the date ("11/12/2026", "12 Nov 2026", "2026-11-12") or pick it from a calendar that opens from the button at the end of the field. When they leave the field, a date they typed is tidied into the locale's format ("Nov 12, 2026"), so they can see what was understood. The form gets a `yyyy-mm-dd` date, so time zones can't shift it. See **Industry standards** for how other systems handle dates.

## When not to use the calendar

- **Dates people know by heart,** such as a date of birth or a passport's expiry date, are faster to type than to find in a calendar, and GOV.UK, Material, Carbon, and USWDS all say not to use a calendar for them. Until there's a field for these (see "A field for memorable dates" in `docs/revisit.md`), use a DatePicker and say in the description that typing is fine.
- **A range of dates** is two DatePickers, labelled "Start date" and "End date", until there's a range picker.
- **Times** aren't part of it.

## Setting it up

- **Give an example date in the description,** in the format the field shows: "For example, Nov 27, 2026." Not in the placeholder, which disappears as people type.
- **Set `min` and `max`** when only some dates make sense, and say the range in the description ("Between Nov 3 and Nov 25, 2026."). Days outside them are struck through in the calendar.
- **Rule out other days with `isDateUnavailable`,** such as weekends, and say so in the description ("Weekdays only.").
- **Set `locale`** for people who write dates day first, or start the week on Monday: `import { enGB } from "design-system/date-locales"`. The field's own words ("Choose date", "Previous month") stay English.

## Checking the value

The value is a `yyyy-mm-dd` date once what's typed reads as one, `""` when the field is empty, and otherwise the text as typed, so the page can tell "empty" from "not a real date". The component never decides what's valid; it tells the page what it knows, and the page checks when and how it chooses:

- **`isDateValue(value)`**, exported next to the component, says whether a value is a real date: a `yyyy-mm-dd` day that exists. Use it rather than a pattern: "2026-11-31" has the shape of a date, and is kept as typed because November has 30 days.
- **`onValueChange`'s `details.isDate`** gives the same answer on every keystroke, for a page that re-checks as the value changes.

```ts
import { isDateValue } from "design-system";

function problemWith(start: string) {
  if (start === "") return "Enter a start date.";
  if (!isDateValue(start)) return "Enter a real date, like Nov 27, 2026.";
  if (start < "2026-11-03") return "Enter a date on or after Nov 3, 2026.";
}
```

Real dates compare as strings, so a range check is a plain `<` or `>`, as above. The messages:

- Empty, and required: "Enter a start date."
- Not a date: "Enter a real date, like Nov 27, 2026."
- Outside `min` and `max`, or a day `isDateUnavailable` rules out: a typed date is kept, so say what's wrong: "Enter a date between Nov 3 and Nov 25, 2026."

`required` only checks the field isn't empty: text that isn't a date passes it, so the page's own check has to catch that. As with every field, check when the form is submitted, then again each time the value changes (`onValueChange` is called on every keystroke).

## Form libraries

The field shows "Nov 12, 2026" while the form gets "2026-11-12", so a form library has to use the value, not the text field. Drive it as a controlled field, with `value` and `onValueChange`, such as react-hook-form's `Controller`:

```tsx
<Controller
  name="start"
  control={control}
  render={({ field, fieldState }) => (
    <DatePicker
      label="Start date"
      ref={field.ref}
      value={field.value ?? ""}
      onValueChange={field.onChange}
      onBlur={field.onBlur}
      invalid={fieldState.invalid}
      error={fieldState.error?.message}
    />
  )}
/>
```

`register("start")` doesn't work: it would store the shown text, not the date. The same goes for a NumberField.

## What it doesn't do

- **No month or year menus.** The arrows move a month at a time (Page Up and Page Down from the keyboard, with Shift for a year). For a date far from today, typing is quicker.
- **It needs JavaScript to submit what's typed.** Before the page's JavaScript runs, typing doesn't reach the date the form submits.
