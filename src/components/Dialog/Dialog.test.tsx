import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Button } from "../Button";
import { Dialog } from "./Dialog";
import type { DialogProps } from "./Dialog";
import { DialogClose } from "./DialogClose";
import type { DialogChangeDetails } from "./shared";

/** A dialog with a trigger, a field, and Cancel and Save buttons, as most dialogs are */
function Profile(props: Partial<DialogProps>) {
  return (
    <Dialog
      trigger={<Button variant="secondary">Edit profile</Button>}
      title="Edit profile"
      description="Your name shows on your posts."
      actions={
        <>
          <DialogClose>Cancel</DialogClose>
          <Button>Save profile</Button>
        </>
      }
      {...props}
    >
      {props.children ?? <input aria-label="Name" />}
    </Dialog>
  );
}

/** The trigger. While the dialog is open, the page behind it is hidden from screen readers, so include hidden elements. */
const trigger = () => screen.getByRole("button", { name: "Edit profile", hidden: true });

async function open(user = userEvent.setup()) {
  await user.click(trigger());
  return screen.findByRole("dialog");
}

/** Waits for the dialog to finish closing; Base UI removes it a moment after it starts to */
const closed = () => waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

describe("Dialog", () => {
  describe("rendering", () => {
    it("shows only its trigger until it's opened", () => {
      render(<Profile />);
      expect(trigger()).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens as a dialog named by its title and described by its description", async () => {
      render(<Profile />);
      const dialog = await open();
      expect(dialog).toHaveClass("dialog");
      expect(dialog).toHaveAccessibleName("Edit profile");
      expect(dialog).toHaveAccessibleDescription("Your name shows on your posts.");
    });

    it("says it's modal", async () => {
      render(<Profile />);
      expect(await open()).toHaveAttribute("aria-modal", "true");
    });

    it("renders the title as a second-level heading", async () => {
      render(<Profile />);
      await open();
      expect(screen.getByRole("heading", { level: 2, name: "Edit profile" })).toHaveClass("dialog__title");
    });

    it("has no description when none is given", async () => {
      render(<Profile description={undefined} />);
      const dialog = await open();
      expect(dialog).toHaveAccessibleName("Edit profile");
      expect(dialog).not.toHaveAttribute("aria-describedby");
      expect(dialog.querySelector(".dialog__description")).toBeNull();
    });

    it("puts the children in the body and the actions after it", async () => {
      render(<Profile />);
      const dialog = await open();
      const body = dialog.querySelector(".dialog__body")!;
      const actions = dialog.querySelector(".dialog__actions")!;
      expect(body).toContainElement(screen.getByRole("textbox", { name: "Name" }));
      expect(actions).toContainElement(screen.getByRole("button", { name: "Save profile" }));
      expect(body.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("leaves out the body when there are no children, and the actions when there are none", async () => {
      render(<Dialog defaultOpen title="Saved" actions={undefined} />);
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveAccessibleName("Saved");
      expect(dialog.querySelector(".dialog__body")).toBeNull();
      expect(dialog.querySelector(".dialog__actions")).toBeNull();
    });

    it("defaults to the md size", async () => {
      render(<Profile />);
      expect(await open()).toHaveAttribute("data-size", "md");
    });

    it.each(["sm", "md", "lg"] as const)("maps size=%s to data-size", async (size) => {
      render(<Profile size={size} />);
      expect(await open()).toHaveAttribute("data-size", size);
    });

    it("never uses modifier classes", async () => {
      render(<Profile size="lg" />);
      expect((await open()).className).toBe("dialog");
    });

    it("merges a consumer className with its own", async () => {
      render(<Profile className="profile-dialog" />);
      expect(await open()).toHaveClass("dialog", "profile-dialog");
    });

    it("passes other props through to the dialog element", async () => {
      render(<Profile id="profile" data-testid="profile-dialog" />);
      const dialog = await open();
      expect(dialog).toBe(screen.getByTestId("profile-dialog"));
      expect(dialog).toHaveAttribute("id", "profile");
    });

    it("forwards its ref to the dialog element", async () => {
      const ref = createRef<HTMLDivElement>();
      render(<Profile ref={ref} />);
      const dialog = await open();
      expect(ref.current).toBe(dialog);
    });

    it("draws the backdrop and the viewport around the dialog", async () => {
      render(<Profile />);
      const dialog = await open();
      expect(document.querySelector(".dialog__backdrop")).toBeInTheDocument();
      expect(dialog.closest(".dialog__viewport")).toBeInTheDocument();
    });

    it("renders at the end of the page by default, or into a container", async () => {
      const container = document.createElement("div");
      document.body.append(container);
      const { rerender } = render(<Profile defaultOpen />);
      expect(await screen.findByRole("dialog")).not.toBeNull();
      expect(container).toBeEmptyDOMElement();
      rerender(<Profile key="again" defaultOpen container={container} />);
      await waitFor(() => expect(container).toContainElement(screen.getByRole("dialog")));
      container.remove();
    });
  });

  describe("trigger", () => {
    it("renders the consumer's button, marked as opening a dialog", () => {
      render(<Profile />);
      const button = trigger();
      expect(button).toHaveClass("button");
      expect(button).toHaveAttribute("data-variant", "secondary");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("says it's expanded while the dialog is open", async () => {
      render(<Profile />);
      await open();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("opens with Enter and with Space", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      for (const key of ["{Enter}", " "]) {
        trigger().focus();
        await user.keyboard(key);
        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        await user.keyboard("{Escape}");
        await closed();
      }
    });
  });

  describe("close button", () => {
    it("has an icon-only close button named Close, last in the dialog", async () => {
      render(<Profile />);
      const dialog = await open();
      const close = screen.getByRole("button", { name: "Close" });
      expect(close).toHaveClass("button", "dialog__close");
      expect(close).toHaveAttribute("data-variant", "ghost");
      expect(close).toHaveAttribute("data-icon-only");
      expect(dialog.lastElementChild).toBe(close);
    });

    it("hides the close button's icon from screen readers", async () => {
      render(<Profile />);
      await open();
      const icon = screen.getByRole("button", { name: "Close" }).querySelector("svg")!;
      expect(icon).toBeInTheDocument();
      expect(icon.closest("[aria-hidden='true']")).not.toBeNull();
    });

    it("takes its name from closeLabel", async () => {
      render(<Profile closeLabel="Fermer" />);
      await open();
      expect(screen.getByRole("button", { name: "Fermer" })).toHaveClass("dialog__close");
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("closes the dialog", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      await open(user);
      await user.click(screen.getByRole("button", { name: "Close" }));
      await closed();
    });
  });

  describe("closing", () => {
    it("closes with Escape and gives focus back to the trigger", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      await open(user);
      await user.keyboard("{Escape}");
      await closed();
      await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it("closes with a DialogClose in the actions", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      await open(user);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await closed();
    });

    it("closes with a click on the backdrop", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      await open(user);
      await user.click(document.querySelector(".dialog__backdrop")!);
      await closed();
    });

    it("doesn't close with a click inside it", async () => {
      const user = userEvent.setup();
      render(<Profile />);
      const dialog = await open(user);
      await user.click(screen.getByRole("heading", { name: "Edit profile" }));
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBe(dialog);
    });
  });

  describe("focus and the page behind", () => {
    it("moves focus to the first field when it opens", async () => {
      render(<Profile />);
      await open();
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus());
    });

    it("moves focus to the first action, not the close button, when there are no fields", async () => {
      render(<Profile>{"Your profile is up to date."}</Profile>);
      await open();
      await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    });

    it("keeps the body out of the tab order while it fits", async () => {
      render(<Profile>{"Your profile is up to date."}</Profile>);
      const dialog = await open();
      const body = dialog.querySelector(".dialog__body")!;
      expect(body).toHaveTextContent("Your profile is up to date.");
      expect(body).not.toHaveAttribute("tabindex");
    });

    it("moves focus where initialFocus says, and back where finalFocus says", async () => {
      const user = userEvent.setup();
      const initial = createRef<HTMLButtonElement>();
      const final = createRef<HTMLButtonElement>();
      render(
        <>
          <button ref={final}>Somewhere else</button>
          <Profile
            initialFocus={initial}
            finalFocus={final}
            actions={
              <>
                <DialogClose>Cancel</DialogClose>
                <Button ref={initial}>Save profile</Button>
              </>
            }
          />
        </>,
      );
      await open(user);
      await waitFor(() => expect(screen.getByRole("button", { name: "Save profile" })).toHaveFocus());
      await user.keyboard("{Escape}");
      await closed();
      await waitFor(() => expect(screen.getByRole("button", { name: "Somewhere else" })).toHaveFocus());
    });

    it("hides the rest of the page from screen readers and stops it scrolling while open", async () => {
      render(
        <>
          <p>The page behind</p>
          <Profile />
        </>,
      );
      const page = screen.getByText("The page behind");
      expect(page.closest("[aria-hidden='true']")).toBeNull();
      await open();
      expect(page.closest("[aria-hidden='true']")).not.toBeNull();
      expect(document.body.style.overflowY).toBe("hidden");
      expect(document.documentElement.style.scrollbarGutter).toBe("stable");
      await userEvent.setup().keyboard("{Escape}");
      await closed();
      expect(page.closest("[aria-hidden='true']")).toBeNull();
      expect(document.body.style.overflowY).toBe("");
    });
  });

  describe("controlled and uncontrolled", () => {
    it("starts open with defaultOpen, with no trigger needed", async () => {
      render(<Dialog defaultOpen title="Welcome back" />);
      expect(await screen.findByRole("dialog", { name: "Welcome back" })).toBeInTheDocument();
    });

    it("follows the open prop", async () => {
      const { rerender } = render(<Dialog open={false} title="Welcome back" />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(<Dialog open title="Welcome back" />);
      expect(await screen.findByRole("dialog", { name: "Welcome back" })).toBeInTheDocument();
      rerender(<Dialog open={false} title="Welcome back" />);
      await closed();
    });

    it("stays open when controlled and the parent doesn't close it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Dialog open onOpenChange={onOpenChange} title="Welcome back" />);
      const dialog = await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "escape-key" }));
      expect(dialog).toBeInTheDocument();
    });

    it("opens and closes from the parent's state", async () => {
      const user = userEvent.setup();
      function Parent() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open from a menu</button>
            <Dialog open={open} onOpenChange={setOpen} title="Rename project" actions={<DialogClose>Cancel</DialogClose>} />
          </>
        );
      }
      render(<Parent />);
      await user.click(screen.getByRole("button", { name: "Open from a menu" }));
      expect(await screen.findByRole("dialog", { name: "Rename project" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await closed();
    });
  });

  describe("onOpenChange", () => {
    it.each([
      ["trigger-press", true, async (user: ReturnType<typeof userEvent.setup>) => user.click(trigger())],
      ["escape-key", false, async (user: ReturnType<typeof userEvent.setup>) => user.keyboard("{Escape}")],
      ["close-press", false, async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Close" }))],
      ["outside-press", false, async (user: ReturnType<typeof userEvent.setup>) => user.click(document.querySelector(".dialog__backdrop")!)],
    ] as const)("says the reason is %s", async (reason, opening, act) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Profile onOpenChange={onOpenChange} />);
      if (!opening) {
        await open(user);
        onOpenChange.mockClear();
      }
      await act(user);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(opening, expect.objectContaining({ reason }));
    });

    it("stays open when the handler cancels the change", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn((open: boolean, details: DialogChangeDetails) => {
        if (!open) details.cancel();
      });
      render(<Profile onOpenChange={onOpenChange} />);
      const dialog = await open(user);
      await user.keyboard("{Escape}");
      await user.click(document.querySelector(".dialog__backdrop")!);
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "outside-press" }));
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBe(dialog);
    });

    it("calls onOpenChangeComplete once it has opened and once it has closed", async () => {
      const user = userEvent.setup();
      const onOpenChangeComplete = vi.fn();
      render(<Profile onOpenChangeComplete={onOpenChangeComplete} />);
      await open(user);
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(true));
      await user.keyboard("{Escape}");
      await closed();
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false));
    });
  });

  describe("forms", () => {
    it("has no form unless onSubmit is given", async () => {
      render(<Profile />);
      const dialog = await open();
      expect(dialog.querySelector(".dialog__body")).toBeInTheDocument();
      expect(dialog.querySelector("form")).toBeNull();
    });

    it("makes the body and the actions one form with onSubmit", async () => {
      render(<Profile onSubmit={() => {}} />);
      const dialog = await open();
      const form = dialog.querySelector("form")!;
      expect(form).toHaveClass("dialog__form");
      expect(form).toContainElement(dialog.querySelector(".dialog__body") as HTMLElement);
      expect(form).toContainElement(dialog.querySelector(".dialog__actions") as HTMLElement);
      expect(form).not.toContainElement(screen.getByRole("button", { name: "Close" }));
    });

    it("submits the fields with a submit button in the actions, and with Enter in a field", async () => {
      const user = userEvent.setup();
      const values: (string | null)[] = [];
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        values.push(new FormData(event.currentTarget).get("name") as string | null);
      });
      render(
        <Profile
          onSubmit={onSubmit}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <Button type="submit">Save profile</Button>
            </>
          }
        >
          <input aria-label="Name" name="name" />
        </Profile>,
      );
      const dialog = await open(user);
      await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
      await user.click(screen.getByRole("button", { name: "Save profile" }));
      await user.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}");
      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(values).toEqual(["Ada", "Ada"]);
      // Submitting doesn't close it: the handler decides
      expect(dialog).toBeInTheDocument();
    });
  });

  describe("dev warnings", () => {
    it("warns when the title is empty", async () => {
      render(<Dialog defaultOpen title="" />);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] Dialog: has no accessible name, so screen readers announce it without one. Give it a title that says what it's for."]);
    });

    it("leaves out an empty title, so an aria-label can name the dialog instead, without a warning", async () => {
      render(<Dialog defaultOpen title="" aria-label="Edit profile" />);
      const dialog = await screen.findByRole("dialog", { name: "Edit profile" });
      expect(dialog).not.toHaveAttribute("aria-labelledby");
      expect(dialog.querySelector(".dialog__title")).toBeNull();
    });
  });

  describe("types", () => {
    it("requires a title that renders something", () => {
      expectTypeOf<{ title: string }>().toExtend<DialogProps>();
      expectTypeOf<{ children: string }>().not.toExtend<DialogProps>();
      expectTypeOf<{ title: undefined }>().not.toExtend<DialogProps>();
      expectTypeOf<{ title: null }>().not.toExtend<DialogProps>();
      expectTypeOf<{ title: boolean }>().not.toExtend<DialogProps>();
    });

    it("only accepts known sizes", () => {
      expectTypeOf<DialogProps["size"]>().toEqualTypeOf<"sm" | "md" | "lg" | undefined>();
    });

    it("leaves out Base UI's modal setting: a dialog is always modal", () => {
      expectTypeOf<DialogProps>().not.toHaveProperty("modal");
      expectTypeOf<DialogProps>().not.toHaveProperty("render");
    });
  });
});
