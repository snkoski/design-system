# Choosing a button

Pick a variant by how much attention the action deserves, not by how it looks. Most design systems settle on the same three or four levels of emphasis; Sherbet has three. See **Industry standards** for how they line up.

| Variant | Emphasis | Use it for | Examples |
| --- | --- | --- | --- |
| `primary` | Highest | The one action the view exists for | "Send message," "Save changes," "Create account" |
| `secondary` | Medium | Every other action, including the alternative to the primary one | "Cancel," "Back," "Download résumé" |
| `ghost` | Lowest | Supporting actions that shouldn't compete: toolbars, table rows, menus, and a third action beside a pair | "Add tag," "Edit," "Show more" |

## One primary per view

- **A view has at most one primary button.** A dialog or side panel opened from the view may have its own, because it's a separate task.
- **Pages for reading, such as a portfolio piece or an article, may have no primary button at all.** Use secondary and ghost buttons there.
- If two actions both feel primary, the view is doing two jobs. Split it, or decide which one matters more.
- "Cancel" is never primary. It's secondary beside a primary button, or ghost when there are already two other buttons.

## Pairs and groups

- **Two actions:** primary and secondary ("Save changes" and "Cancel").
- **Three actions:** primary, secondary, and ghost. More than three is a sign some belong in a menu.
- Where they sit (left-aligned under a form, bottom right in a dialog with the primary button last) is in **Forms**.
- Keep a group the same size. Don't mix `sm` and `md` in one row.

## Size

- `md` is the default and the right choice almost everywhere.
- `sm` is for dense places: toolbars, table rows, and tags. It still gets a full `target-min` hit area.
- `lg` is for a hero call to action, once per page at most.

## Shape

- `rectangle` is the default and the right choice for most buttons: four straight edges with `radius-sm` corners. It sits comfortably beside text fields, cards, and panels.
- `pill` is fully rounded. It's the softer choice, for a button that should stand apart from the forms and panels around it, such as a hero call to action.
- Keep a group the same shape, as with size. Don't put a pill beside a rectangle.
- An icon-only button takes the same shape: a rounded square, or a circle as a pill.

## Button or link

- **A button does something:** sends, saves, opens a dialog, or changes what's on screen. Use `Button`.
- **A link goes somewhere:** another page, or a file to download. Use `ButtonLink` when a link needs to look like a button. It's still an `<a>`, so it opens in a new tab, can be copied, and is announced as a link. In an app with a router, wrap it once so it navigates without reloading the page: `const RouterButtonLink = createLink(ButtonLink)` with TanStack Router.
- Never use a button to navigate or a link to submit.

## Labels and icons

- Labels follow **Voice and copy**: start with a verb, say exactly what happens, and name the thing ("Delete project," not "Delete").
- Keep labels short enough to fit on one line. When one doesn't fit, it wraps onto more lines and the button grows taller. It's never cut off with an ellipsis: a cut-off label hides what the button does, and fails WCAG at 200% text and on narrow screens.
- Icons are decoration: the label does the talking. Put the icon before the label for an action ("Download résumé") and after it for moving forward ("Next project").
- Icon-only buttons are for actions people already recognize from the icon alone, such as close, favorite, or more. They need an `aria-label`, and are usually `ghost` or `secondary`.

## States

- Show `loading` while an action runs, instead of disabling the button, so it stays focusable and can't be clicked twice.
- Avoid disabled buttons when you can: a disabled button can't say why it's disabled. Let people press it and explain what's missing.

## Destructive actions

A destructive action (one that deletes, removes, or loses something) is a `secondary` button with `tone="danger"`: red words, icon, and edge, filling pale red on hover. In a toolbar, a table row, or a menu, use `ghost` with `tone="danger"`.

- **The label names what will be lost:** "Delete project," not "Delete." The red is never the only sign.
- **Not on `primary`, not icon-only, and never on "Cancel".** The props type won't take it on a primary or icon-only button. A primary button keeps its neutral fill: the danger style has no red fill.
- Unless it can be undone, it opens a confirmation dialog that says what will happen. The dialog's final button repeats the label, also `secondary` with `tone="danger"`, and "Cancel" is `secondary`.
- Prefer undo over confirmation when you can offer it: "Project deleted," with an "Undo" button in the toast.

A filled red danger button, on `primary`, may come later if a page needs one; it would need `danger-hover` and `on-danger` tokens, and care in hot dog mode, whose brand is ketchup red.
