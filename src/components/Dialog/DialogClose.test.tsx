import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Button } from "../Button";
import { AlertDialog } from "./AlertDialog";
import { Dialog } from "./Dialog";
import { DialogClose } from "./DialogClose";
import type { DialogCloseProps } from "./DialogClose";

/** Renders a DialogClose inside an open Dialog */
async function inDialog(close: React.ReactNode) {
  render(<Dialog defaultOpen title="Edit profile" actions={close} />);
  return screen.findByRole("dialog");
}

const closed = (role = "dialog") => waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument());

describe("DialogClose", () => {
  describe("rendering", () => {
    it("renders a Button with its label", async () => {
      await inDialog(<DialogClose>Cancel</DialogClose>);
      const button = screen.getByRole("button", { name: "Cancel" });
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveClass("button");
    });

    it("defaults to the secondary variant, because Cancel is never primary", async () => {
      await inDialog(<DialogClose>Cancel</DialogClose>);
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("data-variant", "secondary");
    });

    it("takes Button's props", async () => {
      await inDialog(
        <DialogClose variant="ghost" size="sm" iconOnly aria-label="Dismiss">
          <svg />
        </DialogClose>,
      );
      const button = screen.getByRole("button", { name: "Dismiss" });
      expect(button).toHaveAttribute("data-variant", "ghost");
      expect(button).toHaveAttribute("data-size", "sm");
      expect(button).toHaveAttribute("data-icon-only");
    });

    it("merges a consumer className, passes other props through, and forwards its ref", async () => {
      const ref = createRef<HTMLButtonElement>();
      await inDialog(
        <DialogClose ref={ref} className="cancel" data-testid="cancel">
          Cancel
        </DialogClose>,
      );
      const button = screen.getByTestId("cancel");
      expect(button).toHaveClass("button", "cancel");
      expect(ref.current).toBe(button);
    });
  });

  describe("closing", () => {
    it("closes the Dialog it's in", async () => {
      const user = userEvent.setup();
      await inDialog(<DialogClose>Cancel</DialogClose>);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await closed();
    });

    it("closes the AlertDialog it's in", async () => {
      const user = userEvent.setup();
      render(<AlertDialog defaultOpen title="Delete project?" actions={<DialogClose>Cancel</DialogClose>} />);
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await closed("alertdialog");
    });

    it("runs its onClick, then closes", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      await inDialog(<DialogClose onClick={onClick}>Discard draft</DialogClose>);
      await user.click(screen.getByRole("button", { name: "Discard draft" }));
      expect(onClick).toHaveBeenCalledTimes(1);
      await closed();
    });

    it("works with the keyboard", async () => {
      const user = userEvent.setup();
      await inDialog(<DialogClose>Cancel</DialogClose>);
      screen.getByRole("button", { name: "Cancel" }).focus();
      await user.keyboard("{Enter}");
      await closed();
    });

    it("doesn't close while disabled", async () => {
      const user = userEvent.setup();
      const dialog = await inDialog(
        <>
          <DialogClose disabled>Cancel</DialogClose>
          <Button>Save</Button>
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("dialog")).toBe(dialog);
    });
  });

  describe("types", () => {
    it("takes the same props as Button, so an icon-only one needs an aria-label", () => {
      expectTypeOf<{ iconOnly: true }>().not.toExtend<DialogCloseProps>();
      expectTypeOf<{ iconOnly: true; "aria-label": string }>().toExtend<DialogCloseProps>();
      expectTypeOf<DialogCloseProps["variant"]>().toEqualTypeOf<"primary" | "secondary" | "ghost" | undefined>();
      expectTypeOf<{ children: string }>().toExtend<DialogCloseProps>();
    });
  });
});
