# Voice and copy

Sherbet sounds like a person who is good at their job and fun to work with: plain, warm, and a little weird, never cute at the reader's expense.

## Voice

- Write in first person ("I build…") on personal sites. On company and product sites, use "we" for the company and "you" for the reader.
- Address the reader as "you." Talk to them, not about "users."
- Short, plain sentences. Aim for a 7th to 8th grade reading level (the range GitHub and Atlassian target); long words and long sentences cost everyone attention.
- Humor goes in headlines, empty states, and asides. It never goes in error messages, warnings, legal text, payment flows, or anything a stressed person reads.
- No emoji as decoration or section markers.
- Example headline: "Strange ideas, carefully made." Example empty state: "Nothing here yet. The hot dogs are still grilling."

## Grammar and mechanics

- **Sentence case everywhere**: headings, buttons, labels, menu items, and tabs. Only the first word and proper nouns are capitalized. Uppercase only in `label` eyebrows. (Sentence case is the standard in Primer, Atlassian, Carbon, Polaris, and GOV.UK.)
- **Always use the Oxford comma**: "tangerine, peach, and mint." (Atlassian and Polaris do too.)
- **No periods** in buttons, labels, and headings. Descriptions, hints, errors, and other text that reads as a sentence end with one, even when there's only one sentence, so they stay consistent when a second sentence is added.
- **At most one exclamation mark per page**, and only for genuinely good news. Never in errors.
- **Numbers as numerals**: "3 projects," not "three projects." Use commas from 4 digits ("1,200"), an en dash for ranges ("5–10"), and avoid abbreviations like "12k" unless space forces it.
- **Dates and times**: "Oct 21, 2026" and "3:45 pm." Spell out the month when there is room ("October 21, 2026"). Use relative dates ("2 days ago") only for recent activity, with the full date available on hover and focus.
- Use contractions ("don't," "you're"). They read as human.

## Buttons and links

- **Start with a verb** that says exactly what happens: "Send message," "Save changes," "Download résumé."
- **No articles or punctuation**: "Add tag," not "Add a tag."
- Keep them to 1–3 words where possible.
- Avoid vague labels: "OK," "Yes," "Submit," "Click here," "Learn more" on its own. A link's text should make sense read out of context.
- Name the result, then confirm it: a "Send message" button leads to a "Message sent" toast.
- Destructive actions name the thing being destroyed: "Delete project," not "Delete."

## Error messages

Every error message answers two questions: **what went wrong, and how to fix it.**

- Be specific: "Enter an email address like name@example.com," not "Invalid email."
- Put the fix first, in the imperative: "Enter your name."
- Don't blame the reader, apologize repeatedly, or joke.
- Avoid "invalid," "error occurred," "oops," "forbidden," "please," and "sorry" (GOV.UK and Polaris ban most of these). One "sorry" is fine when something is our fault, like an outage.
- Never clear what the reader typed.
- The message next to the field and the one in an error summary use the same words.

## Empty, loading, and success states

- **Empty states** say what will appear here and how to add the first item. A little personality is welcome.
- **Loading text** says what's happening: "Loading projects…" not "Please wait."
- **Success messages** are short and confirm the result: "Changes saved." No exclamation mark needed.
