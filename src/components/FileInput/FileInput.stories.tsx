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
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("button", { name: "Remove file, One file chosen" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove files, Two files chosen" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove file, Disabled with a file" })).toBeDisabled();
    // Everything the browser draws is at size 0; the field's own words say what's chosen, at body size
    const empty = canvas.getByLabelText("Empty", { selector: "input" }) as HTMLInputElement;
    const chosen = canvas.getByLabelText("One file chosen", { selector: "input" }) as HTMLInputElement;
    const body = measure("--text-body", canvasElement);
    await expect(body).toBeGreaterThan(0);
    for (const input of [empty, chosen]) {
      await expect(getComputedStyle(input).fontSize).toBe("0px");
      await expect(getComputedStyle(input, "::file-selector-button").fontSize).toBe("0px");
      await expect(parseFloat(getComputedStyle(faceOf(input).words).fontSize)).toBeCloseTo(body, 1);
    }
    await expect(faceOf(empty).words).toHaveTextContent("Choose file");
    await expect(faceOf(chosen).words).toHaveTextContent("cv.pdf");
    await expect(faceOf(canvas.getByLabelText("Two files chosen", { selector: "input" }) as HTMLInputElement).words).toHaveTextContent("2 files");
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

/** With `multiple`, several files can be chosen at once. The field says how many; Remove empties them all. */
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
    await expect(faceOf(input).words).toHaveTextContent("cv.pdf");
    await userEvent.click(canvas.getByRole("button", { name: "Clear form" }));
    await expect(input.files).toHaveLength(0);
    await waitFor(() => expect(canvas.queryByRole("button", { name: /^Remove/ })).toBeNull());
    await expect(faceOf(input).words).toHaveTextContent("Choose file");
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
    // The long name is shortened, and ends before Remove begins
    const { words } = faceOf(input);
    await expect(words.textContent).toContain("jordan-rivera");
    await expect(words.scrollWidth).toBeGreaterThan(words.clientWidth);
    const remove = canvas.getByRole("button", { name: "Remove file, Résumé" });
    await expect(words.getBoundingClientRect().right).toBeLessThanOrEqual(remove.getBoundingClientRect().left + 0.5);
    const container = canvasElement.querySelector<HTMLElement>("[data-pointer]")!;
    await expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(container.getBoundingClientRect().right);
  },
};

/** The field's own icon and words, drawn over the input */
function faceOf(input: HTMLInputElement) {
  const face = input.parentElement!.querySelector<HTMLElement>(".file-input__face")!;
  return { face, icon: face.querySelector("svg")!.getBoundingClientRect(), words: face.querySelector<HTMLElement>(".file-input__words")! };
}

/**
 * The whole field opens the picker, its icon and words included. They're centered in the field, the words `space-2`
 * after the icon, and stay centered while Remove shows. Remove's hit
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
          for (const input of [...empty, ...chosen]) {
            const field = input.getBoundingClientRect();
            await expect(field.height).toBeGreaterThanOrEqual(target);
            // The icon and words, centered across and down, the words space-2 after the icon
            const iconSize = measure("--icon-md", canvasElement);
            const gap = measure("--space-2", canvasElement);
            await expect(iconSize).toBeGreaterThan(0);
            await expect(gap).toBeGreaterThan(0);
            const { icon, words } = faceOf(input);
            const text = words.getBoundingClientRect();
            await expect(icon.width).toBeCloseTo(iconSize, 0);
            await expect(text.left - icon.right).toBeCloseTo(gap, 0);
            await expect((icon.left + text.right) / 2).toBeCloseTo(field.left + field.width / 2, 0);
            await expect(icon.top + icon.height / 2).toBeCloseTo(field.top + field.height / 2, 0);
            await expect(text.top + text.height / 2).toBeCloseTo(field.top + field.height / 2, 0);
          }
          for (const input of empty) {
            const field = input.getBoundingClientRect();
            const midX = field.left + field.width / 2;
            const midY = field.top + field.height / 2;
            const iconBox = faceOf(input).icon;
            const wordsBox = faceOf(input).words.getBoundingClientRect();
            await expect(iconBox.width).toBeGreaterThan(0);
            const points: [number, number][] = [
              [midX, midY],
              [iconBox.left + iconBox.width / 2, midY], // the upload icon
              [wordsBox.left + wordsBox.width / 2, midY], // "Choose file"
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
 * CSS. Everything the browser draws is still hidden: its button has no fill, edge, padding, or size left.
 */
export const WithoutCssReset: Story = {
  render: () => <ShadowFileInput />,
  play: async ({ canvasElement }) => {
    // Tokens are measured in the canvas: a probe inside the shadow host would be in no slot, so never drawn
    const host = canvasElement.querySelector<HTMLElement>("[data-shadow-host]")!;
    await waitFor(() => expect(host.shadowRoot?.querySelector('input[type="file"]')).toBeTruthy());
    const input = fileInputOf(host.shadowRoot!);
    const style = getComputedStyle(input, "::file-selector-button");
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(style.borderTopWidth).toBe("0px");
    await expect(style.borderLeftWidth).toBe("0px");
    await expect(parseFloat(style.paddingLeft)).toBe(0);
    await expect(parseFloat(style.marginLeft)).toBe(0);
    await expect(parseFloat(style.marginRight)).toBe(0);
    await expect(style.fontSize).toBe("0px");
    await expect(getComputedStyle(input).fontSize).toBe("0px");
    // The field's own words still show, in ink, at body size
    const { words } = faceOf(input);
    await expect(words).toHaveTextContent("Choose file");
    await expect(getComputedStyle(words).color).toBe(tokenColor("--ink", canvasElement));
    await expect(parseFloat(getComputedStyle(words).fontSize)).toBeCloseTo(measure("--text-body", canvasElement), 1);
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
