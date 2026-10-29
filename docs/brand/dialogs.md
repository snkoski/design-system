# Choosing a dialog

A dialog interrupts. Everything behind it stops until it's dealt with, so use one only when the task really can't wait or happen on the page. See **Industry standards** for how other systems handle them.

| Component | Use it for | Closes with | Examples |
| --- | --- | --- | --- |
| `Dialog` | A short task that belongs to the page behind it | Escape, its close button, a click outside, or its own buttons | "Edit profile," "Rename project," "Invite people" |
| `AlertDialog` | A question that needs an answer before anything else happens | Escape or its own buttons only | "Delete project?" or "Discard changes?" |

## When not to use a dialog

- **For a message that doesn't need an answer.** "Saved" or "Something went wrong" belongs on the page, in a banner, or in a toast.
- **For a long task or one with several steps.** A form people need to come back to, or compare with something else, is a page. A dialog has no URL and can't be bookmarked or shared.
- **For a menu or a picker.** Those open next to what opened them and close when you look away: a popover or a menu.
- **When an undo would do.** Deleting something that can be restored doesn't need a confirmation. Do it, and offer "Undo."

GOV.UK's design system, built for services that everyone has to be able to use, has no modal dialog at all.

## Dialog or alert dialog

- **Dialog** is for doing something. People may change their mind at any point, so a click outside closes it, like Escape and the close button.
- **AlertDialog** is for deciding something. A stray click shouldn't decide for them, so a click outside does nothing, and there's no close button: they answer with a button that says what happens. Escape still works, as "Cancel."
- If closing would lose work (a half-filled form), don't make it an AlertDialog. Keep it a Dialog, and when it's asked to close with unsaved changes, open an AlertDialog over it: "Discard changes?"

## Writing one

- **The title says what the dialog is for**, in sentence case with no period: "Edit profile". In an AlertDialog it asks the question: "Delete project?"
- **The description, if there is one, says what's at stake** in a sentence: "Its files and history are deleted for everyone. This can't be undone."
- **The buttons say what happens.** The confirming button repeats the verb from the title ("Delete project"), never "OK" or "Yes." The other one is "Cancel."
- Keep it short. If the body needs headings, it probably wants to be a page.

## Buttons

- At the bottom right, with the primary button last and "Cancel" before it. A Dialog may have its own primary button even though the page behind has one (see **Choosing a button**).
- "Cancel" is a `DialogClose`, which closes the dialog. It's `secondary` by default, because Cancel is never primary.
- An action that finishes at once can be a `DialogClose` too, with an `onClick`: it runs, then the dialog closes.
- An action that takes time is a plain `Button` that shows `loading` while it runs. Control the dialog with `open` and `onOpenChange`, call `details.cancel()` in `onOpenChange` while it runs so Escape doesn't close it halfway, and close it when it's done. If it fails, keep the dialog open and say what went wrong inside it.
- An AlertDialog always has a "Cancel" `DialogClose`. It's the way out for people using a screen reader on a phone, who can't press Escape.

## Forms in a dialog

- Pass `onSubmit` and the body and buttons become one form: Enter in a field submits it, and so does a `type="submit"` button. The handler decides what happens next; the dialog doesn't close on its own.
- Validate the way **Forms** says, with the errors inside the dialog, next to their fields.
- Focus starts on the first field. Without fields, it starts on the first button, which is "Cancel": the least destructive answer. The one exception is a body that's too tall to fit with nothing inside it to Tab to, such as terms to read: focus starts on the body, so it can be scrolled with the keyboard straight away.

## Setting up the page

Dialogs open in a layer that Base UI adds at the end of `<body>`. Give the element your app renders into `isolation: isolate`, so anything the app stacks with `z-index` (a fixed header, a sticky toolbar) stays inside it, below the dialog. Without it, a fixed header can cover an open dialog.

## Sizes

| Size | Width | Use it for |
| --- | --- | --- |
| `sm` | 400px | Confirmations and AlertDialogs (their default) |
| `md` | 600px | Most forms (the default for Dialog) |
| `lg` | 800px | Tables and previews |

On a screen narrower than that, every size fills the width less a 16px gutter on each side. When the content is taller than the screen, the body scrolls and the title and buttons stay. On a very short screen (a phone turned sideways, or a page zoomed to 400%), the whole window scrolls instead, so the buttons can always be reached.
