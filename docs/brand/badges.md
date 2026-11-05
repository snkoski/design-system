# Choosing a badge

A badge is a short label that says something about the item next to it: its status ("Offer", "Needs review"), its kind ("Remote"), or a count in words ("3 new"). It's plain text in a pill. Nothing about it can be pressed or focused.

## Badge, or something else

- **A badge** states a fact about an item: a status, a kind, or a count.
- **A button** does something. If clicking it should do anything, it's a Button, not a badge. GOV.UK made its tags lighter because people mistook them for buttons; a badge is never a link or a button.
- **A tag** is something someone added and can take away, such as a skill on a profile. Tag is planned (Phase 3 in the roadmap), built from Badge with a remove button.
- **A message** explains what happened and what to do next. If it needs a sentence, it's a message, not a badge.
- **A notification count** pinned to an icon (what Apple and Material call a badge) is a different component, not built yet.

## Tones

- **Neutral is the default, and most badges are neutral.** Different steps or kinds ("Applied", "Phone screen", "Onsite") are told apart by their words, not by color. A page where every badge has a different color has no colors that mean anything.
- **`success`** for a state that went well: "Offer", "Paid", "Published".
- **`warning`** for a state that needs someone's attention: "Needs review", "Expires soon".
- **`danger`** for a state where something went wrong or ended badly: "Rejected", "Failed", "Overdue".
- Use the same tone for the same status everywhere it appears, as GOV.UK asks.
- Color never carries the meaning alone. The words do, and an icon can help: a check for success, a triangle for warning, and an X for danger.

## Words

- One or two words, in sentence case, naming a state or a kind: "Needs review", not "Review" or "NEEDS REVIEW". Never an instruction: "Rejected", not "Reject".
- Name what a number counts: "3 new", not "3". A number alone means nothing to someone who can't see what it's next to.
- Keep it short enough to fit on one line. A badge wider than its container wraps rather than be cut off, and becomes a rounded rectangle, but it doesn't look good.

## Sizes

`md` is the default, beside body text and headings. `sm` is for tight spots, such as table rows, toolbars, and small text.

## Screen readers

- Screen readers read a badge's words like any other text, where they sit. The tone isn't announced, which is why the words must say it all.
- A badge isn't announced when it changes. If a status changes while someone is on the page (after they save, say), announce the change with a live region, such as the page's status message.
- A badge inside a link or button becomes part of its name: a link to an application with an "Offer" badge reads as "Frontend engineer Offer". Write the link text so that still makes sense.
