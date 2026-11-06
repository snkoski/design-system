# Choosing a meter

A meter shows how much of something there is, out of a known amount: "Topics done, 12 of 20", "Storage used, 4.6 of 5 GB". It's a reading, like a fuel gauge. The words say the amount, and the bar shows it at a glance, so several meters are quick to compare.

## Meter or Progress

- **Meter:** an amount that's there now, which only changes when something else does: topics done, storage used, a profile's completeness, a goal for the week.
- **Progress:** a task that's under way and will finish on its own: an upload, an import, an export. It's a loading indicator; see "Choosing a loading indicator".

If the bar would fill up while people watch and then go away, it's Progress. If it stays on the page and means something, it's a Meter. Don't use a Meter for loading, or Progress for a measurement: screen readers announce them differently.

## Using a Meter

- **Say what it measures.** The `label` is short and plain: "Topics done", not "Progress". It names the meter for screen readers too.
- **Say the amount in words.** For a count or a quantity, set `valueText`: "12 of 20", "4.6 of 5 GB". Without it, the meter shows a percent ("60%"), which suits only amounts that are naturally a share, such as "Profile complete". The words are what screen readers read as its value.
- **Add a description when the amount needs explaining,** such as what it means or what to do about it: "Almost full. Delete old files to make room." It goes under the bar, and screen readers read it as the meter's description.
- **Color only for a status, and always with words.** A `tone` colors the fill: `success` for a goal met, `warning` for nearly full, `danger` for over a limit or used up. The words must say the same thing, in `valueText` or the description, because color never carries meaning alone. Most meters stay `neutral`.
- **Give it a width.** A meter is as wide as its container. In a `flex` row it shrinks to the width of its label and value: add `flex-1` or a width class (`w-64`).
- **Values outside the range** show at the nearest end: 25 of 20 fills the bar. Say the real amount in `valueText` ("25 of 20").

## Sizes

`md` (8px) is the default. `sm` (4px) is for tight spaces, such as a table cell or a card's footer. The text is the same size in both.

## Screen readers

A meter is announced as a meter (some screen readers say "progress bar" or "level indicator") with its label and its words: "Topics done, 12 of 20". It can't be focused, and changes to it aren't announced: it's read where it sits, like the text around it.
