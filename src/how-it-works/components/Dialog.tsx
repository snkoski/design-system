import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "../../components/Button";
import { AlertDialog, Dialog, DialogClose } from "../../components/Dialog";
import { Input } from "../../components/Input";
import "./dialog.css";

/* Live demos for Dialog's "How it works" page. They render the real components, so what they show is what ships. */

/**
 * A small page for a dialog to open in, instead of at the end of the docs page, so <Inspect> sees its HTML. The
 * dialog gets the element once it exists: a ref that's still empty when a dialog opens sends it to the end of <body>.
 */
function Page({ children }: { children: (container: HTMLDivElement) => ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className="how-dialog__page">
      {container && children(container)}
    </div>
  );
}

/** A Dialog with a trigger, a field, and Cancel and Save buttons */
export function ProfileDialog() {
  return (
    <Page>
      {(container) => (
        <Dialog
          container={container}
          trigger={<Button variant="secondary">Edit profile</Button>}
          title="Edit profile"
          description="Your name shows on your posts."
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <DialogClose variant="primary">Save profile</DialogClose>
            </>
          }
        >
          <Input label="Display name" defaultValue="Ada Lovelace" />
        </Dialog>
      )}
    </Page>
  );
}

/** A confirmation: an AlertDialog with Cancel and the action */
export function DeleteDialog() {
  return (
    <Page>
      {(container) => (
        <AlertDialog
          container={container}
          trigger={<Button variant="secondary">Delete project</Button>}
          title="Delete project?"
          description="Its files and history are deleted for everyone. This can't be undone."
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <DialogClose variant="primary">Delete project</DialogClose>
            </>
          }
        />
      )}
    </Page>
  );
}

/** A Dialog whose body is too tall to fit, with nothing inside it to Tab to: the body takes focus itself */
export function TermsDialog() {
  return (
    <Page>
      {(container) => (
        <Dialog
          container={container}
          trigger={<Button variant="secondary">Read the terms</Button>}
          title="Terms of use"
          actions={<DialogClose>Close terms</DialogClose>}
        >
          {Array.from({ length: 6 }, (_, index) => (
            <p key={index} style={{ marginBlockEnd: "var(--space-4)" }}>
              Section {index + 1}. You keep the rights to what you publish. You let us show it on the site and in its
              feeds, and you can take it down at any time.
            </p>
          ))}
        </Dialog>
      )}
    </Page>
  );
}

/** A Dialog with onSubmit, and what its form sent */
export function RenameDialog() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<string>();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    setSent(`The form sent name=${String(name)}.`);
    setOpen(false);
  };
  return (
    <Page>
      {(container) => (
        <>
          <Dialog
            container={container}
            open={open}
            onOpenChange={setOpen}
            onSubmit={submit}
            trigger={<Button variant="secondary">Rename project</Button>}
            title="Rename project"
            size="sm"
            actions={
              <>
                <DialogClose>Cancel</DialogClose>
                <Button type="submit">Rename project</Button>
              </>
            }
          >
            <Input label="Project name" name="name" defaultValue="Portfolio site" />
          </Dialog>
          <output>{sent}</output>
        </>
      )}
    </Page>
  );
}
