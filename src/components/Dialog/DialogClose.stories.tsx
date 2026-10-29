import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { AlertDialog } from "./AlertDialog";
import { DialogClose } from "./DialogClose";

/**
 * A box the dialog opens in, instead of at the end of the page, so the story's checks, its theme, and screenshots
 * reach it. `contain: layout` makes the box, not the screen, what the fixed backdrop and viewport fill.
 */
function Stage({ children }: { children: (container: HTMLDivElement) => ReactNode }) {
  // The element itself, once it exists: a ref that's still empty when a dialog opens sends it to the end of the page
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className="overflow-hidden" style={{ contain: "layout", height: "18rem", background: "var(--bg)", color: "var(--ink)" }}>
      {container && children(container)}
    </div>
  );
}

const meta = {
  title: "Components/Dialog close",
  component: DialogClose,
  args: {
    children: "Cancel",
    variant: "secondary",
    size: "md",
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage>
      {(container) => (
        <AlertDialog defaultOpen container={container} title="Discard draft?" description="Your changes since you last saved are lost." actions={<DialogClose {...args} />} />
      )}
    </Stage>
  ),
} satisfies Meta<typeof DialogClose>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A Button that closes the dialog it's in. It runs its own `onClick` first. Change any prop in the Controls panel. */
export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await canvas.findByRole("alertdialog");
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};

/** "Cancel" in its default variant, secondary, beside a primary action, in all three themes. Cancel is never primary. */
export const AllThemes: Story = {
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Stage>
            {(container) => (
              <AlertDialog
                defaultOpen
                container={container}
                initialFocus={false}
                title="Discard draft?"
                description="Your changes since you last saved are lost."
                actions={
                  <>
                    <DialogClose>Cancel</DialogClose>
                    <DialogClose variant="primary">Discard draft</DialogClose>
                  </>
                }
              />
            )}
          </Stage>
        </section>
      ))}
    </div>
  ),
};
