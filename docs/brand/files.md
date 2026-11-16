# Choosing a file field

A **FileInput** is for a file sent with a form: a résumé, a cover letter, a few writing samples. It's the browser's own file input, drawn as a field, so it works with the keyboard, screen readers, and any form, with or without JavaScript. Once a file is chosen, a Remove button at the end of the field empties it again, which the browser's input can't do on its own.

## When not to use it

- **Uploading as soon as a file is chosen.** FileInput holds files until the form is sent. A page that uploads right away shows a `Progress` for the whole batch ("Uploading 3 files…"), as Loading says.
- **Picking an image to crop or preview,** or choosing a folder. FileInput only chooses files.
- **Asking for a file you don't need.** Only ask for a file when the task can't be done without it (GOV.UK).

## Setting it up

- **Say the allowed kinds and the size limit in the description:** "PDF or Word document, up to 5 MB." Read before choosing, it saves a wasted upload.
- **Set `accept` to match** (`.pdf,.doc,.docx`, or `image/*`). It only filters the picker: someone can still choose another kind (most pickers can be switched to show every file) or drop one, so the page checks each file anyway.
- **Use `multiple` only when several files are really expected,** and say how many in the description ("Up to 3 PDFs, 5 MB each."). Some people don't know how to choose several in a file picker (USWDS). The field then says how many are chosen, not which.
- **`capture`** opens a phone's camera instead of its file list: `user` for the front camera, `environment` for the back. Use it only when a photo is the only thing that makes sense.
- **Label an optional field "(optional)",** as every field is.

## Checking the files

The page checks each file, never the component, and at the same time as every other field: when the form is submitted, then again as the field changes until the error is fixed (Forms). Read the files from `onFilesChange`, from the input through `ref.current.files`, or from the form's data on submit.

Write the error fix first, in the words of Voice and copy:

- Nothing chosen: "Choose a résumé to upload."
- The wrong kind: "Choose a PDF or Word document."
- Too big: "Choose a file smaller than 5 MB."
- Too many: "Choose up to 3 files."

GOV.UK words these as what went wrong ("The selected file must be smaller than 2MB"); Sherbet puts the fix first, as every other error does.

## Clearing it

People clear the field themselves with Remove. A page clears it with `form.reset()`, or by rendering it again with a new `key`. Setting `ref.current.value = ""` empties the input but tells nothing else, so Remove would stay.

## What the browser decides

The button's words and the status beside it are the browser's own, in the browser's language, and they differ: Chrome and Edge say "Choose File" and "No file chosen", Firefox "Browse…" and "No file selected.", and Safari "Choose File" and "no file selected". With several files, the status is a count ("2 files"). Long names are shortened by the browser. Safari puts its status a little closer to the button than the others (see `docs/revisit.md`).

FileInput was checked in Chrome's engine by its tests, and looked at once in Firefox and Safari's engines.
