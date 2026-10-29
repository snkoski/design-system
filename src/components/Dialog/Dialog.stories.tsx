import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "../Button";
import { Input } from "../Input";
import { Dialog } from "./Dialog";
import { DialogClose } from "./DialogClose";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** Whether a click just inside `size` from an element's center, above, below, left, and right of it, reaches the element */
function hitAreaReaches(element: Element, size: number) {
  const box = element.getBoundingClientRect();
  const [x, y, reach] = [box.left + box.width / 2, box.top + box.height / 2, size / 2 - 1];
  const points: [number, number][] = [[x, y - reach], [x, y + reach], [x - reach, y], [x + reach, y]];
  return points.every(([px, py]) => element.contains(document.elementFromPoint(px, py)));
}

/**
 * A box the dialog opens in, instead of at the end of the page, so the story's checks, its theme, and screenshots
 * reach it. `contain: layout` makes the box, not the screen, what the fixed backdrop and viewport fill.
 */
function Stage({ children, height = "34rem", width }: { children: (container: HTMLDivElement) => ReactNode; height?: string; width?: string }) {
  // The element itself, once it exists: a ref that's still empty when a dialog opens sends it to the end of the page
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className="overflow-hidden" style={{ contain: "layout", height, width, background: "var(--bg)", color: "var(--ink)" }}>
      <p className="p-6">The page behind the dialog.</p>
      {container && children(container)}
    </div>
  );
}

const profileActions = (
  <>
    <DialogClose>Cancel</DialogClose>
    <Button type="submit">Save profile</Button>
  </>
);

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  args: {
    title: "Edit profile",
    description: "Your name and email show on your posts.",
    size: "md",
    closeLabel: "Close",
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
  render: (args) => (
    <Dialog
      {...args}
      trigger={<Button variant="secondary">Edit profile</Button>}
      onSubmit={(event) => event.preventDefault()}
      actions={profileActions}
    >
      <div className="grid gap-4">
        <Input label="Display name" name="name" defaultValue="Ada Lovelace" />
        <Input label="Email" name="email" type="email" defaultValue="ada@example.com" />
      </div>
    </Dialog>
  ),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel, then open the dialog. */
export const Playground: Story = {};

/**
 * A dialog that's open, with a title and description, fields, and actions. The close button sits in the top corner
 * but comes last in the tab order, so focus starts on the first field. Its hit area is `--target-min` with a mouse
 * and on touch.
 */
export const States: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage>
      {(container) => (
        <Dialog {...args} defaultOpen container={container} onSubmit={(event) => event.preventDefault()} actions={profileActions}>
          <div className="grid gap-4">
            <Input label="Display name" name="name" defaultValue="Ada Lovelace" />
            <Input label="Email" name="email" type="email" defaultValue="ada@example.com" />
          </div>
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dialog = await canvas.findByRole("dialog", { name: "Edit profile" });
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Display name" })).toHaveFocus());
    const close = canvas.getByRole("button", { name: "Close" });
    expect(dialog.lastElementChild).toBe(close);
    expect(measure("--target-min", canvasElement)).toBeGreaterThanOrEqual(24);
    expect(hitAreaReaches(close, measure("--target-min", canvasElement))).toBe(true);
    canvasElement.dataset.pointer = "coarse";
    try {
      expect(measure("--target-min", canvasElement)).toBeGreaterThanOrEqual(44);
      expect(hitAreaReaches(close, measure("--target-min", canvasElement))).toBe(true);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** Opens from its trigger with Enter or Space. Tab and Shift+Tab stay inside it; Escape closes it and focus goes back to the trigger. */
export const Keyboard: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage>
      {(container) => (
        <div className="px-6">
          <Dialog {...args} container={container} trigger={<Button variant="secondary">Edit profile</Button>} actions={profileActions}>
            <Input label="Display name" name="name" defaultValue="Ada Lovelace" />
          </Dialog>
        </div>
      )}
    </Stage>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Edit profile" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const field = await canvas.findByRole("textbox", { name: "Display name" });
    await waitFor(() => expect(field).toHaveFocus());
    // Field, Cancel, Save profile, Close, and round again. Base UI's focus guards move focus a moment after Tab
    // leaves either end, so wait for it.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(canvas.getByRole("button", { name: "Close" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Clicking the dimmed page around the dialog closes it, like Escape and the close button. */
export const ClickOutside: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage>
      {(container) => (
        <Dialog {...args} defaultOpen size="sm" container={container} actions={profileActions}>
          Your profile is up to date.
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas, canvasElement, args, userEvent }) => {
    const dialog = await canvas.findByRole("dialog");
    const box = dialog.getBoundingClientRect();
    const stage = canvasElement.firstElementChild!.getBoundingClientRect();
    // Halfway between the dialog's left edge and the stage's: over the viewport and the backdrop
    await userEvent.pointer({ keys: "[MouseLeft]", coords: { x: (stage.left + box.left) / 2, y: box.top + box.height / 2 } });
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "outside-press" }));
  },
};

/** Widths: `sm` (400px) for confirmations, `md` (600px) for most forms, and `lg` (800px) for tables and previews. */
export const Sizes: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="grid">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Stage key={size} height="18rem">
          {(container) => (
            <Dialog {...args} defaultOpen size={size} title={`Size ${size}`} description={undefined} container={container} actions={<DialogClose>Close</DialogClose>}>
              {size === "sm" ? "Confirmations." : size === "md" ? "Most forms, the default." : "Tables and previews."}
            </Dialog>
          )}
        </Stage>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const widths = [...canvasElement.querySelectorAll(".dialog")].map((dialog) => dialog.getBoundingClientRect().width / rem);
    expect(widths).toEqual([25, 37.5, 50]);
  },
};

/** On a 320px screen it fills the width, less a 16px gutter on each side, and the actions wrap if they must. */
export const NarrowScreen: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage width="20rem">
      {(container) => (
        <Dialog {...args} defaultOpen container={container} actions={profileActions}>
          <Input label="Display name" name="name" defaultValue="Ada Lovelace" />
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dialog = await canvas.findByRole("dialog");
    const stage = canvasElement.querySelector<HTMLElement>("[style*='contain']")!.getBoundingClientRect();
    const box = dialog.getBoundingClientRect();
    const gutter = measure("--space-4");
    expect(box.left - stage.left).toBeCloseTo(gutter, 0);
    expect(stage.right - box.right).toBeCloseTo(gutter, 0);
  },
};

/**
 * When the content is taller than the screen, the body scrolls while the title and actions stay. With nothing inside
 * to Tab to, the body itself takes focus, so it can be scrolled with the keyboard.
 */
export const LongContent: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage height="34rem">
      {(container) => (
        <Dialog
          {...args}
          defaultOpen
          title="Terms of use"
          description="Read these before you publish."
          container={container}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <DialogClose variant="primary">Accept terms</DialogClose>
            </>
          }
        >
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index} className="mb-4">
              Section {index + 1}. You keep the rights to what you publish. You let us show it on the site and in its
              feeds, and you can take it down at any time.
            </p>
          ))}
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const dialog = await canvas.findByRole("dialog", { name: "Terms of use" });
    const body = dialog.querySelector<HTMLElement>(".dialog__body")!;
    const stage = canvasElement.querySelector<HTMLElement>("[style*='contain']")!.getBoundingClientRect();
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(stage.bottom);
    await waitFor(() => expect(body).toHaveAttribute("tabindex", "0"));
    // Simulated keys don't scroll (only real ones do), so check that Tab reaches the body: from Cancel, back one
    canvas.getByRole("button", { name: "Cancel" }).focus();
    await userEvent.tab({ shift: true });
    await expect(body).toHaveFocus();
  },
};

/**
 * A tall form: the body scrolls, but it has fields to Tab to, which the browser scrolls into view, so the body stays
 * out of the tab order and focus starts on the first field.
 */
export const LongForm: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage height="34rem">
      {(container) => (
        <Dialog {...args} defaultOpen title="Shipping address" description={undefined} container={container} actions={profileActions}>
          <div className="grid gap-4">
            {["Full name", "Company (optional)", "Street", "Flat or floor (optional)", "Town or city", "Postcode", "Country"].map((label) => (
              <Input key={label} label={label} />
            ))}
          </div>
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole("dialog", { name: "Shipping address" });
    const body = dialog.querySelector<HTMLElement>(".dialog__body")!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Full name" })).toHaveFocus());
    expect(body).not.toHaveAttribute("tabindex");
  },
};

/**
 * On a short screen (a phone turned sideways, or a page zoomed to 400%), the whole window scrolls, so the body never
 * shrinks to nothing and the buttons can always be reached.
 */
export const ShortScreen: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage height="16rem" width="20rem">
      {(container) => (
        <Dialog
          {...args}
          defaultOpen
          title="Terms of use"
          description="Read these before you publish."
          container={container}
          actions={
            <>
              <DialogClose>Cancel</DialogClose>
              <DialogClose variant="primary">Accept terms</DialogClose>
            </>
          }
        >
          <p>You keep the rights to what you publish. You let us show it on the site and in its feeds, and you can take it down at any time.</p>
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole("dialog", { name: "Terms of use" });
    const body = dialog.querySelector<HTMLElement>(".dialog__body")!;
    expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight);
    // The body keeps its whole height: the window scrolls, not the body
    expect(body.scrollHeight).toBeLessThanOrEqual(body.clientHeight + 1);
    dialog.scrollTop = dialog.scrollHeight;
    const accept = canvas.getByRole("button", { name: "Accept terms" }).getBoundingClientRect();
    expect(accept.bottom).toBeLessThanOrEqual(dialog.getBoundingClientRect().bottom);
  },
};

/**
 * A page with a fixed header that sits above the rest of the page (`z-index`). The dialog still opens over it, because
 * the page's root has `isolation: isolate`: everything the page stacks stays inside it, below the dialog, which Base UI
 * adds after it.
 */
export const OverAFixedHeader: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Stage height="20rem">
      {(container) => (
        <>
          <div style={{ isolation: "isolate" }}>
            <header className="p-8" style={{ position: "fixed", insetInline: 0, top: 0, zIndex: 10, background: "var(--surface)", borderBlockEnd: "var(--border-thin) solid var(--border)" }}>
              The page's header
            </header>
          </div>
          <Dialog {...args} defaultOpen size="sm" container={container} actions={profileActions}>
            Your profile is up to date.
          </Dialog>
        </>
      )}
    </Stage>
  ),
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole("dialog");
    const box = dialog.getBoundingClientRect();
    const header = canvas.getByText("The page's header", { selector: "header" }).getBoundingClientRect();
    // They overlap, and where they do, the dialog is on top
    expect(header.bottom).toBeGreaterThan(box.top + 2);
    expect(dialog.contains(document.elementFromPoint(box.left + box.width / 2, box.top + 2))).toBe(true);
  },
};

/** With `onSubmit`, the body and actions are one form: Enter in a field or the submit button sends it. */
export const Form: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { onSubmit: fn() },
  render: ({ onSubmit, ...args }) => (
    <Stage>
      {(container) => (
        <Dialog
          {...args}
          defaultOpen
          container={container}
          actions={profileActions}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.(event);
          }}
        >
          <Input label="Display name" name="name" />
        </Dialog>
      )}
    </Stage>
  ),
  play: async ({ canvas, args, userEvent }) => {
    const field = await canvas.findByRole("textbox", { name: "Display name" });
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.type(field, "Ada{Enter}");
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};

function Example({ theme }: { theme: string }) {
  return (
    <Stage height="24rem">
      {(container) => (
        <Dialog
          defaultOpen
          container={container}
          title="Edit profile"
          description="Your name and email show on your posts."
          actions={profileActions}
          initialFocus={false}
        >
          <Input label="Display name" name={`${theme}-name`} defaultValue="Ada Lovelace" />
        </Dialog>
      )}
    </Stage>
  );
}

/** A small dialog whose body scrolls, with only text inside, so the body can take focus */
function Scrolling() {
  return (
    <Stage height="34rem">
      {(container) => (
        <Dialog defaultOpen container={container} initialFocus={false} size="sm" title="Terms of use" actions={<DialogClose>Close terms</DialogClose>}>
          {Array.from({ length: 6 }, (_, index) => (
            <p key={index} className="mb-4">
              Section {index + 1}. You keep the rights to what you publish, and you can take it down at any time.
            </p>
          ))}
        </Dialog>
      )}
    </Stage>
  );
}

/** Open dialogs in all three themes at once: one with a field, and a small one whose body scrolls. Chromatic snapshots this one. */
export const AllThemes: Story = {
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Example theme={theme} />
          <Scrolling />
        </section>
      ))}
    </div>
  ),
};
