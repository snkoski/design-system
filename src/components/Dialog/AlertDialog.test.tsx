import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Button } from "../Button";
import { AlertDialog } from "./AlertDialog";
import type { AlertDialogProps } from "./AlertDialog";
import { DialogClose } from "./DialogClose";

/** A confirmation with a trigger, Cancel, and the action */
function DeleteProject({ onDelete = () => {}, ...props }: Partial<AlertDialogProps> & { onDelete?: () => void }) {
  return (
    <AlertDialog
      trigger={<Button variant="secondary">Delete project</Button>}
      title="Delete project?"
      description="Its files and history are deleted for everyone. This can't be undone."
      actions={
        <>
          <DialogClose>Cancel</DialogClose>
          <DialogClose variant="primary" onClick={onDelete}>Delete project</DialogClose>
        </>
      }
      {...props}
    />
  );
}

const trigger = () => screen.getAllByRole("button", { name: "Delete project" })[0]!;

async function open(user = userEvent.setup()) {
  await user.click(trigger());
  return screen.findByRole("alertdialog");
}

const closed = () => waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

describe("AlertDialog", () => {
  describe("rendering", () => {
    it("shows only its trigger until it's opened", () => {
      render(<DeleteProject />);
      expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("opens as an alert dialog named by its title and described by its description", async () => {
      render(<DeleteProject />);
      const dialog = await open();
      expect(dialog).toHaveClass("dialog");
      expect(dialog).toHaveAccessibleName("Delete project?");
      expect(dialog).toHaveAccessibleDescription("Its files and history are deleted for everyone. This can't be undone.");
      expect(screen.getByRole("heading", { level: 2, name: "Delete project?" })).toHaveClass("dialog__title");
    });

    it("says it's modal, so axe and screen readers treat the page behind as out of reach", async () => {
      render(<DeleteProject />);
      expect(await open()).toHaveAttribute("aria-modal", "true");
    });

    it("defaults to the sm size", async () => {
      render(<DeleteProject />);
      expect(await open()).toHaveAttribute("data-size", "sm");
    });

    it.each(["sm", "md", "lg"] as const)("maps size=%s to data-size", async (size) => {
      render(<DeleteProject size={size} />);
      expect(await open()).toHaveAttribute("data-size", size);
    });

    it("has no close button: its actions are the only buttons", async () => {
      render(<DeleteProject />);
      const dialog = await open();
      const buttons = [...dialog.querySelectorAll("button")].map((button) => button.textContent);
      expect(buttons).toEqual(["Cancel", "Delete project"]);
      expect(dialog.querySelector(".dialog__close")).toBeNull();
    });

    it("merges a consumer className, passes other props through, and forwards its ref", async () => {
      const ref = createRef<HTMLDivElement>();
      render(<DeleteProject ref={ref} className="confirm" data-testid="confirm" />);
      const dialog = await open();
      expect(dialog).toHaveClass("dialog", "confirm");
      expect(dialog).toBe(screen.getByTestId("confirm"));
      expect(ref.current).toBe(dialog);
    });
  });

  describe("answering", () => {
    it("moves focus to Cancel when it opens", async () => {
      render(<DeleteProject />);
      await open();
      await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    });

    it("doesn't close with a click on the backdrop", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<DeleteProject onOpenChange={onOpenChange} />);
      const dialog = await open(user);
      onOpenChange.mockClear();
      await user.click(document.querySelector(".dialog__backdrop")!);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBe(dialog);
    });

    it("closes with Escape and gives focus back to the trigger", async () => {
      const user = userEvent.setup();
      render(<DeleteProject />);
      await open(user);
      await user.keyboard("{Escape}");
      await closed();
      await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it("closes with Cancel without running the action", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<DeleteProject onDelete={onDelete} />);
      await open(user);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await closed();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("runs the action and closes when the confirming button is a DialogClose", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<DeleteProject onDelete={onDelete} />);
      const dialog = await open(user);
      await user.click(dialog.querySelector(".dialog__actions button:last-child")!);
      expect(onDelete).toHaveBeenCalledTimes(1);
      await closed();
    });

    it("stays open while a slow action runs, when the handler cancels closing", async () => {
      const user = userEvent.setup();
      render(
        <DeleteProject
          defaultOpen
          onOpenChange={(open, details) => {
            if (!open) details.cancel();
          }}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <Button loading>Delete project</Button>
            </>
          }
        />,
      );
      const dialog = await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      expect(screen.getByRole("alertdialog")).toBe(dialog);
    });

    it("follows the open prop, and reports every change to onOpenChange", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(<DeleteProject open={false} onOpenChange={onOpenChange} />);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      await user.click(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: "trigger-press" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      rerender(<DeleteProject open onOpenChange={onOpenChange} />);
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      rerender(<DeleteProject open={false} onOpenChange={onOpenChange} />);
      await closed();
    });

    it("calls onOpenChangeComplete once it has opened and once it has closed", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn();
      render(<DeleteProject onOpenChangeComplete={onOpenChangeComplete} />);
      await open(user);
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(true));
      await user.keyboard("{Escape}");
      await closed();
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false));
    });

    it("can be a form, like Dialog", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
      render(
        <DeleteProject
          defaultOpen
          onSubmit={onSubmit}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <Button type="submit">Delete project</Button>
            </>
          }
        />,
      );
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog.querySelector("form.dialog__form")).toContainElement(dialog.querySelector(".dialog__actions") as HTMLElement);
      await user.click(dialog.querySelector("button[type='submit']")!);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("dev warnings", () => {
    it("warns when the title is empty", async () => {
      render(<AlertDialog defaultOpen title="" actions={<DialogClose>Cancel</DialogClose>} />);
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] AlertDialog: has no accessible name, so screen readers announce it without one. Give it a title that asks the question."]);
    });
  });

  describe("types", () => {
    it("requires a title and actions", () => {
      expectTypeOf<{ title: string; actions: string }>().toExtend<AlertDialogProps>();
      expectTypeOf<{ title: string }>().not.toExtend<AlertDialogProps>();
      expectTypeOf<{ actions: string }>().not.toExtend<AlertDialogProps>();
      expectTypeOf<{ title: undefined; actions: string }>().not.toExtend<AlertDialogProps>();
      expectTypeOf<{ title: string; actions: undefined }>().not.toExtend<AlertDialogProps>();
      expectTypeOf<{ title: string; actions: null }>().not.toExtend<AlertDialogProps>();
    });

    it("has no close button to name", () => {
      expectTypeOf<AlertDialogProps>().not.toHaveProperty("closeLabel");
    });

    it("only accepts known sizes", () => {
      expectTypeOf<AlertDialogProps["size"]>().toEqualTypeOf<"sm" | "md" | "lg" | undefined>();
    });
  });
});
