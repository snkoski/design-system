# Choosing from options

When people pick from a set of options, how many there are and whether they need to see them all decides the control. Every one of these submits with a form and works with the keyboard.

| Control | Use it for | Example |
| --- | --- | --- |
| `RadioGroup` | One choice from two to five options, when seeing them all side by side helps people choose | "How should we contact you?": Email, Phone, Post |
| `SegmentedControl` | One choice from two to five short options, usually switching a view or a setting right away | "Show": List, Board |
| `NativeSelect` | One choice from more options than fit comfortably on screen, or where space is tight | "Status": Saved, Applied, Interview, Offer, Rejected |
| `CheckboxGroup` | Any number of choices, including none | "Skills": TypeScript, React, CSS |
| `Switch` or `Checkbox` | One thing on or off | "Email me about new jobs" |

## Why radios before a select

- **A select hides its options.** People have to open it to see what they can pick, and some never do. Radios show every option at once, so they're faster to scan and compare.
- **A select is one click more** to open, and harder to use with a mouse that's not precise, or a phone keyboard covering half the screen.
- So use a select when the list is long (six or more options), when people already know what they want (a country, a month), or when the space is a toolbar or a table row.

## NativeSelect

- It's a real `<select>`: the browser draws the open list, phones show their own picker, and the keyboard works the way it does everywhere else.
- **Options are plain text.** An option can't show an icon, a color, or a second line. If they need one, that's a custom Select (not built yet).
- **Order the options** in the order people expect: by size, by time, or by the order they happen in ("Saved, Applied, Interview, Offer"). Use alphabetical order only when there's no natural one, like a list of countries.
- **Group a long list** under headings with `options` groups, rather than one long run.
- **A placeholder** ("Choose a status") makes people choose, instead of keeping whatever happens to be first. Write it as "Choose" plus what's being chosen, in sentence case, with no period or ellipsis. It's never a hint: anything people need to know goes in the description, which stays visible. Use one whenever there's no sensible default.
- **No placeholder** when one option is the right starting point, like "Newest first" for a sort order.
- An optional select with a placeholder can be cleared by choosing the placeholder again. A required one fails the form's check while the placeholder is chosen.
- It can't be read-only yet (browsers ignore `readonly` on a select). To show a value that can't be changed, use `disabled`, or show the value as text.
- To search a very long list (hundreds of options), people need a combobox, where they type to filter (not built yet).
