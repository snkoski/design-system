# Choosing a rating

A rating is a row of stars where someone gives one score on a short scale: how interested they are in a job, how good a recipe was. More stars is better, and each step means "a bit more" without needing words.

## Rating or something else

- **Rating:** one score on a scale where more is better, and the steps need no names. "Interest", "How much did you like it?"
- **RadioGroup:** when each answer needs words, such as how satisfied someone was ("Very satisfied" to "Very dissatisfied"), or the steps aren't "more is better". Stars can't say what 3 means; words can. GOV.UK's own feedback pages ask about satisfaction with radios in words.
- **SegmentedControl:** a short set of named options that isn't a scale ("List" or "Board").
- **NumberField:** an exact number, or a wide range ("Years of experience").
- **Showing an average** someone can't change, such as "4.3 out of 5 from 120 reviews", isn't a Rating. That needs a display with half stars and the number in words, which isn't built yet (see `docs/revisit.md`). A read-only Rating is for a person's own score in a form they can't change right now.

## Using a Rating

- **Name what's being rated.** The `label` is short and plain: "Interest", "Your rating". It names the stars for screen readers too, so each star is announced as "3 stars, 3 of 5".
- **Explain the scale when it isn't obvious,** in the `description`: "1 is not interested, 5 is very interested."
- **Keep to 5 stars,** unless there's a reason not to. `max` takes 3 to 10, but more stars are harder to tell apart, and on a phone each star is 44px wide: keep to 5 or fewer on pages used on phones, so the stars and Clear fit on one line on a 320px screen with the page's 16px gutters. Six need a screen about 360px wide.
- **Optional or required.** A rating is optional unless it's marked `required`; mark the optional ones "(optional)" in the label, as for any field (see Forms). Once a star is chosen, a Clear button after the stars empties an optional rating again. A required rating has no Clear button: it can be changed, but not emptied.
- **Errors.** A required rating with nothing chosen fails on submit. Set `invalid` and an `error` that says what to do: "Choose how interested you are." The empty stars' outlines turn red, and the message is above them.
- **The value is a number,** or `null` for none, and the form gets it as text: `interest=3`.

## How it looks and works

- **Filled stars** show the rating: the chosen star and every star before it fill in, turning from an outline into a solid shape. That change of shape, not only of color, is what shows the choice.
- **Hovering previews** what a click would do: the stars up to the pointer fill in and the rest empty, until the pointer leaves. It's the one hover effect in the system that covers up the current state, on purpose. There's no preview while a star has keyboard focus, so the arrow keys always show their own choice.
- **The keyboard:** Tab reaches the stars once, on the chosen star, then Clear. The arrow keys move between stars and choose them, wrapping from the last to the first. Enter or Space on Clear empties the rating and puts focus back on the stars.
- **Read-only** keeps every star at full strength, with "Read only" beside the label. **Disabled** dims the stars.

## Screen readers

A rating is announced as a radio group with its label, and each star as a radio button: "Interest, radio group. 3 stars, radio button, checked, 3 of 5." The label is heard twice on the way in ("Interest, group", then "Interest, radio group"), because the stars sit in their own radio group beside the Clear button. Clear is announced as "Clear rating, Interest, button".
