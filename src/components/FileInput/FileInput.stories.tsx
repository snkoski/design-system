import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { expect, fn, waitFor } from "storybook/test";
import { Button } from "@/components/Button";
import { FileInput } from "@/components/FileInput/FileInput";
import fileInputCss from "@/components/FileInput/file-input.css?inline";
import fieldCss from "@/internal/field.css?inline";
import insetButtonCss from "@/internal/inset-button.css?inline";
import textFieldCss from "@/internal/text-field.css?inline";
import visuallyHiddenCss from "@/internal/visually-hidden.css?inline";

/** The px value of a length token, measured in the browser. Pass a parent to see its data-pointer and data-density. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** A color token as the browser computes it, from a probe inside `parent` so its theme applies */
function tokenColor(token: string, parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  parent.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Runs a check with a mouse (target-min at least 24px), then on touch (at least 44px). */
async function withMouseAndTouch(canvasElement: HTMLElement, check: (floor: number) => Promise<void>) {
  await check(24);
  canvasElement.dataset.pointer = "coarse";
  try {
    await check(44);
  } finally {
    delete canvasElement.dataset.pointer;
  }
}

const pdf = (name = "cv.pdf") => new File(["%PDF-1.7"], name, { type: "application/pdf" });

/**
 * Gives a file input real files, as the browser does when someone chooses them. Stories don't use userEvent's
 * `upload` for this: in a real browser it puts a fake `files` list on the input, which the browser's own form data and
 * form reset never see, so what the form sends couldn't be checked.
 */
function choose(input: HTMLInputElement, files: File[]) {
  const chosen = new DataTransfer();
  for (const file of files) chosen.items.add(file);
  input.files = chosen.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Renders its field with files already chosen, so screenshots and the docs page show the chosen state */
function WithFiles({ files, children }: { files: string[]; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const input = box.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (input) choose(input, files.map((name) => pdf(name)));
    // Once, on mount, like a person's choice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={box} className="contents">
      {children}
    </div>
  );
}

const fileInputOf = (element: ParentNode) => element.querySelector<HTMLInputElement>('input[type="file"]')!;

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

const meta = {
  title: "Components/File input",
  component: FileInput,
  args: {
    label: "Résumé",
    description: "PDF or Word document, up to 5 MB.",
    accept: ".pdf,.doc,.docx",
    size: "md",
    multiple: false,
    disabled: false,
    required: false,
    invalid: false,
    onFilesChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    capture: { control: "select", options: [undefined, "user", "environment"] },
    ref: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel, and choose a file to see Remove. */
export const Playground: Story = {};

/** Empty, one file, two files, invalid, disabled with and without a file, large, and with no visible label. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <FileInput {...args} label="Empty" />
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} label="One file chosen" />
      </WithFiles>
      <WithFiles files={["essay.pdf", "letter.pdf"]}>
        <FileInput {...args} label="Two files chosen" multiple />
      </WithFiles>
      <FileInput {...args} label="Invalid" invalid error="Choose a résumé to upload." />
      <FileInput {...args} label="Disabled" disabled />
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} label="Disabled with a file" disabled />
      </WithFiles>
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} label="Large" size="lg" />
      </WithFiles>
      <FileInput {...args} label={undefined} description={undefined} aria-label="Profile photo" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Remove file, One file chosen" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove files, Two files chosen" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove file, Disabled with a file" })).toBeDisabled();
  },
};

/**
 * Medium is the default. Large matches a large button. Both are at least `target-min` tall: 24px with a mouse, 44px on
 * touch. Remove is square, as wide as the field is tall. The story checks both.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} size="md" label="Medium" />
      </WithFiles>
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} size="lg" label="Large" />
      </WithFiles>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const fields = ["Medium", "Large"].map((name) => canvas.getByLabelText(name, { selector: "input" }));
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const field of fields) {
        const height = field.getBoundingClientRect().height;
        await expect(height).toBeGreaterThanOrEqual(target);
        const remove = field.parentElement!.querySelector(".file-input__remove")!;
        await expect(remove.getBoundingClientRect().width).toBeCloseTo(height, 0);
      }
    });
  },
};

/** With `multiple`, several files can be chosen at once. The browser says how many; Remove empties them all. */
export const Multiple: Story = {
  args: { label: "Writing samples (optional)", description: "Up to 3 PDFs, 5 MB each.", accept: ".pdf", multiple: true },
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText("Writing samples (optional)") as HTMLInputElement;
    choose(input, [pdf("essay.pdf"), pdf("letter.pdf")]);
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([expect.any(File), expect.any(File)], expect.anything());
    await expect(canvas.getByRole("button", { name: "Remove files, Writing samples (optional)" })).toBeInTheDocument();
  },
};

/** `accept` filters the picker to the kinds of file the page takes. Say them in the description too: it checks nothing. */
export const Accept: Story = {
  args: { label: "Profile photo (optional)", description: "A JPEG or PNG, up to 2 MB.", accept: "image/jpeg,image/png" },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Profile photo (optional)")).toHaveAttribute("accept", "image/jpeg,image/png");
  },
};

/** The page checks each file on submit and says what's wrong in words, fix first. */
export const Invalid: Story = {
  args: { required: true, invalid: true, error: "Choose a file smaller than 5 MB." },
};

/** A disabled field can't be focused, changed, or submitted, and neither can its Remove button. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <WithFiles files={["cv.pdf"]}>
      <FileInput {...args} />
    </WithFiles>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Résumé", { selector: "input" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Remove file, Résumé" })).toBeDisabled();
  },
};

/** A file field with no visible label, such as one in a table row, needs an `aria-label`. Remove is named after it. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, description: undefined, "aria-label": "Profile photo", accept: "image/*" },
  render: (args) => (
    <WithFiles files={["me.png"]}>
      <FileInput {...args} />
    </WithFiles>
  ),
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByLabelText("Profile photo", { selector: "input" });
    await expect(canvas.getByRole("button", { name: "Remove file, Profile photo" })).toBeInTheDocument();
    await withMouseAndTouch(canvasElement, async (floor) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      await expect(field.closest(".file-input")!.getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
    });
  },
};

/** A form that shows what it would send */
function SentForm({ children, onSent }: { children: ReactNode; onSent?: (sent: string) => void }) {
  const [sent, setSent] = useState("");
  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const file = new FormData(event.currentTarget).get("resume") as File | null;
        const text = file && file.size > 0 ? `Sent: ${file.name}` : "Sent with no file";
        setSent(text);
        onSent?.(text);
      }}
    >
      {children}
      <div className="flex gap-2">
        <Button type="submit" variant="secondary">Send application</Button>
        <Button type="reset" variant="ghost">Clear form</Button>
      </div>
      <output>{sent}</output>
    </form>
  );
}

/**
 * Once a file is chosen, Remove empties the field again: the browser's own input can't. Focus moves back to the field,
 * and the form sends no file.
 */
export const Remove: Story = {
  render: (args) => (
    <SentForm>
      <FileInput {...args} name="resume" />
    </SentForm>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Résumé", { selector: "input" }) as HTMLInputElement;
    choose(input, [pdf()]);
    await userEvent.click(canvas.getByRole("button", { name: "Send application" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent: cv.pdf");
    await userEvent.click(canvas.getByRole("button", { name: "Remove file, Résumé" }));
    await expect(input.files).toHaveLength(0);
    await expect(input).toHaveFocus();
    await expect(canvas.queryByRole("button", { name: /^Remove/ })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Send application" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent with no file");
  },
};

/** Clearing the form empties the field, and Remove goes with the file. */
export const FormReset: Story = {
  render: (args) => (
    <SentForm>
      <FileInput {...args} name="resume" />
    </SentForm>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Résumé", { selector: "input" }) as HTMLInputElement;
    choose(input, [pdf()]);
    await expect(canvas.getByRole("button", { name: "Remove file, Résumé" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear form" }));
    await expect(input.files).toHaveLength(0);
    await waitFor(() => expect(canvas.queryByRole("button", { name: /^Remove/ })).toBeNull());
  },
};

/** Drops a file on an element, as dragging one from the desktop does */
function drop(target: Element, files: File[]) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  const over = new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer });
  target.dispatchEvent(over);
  target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
  return over;
}

/**
 * Remove sits over the end of the field, so a file dragged there lands on it, not on the input. It goes to the field,
 * as if it had landed on the input, rather than the browser opening it in the tab and leaving the form. Without
 * `multiple`, only the first file is kept.
 */
export const DropOnRemove: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} />
      </WithFiles>
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} label="Cover letter" disabled />
      </WithFiles>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText("Résumé", { selector: "input" }) as HTMLInputElement;
    const remove = canvas.getByRole("button", { name: "Remove file, Résumé" });
    const over = drop(remove, [pdf("new-cv.pdf"), pdf("extra.pdf")]);
    await expect(over.defaultPrevented).toBe(true);
    await expect([...(input.files ?? [])].map((file) => file.name)).toEqual(["new-cv.pdf"]);
    await expect(args.onFilesChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: "new-cv.pdf" })], expect.anything());
    // On a disabled field, the drop is still caught, so the browser doesn't open the file, and nothing changes
    const disabled = canvas.getByLabelText("Cover letter", { selector: "input" }) as HTMLInputElement;
    const disabledRemove = canvas.getByRole("button", { name: "Remove file, Cover letter" });
    const disabledOver = drop(disabledRemove, [pdf("other.pdf")]);
    await expect(disabledOver.defaultPrevented).toBe(true);
    await expect([...(disabled.files ?? [])].map((file) => file.name)).toEqual(["cv.pdf"]);
  },
};

/**
 * At 320px wide, on touch, in hot dog: a long file name stays inside the field and stops before Remove; the browser
 * shortens it.
 */
export const NarrowScreen: Story = {
  decorators: [(Story) => <div data-theme="hotdog" data-pointer="coarse" className="w-80 p-4" style={{ background: "var(--bg)" }}><Story /></div>],
  render: (args) => (
    <WithFiles files={["jordan-rivera-resume-senior-product-designer-final-version-3.pdf"]}>
      <FileInput {...args} />
    </WithFiles>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByLabelText("Résumé", { selector: "input" }) as HTMLInputElement;
    await expect(input.files).toHaveLength(1);
    await expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    // The text's room ends where Remove begins: the content box's end is at or before Remove's start
    const style = getComputedStyle(input);
    const contentEnd = input.getBoundingClientRect().right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
    const remove = canvas.getByRole("button", { name: "Remove file, Résumé" });
    await expect(contentEnd).toBeLessThanOrEqual(remove.getBoundingClientRect().left + 0.5);
    const container = canvasElement.querySelector<HTMLElement>("[data-pointer]")!;
    await expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(container.getBoundingClientRect().right);
  },
};

/** The inner button's box, from the browser, and the field's rect */
function innerButton(input: HTMLInputElement) {
  const style = getComputedStyle(input, "::file-selector-button");
  return { height: parseFloat(style.height), padding: parseFloat(getComputedStyle(input).paddingTop) };
}

/**
 * The whole field opens the picker, and the inner button is drawn inside it, `space-1` from its outer edge. Remove's hit
 * area is a square as tall as the field, right up to its end. Checked with a real hit-test, with a mouse and on touch,
 * in both densities, at both sizes. Edges are tested at their middles: the field's rounded corners aren't part of it.
 */
export const HitAreas: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <FileInput {...args} label="Medium, empty" />
      <FileInput {...args} size="lg" label="Large, empty" />
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} label="Medium, chosen" />
      </WithFiles>
      <WithFiles files={["cv.pdf"]}>
        <FileInput {...args} size="lg" label="Large, chosen" />
      </WithFiles>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const empty = ["Medium, empty", "Large, empty"].map((name) => canvas.getByLabelText(name, { selector: "input" }) as HTMLInputElement);
    const chosen = ["Medium, chosen", "Large, chosen"].map((name) => canvas.getByLabelText(name, { selector: "input" }) as HTMLInputElement);
    for (const density of ["comfortable", "compact"] as const) {
      if (density === "compact") canvasElement.dataset.density = "compact";
      try {
        await withMouseAndTouch(canvasElement, async (floor) => {
          const target = measure("--target-min", canvasElement);
          await expect(target).toBeGreaterThanOrEqual(floor);
          const inset = measure("--space-1", canvasElement);
          for (const input of [...empty, ...chosen]) {
            const field = input.getBoundingClientRect();
            await expect(field.height).toBeGreaterThanOrEqual(target);
            // The inner button: space-1 in from the outer edge, top and bottom
            const inner = innerButton(input);
            await expect(inner.height).toBeCloseTo(field.height - 2 * inset, 0);
            const edge = parseFloat(getComputedStyle(input).borderTopWidth);
            await expect(inner.padding + edge).toBeCloseTo(inset, 0);
          }
          for (const input of empty) {
            const field = input.getBoundingClientRect();
            const midX = field.left + field.width / 2;
            const midY = field.top + field.height / 2;
            const points: [number, number][] = [
              [midX, midY],
              [field.left + inset + 8, midY], // the inner button
              [midX, field.top + 1],
              [midX, field.bottom - 1],
              [field.left + 1, midY],
              [field.right - 1, midY],
            ];
            for (const [x, y] of points) await expect(document.elementFromPoint(x, y)).toBe(input);
          }
          for (const input of chosen) {
            const field = input.getBoundingClientRect();
            const remove = input.parentElement!.querySelector<HTMLElement>(".file-input__remove")!;
            const box = remove.getBoundingClientRect();
            await expect(box.width).toBeCloseTo(field.height, 0);
            await expect(box.height).toBeCloseTo(field.height, 0);
            const midY = box.top + box.height / 2;
            const midX = box.left + box.width / 2;
            for (const [x, y] of [[midX, midY], [midX, box.top + 1], [midX, box.bottom - 1], [box.right - 1, midY]] as const) {
              await expect(remove.contains(document.elementFromPoint(x, y))).toBe(true);
            }
            await expect(document.elementFromPoint(box.left - 1, midY)).toBe(input);
          }
        });
      } finally {
        delete canvasElement.dataset.density;
      }
    }
  },
};

/** The field in a shadow root with only its own CSS, and no CSS reset */
function ShadowFileInput() {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  // A layout effect, so the shadow root and its parts are there before the play function starts
  useLayoutEffect(() => {
    const element = host.current;
    if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={host} data-shadow-host="">
      {root &&
        createPortal(
          <>
            {[fieldCss, textFieldCss, visuallyHiddenCss, insetButtonCss, fileInputCss].map((css, i) => (
              <style key={i}>{css}</style>
            ))}
            <FileInput label="Résumé" />
          </>,
          root,
        )}
    </div>
  );
}

/**
 * On a site with no CSS reset, the browser draws its own "Choose file" button, with its own fill, edge, padding, and
 * font. Storybook loads Tailwind's reset, which restyles it too, so this field sits in a shadow root with only its own
 * CSS. The inner button still has the surface fill, a 1px strong edge, its own padding and corners, and the field's
 * font.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowFileInput />,
  play: async ({ canvasElement }) => {
    // Tokens are measured in the canvas: a probe inside the shadow host would be in no slot, so never drawn
    const host = canvasElement.querySelector<HTMLElement>("[data-shadow-host]")!;
    await waitFor(() => expect(host.shadowRoot?.querySelector('input[type="file"]')).toBeTruthy());
    const input = fileInputOf(host.shadowRoot!);
    const style = getComputedStyle(input, "::file-selector-button");
    await expect(style.backgroundColor).toBe(tokenColor("--surface", canvasElement));
    await expect(style.borderTopColor).toBe(tokenColor("--border-strong", canvasElement));
    await expect(style.borderTopWidth).toBe("1px");
    await expect(parseFloat(style.paddingLeft)).toBeCloseTo(measure("--space-3", canvasElement), 1);
    await expect(parseFloat(style.marginLeft)).toBe(0);
    await expect(parseFloat(style.marginRight)).toBeCloseTo(measure("--space-3", canvasElement), 1);
    await expect(parseFloat(style.borderTopLeftRadius)).toBeCloseTo(measure("--radius-sm", canvasElement), 1);
    await expect(style.fontFamily).toBe(getComputedStyle(input).fontFamily);
  },
};

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <FileInput label="Empty" description="PDF or Word document, up to 5 MB." />
      <WithFiles files={["cv.pdf"]}>
        <FileInput label="One file chosen" />
      </WithFiles>
      <WithFiles files={["essay.pdf", "letter.pdf"]}>
        <FileInput label="Two files chosen" multiple />
      </WithFiles>
      <WithFiles files={["cv.pdf"]}>
        <FileInput label="Large" size="lg" />
      </WithFiles>
      <FileInput aria-label="Profile photo" />
      <FileInput label="Invalid" invalid error="Choose a résumé to upload." />
      <WithFiles files={["cv.pdf"]}>
        <FileInput label="Invalid, with a file" invalid error="Choose a file smaller than 5 MB." />
      </WithFiles>
      <FileInput label="Disabled" disabled />
      <WithFiles files={["cv.pdf"]}>
        <FileInput label="Disabled with a file" disabled />
      </WithFiles>
    </div>
  );
}

/** Every state in all three themes at once. Chromatic snapshots this one. */
export const AllThemes: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-4 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          <Matrix />
        </section>
      ))}
    </div>
  ),
};
