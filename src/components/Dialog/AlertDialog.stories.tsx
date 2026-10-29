import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "../Button";
import { AlertDialog } from "./AlertDialog";
import { DialogClose } from "./DialogClose";

/**
 * A box the dialog opens in, instead of at the end of the page, so the story's checks, its theme, and screenshots
 * reach it. `contain: layout` makes the box, not the screen, what the fixed backdrop and viewport fill.
 */
function Stage({ children, height = "24rem" }: { children: (container: HTMLDivElement) => ReactNode; height?: string }) {
  // The element itself, once it exists: a ref that's still empty when a dialog opens sends it to the end of the page
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className="overflow-hidden" style={{ contain: "layout", height, background: "var(--bg)", color: "var(--ink)" }}>
      <p className="p-6">The page behind the dialog.</p>
      {container && children(container)}
    </div>
  );
}

const meta = {
  title: "Components/Alert dialog",
  component: AlertDialog,
  args: {
    title: "Delete project?",
    description: "Its files and history are deleted for everyone. This can't be undone.",
    size: "sm",
    actions: (
      <>
        <DialogClose>Cancel</DialogClose>
        <DialogClose variant="primary">Delete project</DialogClose>
      </>
    ),
    onOpenChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    trigger: { control: false },
    actions: { control: false },
    container: { control: false },
    initialFocus: { control: false },
    finalFocus: { control: false },
  },
  render: (args) => <AlertDialog {...args} trigger={<Button variant="secondary">Delete project</Button>} />,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel, then open the dialog. */
export const Playground: Story = {};

/**
 * An open confirmation. Focus starts on Cancel, the least destructive answer. A click on the dimmed page does
 * nothing: only Escape or one of its buttons closes it.
 */
export const States: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage>
      {(container) => (
        <AlertDialog {...args} defaultOpen container={container} />
      )}
    </Stage>
  ),
  play: async ({ canvas, canvasElement, args, userEvent }) => {
    const dialog = await canvas.findByRole("alertdialog", { name: "Delete project?" });
    await waitFor(() => expect(canvas.getByRole("button", { name: "Cancel" })).toHaveFocus());
    expect(dialog.querySelector(".dialog__close")).toBeNull();
    const box = dialog.getBoundingClientRect();
    const stage = canvasElement.querySelector("[style*='contain']")!.getBoundingClientRect();
    await userEvent.pointer({ keys: "[MouseLeft]", coords: { x: (stage.left + box.left) / 2, y: box.top + box.height / 2 } });
    await expect(canvas.getByRole("alertdialog")).toBe(dialog);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/**
 * An action that takes time: the confirming button shows it's working, and the dialog can't be closed until it's done.
 * The dialog is controlled; `onOpenChange` calls `details.cancel()` while the action runs.
 */
export const SlowAction: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const [deleting, setDeleting] = useState(false);
    return (
      <Stage>
        {(container) => (
          <AlertDialog
            {...args}
            open={open}
            container={container}
            onOpenChange={(next, details) => {
              if (deleting) return details.cancel();
              setOpen(next);
            }}
            actions={
              <>
                <DialogClose disabled={deleting}>Cancel</DialogClose>
                <Button
                  loading={deleting}
                  onClick={() => {
                    setDeleting(true);
                    setTimeout(() => {
                      setDeleting(false);
                      setOpen(false);
                    }, 600);
                  }}
                >
                  Delete project
                </Button>
              </>
            }
          />
        )}
      </Stage>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const dialog = await canvas.findByRole("alertdialog");
    await userEvent.click(canvas.getByRole("button", { name: "Delete project" }));
    await expect(canvas.getByRole("button", { name: "Delete project" })).toHaveAttribute("aria-busy", "true");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("alertdialog")).toBe(dialog);
    await waitFor(() => expect(canvas.queryByRole("alertdialog")).not.toBeInTheDocument(), { timeout: 2000 });
  },
};

/** An open confirmation in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Stage height="18rem">
            {(container) => (
              <AlertDialog {...args} defaultOpen container={container} initialFocus={false} />
            )}
          </Stage>
        </section>
      ))}
    </div>
  ),
};
