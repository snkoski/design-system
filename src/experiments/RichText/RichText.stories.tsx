import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, spyOn, waitFor } from "storybook/test";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { RichText } from "./RichText";

// Fields fill their container, so give single stories a realistic width: wide enough for the toolbar on one row.
// (Defined outside meta: written inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-[32rem] max-w-full"><Story /></div>;

const everyFormat = [
  "**Bold**, *italic*, <u>underlined</u>, ~~struck through~~, `inline code`, and [a link](https://example.com).",
  "",
  "> A quote from the last message.",
  "",
  "- A bulleted item",
  "- Another one",
  "",
  "1. A numbered item",
  "2. The next one",
  "",
  "```",
  "const theme = 'hotdog';",
  "```",
].join("\n");

const longMessage = ["Hi Ada,", "", "Thanks for the quick reply.", "", "Could we meet next week?", "", "Tuesday works best.", "", "Shawn"].join("\n");

/** The px value of a length token, measured in the browser */
function measure(token: string) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  document.body.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

/** The key Mod stands for here: Cmd on a Mac, Ctrl elsewhere (CI runs on Linux) */
const mod = () => (/mac/i.test(navigator.platform) ? "Meta" : "Control");

/** WCAG contrast between two computed colors (`rgb(…)` strings, as getComputedStyle returns them) */
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((part) => {
      const value = Number(part) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const meta = {
  title: "Experiments/Rich text",
  component: RichText,
  args: {
    label: "Message",
    size: "md",
    rows: 1,
    maxRows: 4,
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    rows: { control: { type: "number", min: 1, max: 10 } },
    maxRows: { control: { type: "number", min: 1, max: 20 } },
    value: { control: false },
    ref: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. Try typing `**bold**`, `- ` at the start of a line, or Cmd+B. */
export const Playground: Story = {
  args: { placeholder: "Write a message" },
};

/** Empty, filled, every format, longer than it grows, invalid, disabled, and read-only. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <RichText {...args} label="Empty" placeholder="Write a message" />
      <RichText {...args} label="Filled" defaultValue="**Hi Ada,** thanks for the *quick* reply." />
      <RichText {...args} label="Every format" defaultValue={everyFormat} />
      <RichText {...args} label="Longer than it grows" defaultValue={longMessage} />
      <RichText {...args} label="Invalid" invalid error="Write a message before sending." />
      <RichText {...args} label="Disabled" disabled defaultValue="Messages are **closed**." />
      <RichText {...args} label="Read only" readOnly defaultValue="Sent on **Tuesday**, with [the brief](https://example.com)." />
    </div>
  ),
};

/** Every format the field has, loaded from markdown and drawn as it will look. */
export const Formats: Story = {
  args: { label: "Message", defaultValue: everyFormat },
};

/**
 * Click a button (or press its shortcut) and keep typing: the field keeps its caret, so the new style starts
 * right where you are. The story bolds a word with the toolbar and checks the markdown.
 */
export const Toolbar: Story = {
  render: (args) => {
    const [markdown, setMarkdown] = useState("");
    return (
      <div className="grid gap-3">
        <RichText {...args} label="Message" onValueChange={setMarkdown} />
        <output className="text-small">{markdown}</output>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("Hello ");
    await userEvent.click(canvas.getByRole("button", { name: "Bold" }));
    await expect(canvas.getByRole("textbox", { name: "Message" })).toHaveFocus();
    await userEvent.keyboard("world");
    await expect(canvas.getByRole("status")).toHaveTextContent("Hello **world**");
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  },
};

/** Markdown typed by hand turns into formatting as you type: `**bold**`, `- ` for a list, `> ` for a quote. */
export const TypingMarkdown: Story = {
  render: (args) => {
    const [markdown, setMarkdown] = useState("");
    return (
      <div className="grid gap-3">
        <RichText {...args} label="Message" onValueChange={setMarkdown} />
        <output className="text-small whitespace-pre-wrap">{markdown}</output>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(field);
    await userEvent.keyboard("A **bold** idea{Enter}- first{Enter}second");
    await expect(field.querySelector("strong")).toHaveTextContent("bold");
    await expect(field.querySelectorAll("li")).toHaveLength(2);
    await expect(canvas.getByRole("status")).toHaveTextContent("A **bold** idea - first - second");
  },
};

/** Pasted plain text is read as markdown, so a message copied from somewhere that stores markdown keeps its look. */
export const PasteMarkdown: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(field);
    await userEvent.paste("Pasted **bold** and `code`");
    await expect(field.querySelector("strong")).toHaveTextContent("bold");
    await expect(field.querySelector("code")).toHaveTextContent("code");
  },
};

/**
 * Select text and press the link button (or Cmd+K) to add a link. With nothing selected, it asks for the text
 * too. Only web and email addresses are accepted; `example.com` becomes `https://example.com`.
 */
export const Links: Story = {
  args: { defaultValue: "Read the brief before Tuesday." },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(field);
    await userEvent.keyboard(`{${mod()}>}a{/${mod()}}`);
    await userEvent.click(canvas.getByRole("button", { name: "Add link" }));
    const dialog = await findPopup("dialog", "Link");
    const address = [...dialog.querySelectorAll("input")].find((input) => input.labels?.[0]?.textContent === "Link address")!;
    await waitFor(() => expect(address).toHaveFocus());
    await userEvent.type(address, "example.com{Enter}");
    await waitFor(() => expect(field.querySelector("a")).toHaveAttribute("href", "https://example.com"));
  },
};

/** Finds a popup by role and name; popups are portalled outside the story's canvas. */
async function findPopup(role: string, name: string) {
  let found: HTMLElement | null = null;
  await waitFor(() => {
    found = [...document.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find((el) => el.getAttribute("aria-label") === name) ?? null;
    expect(found).not.toBeNull();
  });
  return found!;
}

/**
 * Links aren't followed while you're editing, so clicking one puts the caret in it. In a read-only field the
 * browser follows them, in a new tab. The story checks both with a real click, and stops the navigation itself.
 */
export const FollowingLinks: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <RichText {...args} label="Editing" defaultValue="Read [the brief](https://example.com)." />
      <RichText {...args} label="Read only" readOnly defaultValue="Read [the brief](https://example.com)." />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const open = spyOn(window, "open").mockImplementation(() => null);
    // Runs after the page's own handlers: notes whether the browser would follow the link, then stops it
    let followed = false;
    const stop = (event: MouseEvent) => {
      followed = !event.defaultPrevented && (event.target as Element).closest("a") !== null;
      event.preventDefault();
    };
    window.addEventListener("click", stop);
    try {
      const editing = canvas.getByRole("textbox", { name: "Editing" });
      await userEvent.click(editing.querySelector("a")!);
      await expect(open).not.toHaveBeenCalled();
      await expect(editing).toHaveFocus();
      const readOnly = canvas.getByRole("textbox", { name: "Read only" }).querySelector("a")!;
      await expect(readOnly).toHaveAttribute("target", "_blank");
      await userEvent.click(readOnly);
      await expect(followed).toBe(true);
    } finally {
      window.removeEventListener("click", stop);
      open.mockRestore();
    }
  },
};

/**
 * One line tall to start, the same height as an Input, growing a line at a time to four lines, then scrolling.
 * The story checks the heights.
 */
export const Growing: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Message" });
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight);
    const oneLine = measure("--control-md");
    await expect(oneLine).toBeGreaterThan(0);
    await expect(field.getBoundingClientRect().height).toBeCloseTo(oneLine, 0);
    await userEvent.click(field);
    await userEvent.keyboard("one{Enter}two{Enter}three{Enter}four");
    await expect(field.getBoundingClientRect().height).toBeCloseTo(oneLine + 3 * lineHeight, 0);
    await userEvent.keyboard("{Enter}five{Enter}six");
    await expect(field.getBoundingClientRect().height).toBeCloseTo(oneLine + 3 * lineHeight, 0);
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);
  },
};

/** Medium is the default. Large matches a large Input. */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <RichText {...args} size="md" label="Medium" defaultValue="Thanks!" />
      <RichText {...args} size="lg" label="Large" defaultValue="Thanks!" />
    </div>
  ),
};

/**
 * Every toolbar button is a full 44px target in both directions, so buttons next to each other never take each
 * other's clicks. The story hit-tests the middle and the corners of each one.
 */
export const ToolbarTargets: Story = {
  play: async ({ canvas }) => {
    const target = measure("--target-min");
    await expect(target).toBeGreaterThan(0);
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(10);
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(target);
      await expect(box.height).toBeGreaterThanOrEqual(target);
      // The middle and the middle of each edge (the very corners are rounded off)
      const [midX, midY] = [box.left + box.width / 2, box.top + box.height / 2];
      for (const [x, y] of [
        [midX, midY],
        [box.left + 1, midY],
        [box.right - 1, midY],
        [midX, box.top + 1],
        [midX, box.bottom - 1],
      ] as const) {
        await expect(button.contains(document.elementFromPoint(x, y))).toBe(true);
      }
    }
  },
};

/** The description sits between the label and the field, so people read it before they type. */
export const WithDescription: Story = {
  args: { description: "Markdown works too: **bold**, *italic*, `code`." },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: { label: "Message (required)", required: true, invalid: true, error: "Write a message before sending." },
};

/** Placeholders show an example. They never replace the label, because they disappear as you type. */
export const WithPlaceholder: Story = {
  args: { placeholder: "Write a message" },
};

/** A disabled field can't be focused, changed, formatted, or submitted. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Messages are **closed**." },
};

/**
 * Read-only stays focusable, so its text can be read and copied, and it is submitted with the form. It has no
 * toolbar, since none of it could be used.
 */
export const ReadOnly: Story = {
  args: { label: "Notes", readOnly: true, defaultValue: "Sent on **Tuesday**." },
};

/** A field with no visible label needs an `aria-label`. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Reply", placeholder: "Write a reply" },
};

/** The form gets the markdown under the field's name. Enter adds a line; the button sends it. */
export const InAForm: Story = {
  render: () => {
    const [sent, setSent] = useState("");
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(String(new FormData(event.currentTarget).get("message")));
        }}
      >
        <RichText label="Message" name="message" />
        <Button type="submit" variant="secondary" className="justify-self-start">
          Send message
        </Button>
        <output>{sent && `Sent: ${sent}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("Hi **Ada**");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent: Hi **Ada**");
  },
};

/**
 * An Input and a RichText side by side, at both sizes. At one line, the field's text sits at the same height
 * as the Input's, under the toolbar. The story checks the field and the Input are the same height.
 */
export const BesideInput: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid gap-6 p-8">
      {(["md", "lg"] as const).map((size) => (
        <div key={size} className="grid grid-cols-2 items-end gap-4" data-testid={size} style={{ maxWidth: "60rem" }}>
          <Input label={`Subject (${size})`} size={size} defaultValue="New website" />
          <RichText label={`Message (${size})`} size={size} defaultValue="Could we talk **next week**?" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const size of ["md", "lg"]) {
      const row = canvas.getByTestId(size);
      const input = row.querySelector("input")!.getBoundingClientRect();
      const editor = row.querySelector<HTMLElement>('[role="textbox"][contenteditable]')!.getBoundingClientRect();
      await expect(Math.abs(input.height - editor.height)).toBeLessThan(0.5);
    }
  },
};

function Matrix() {
  return (
    <div className="grid w-[32rem] max-w-full gap-4">
      <RichText label="Empty" placeholder="Write a message" />
      <RichText label="Bold and quoted, so those buttons show on" defaultValue="> **Bold** in a quote" />
      <RichText label="Every format" maxRows={12} defaultValue={everyFormat} />
      <RichText label="Longer than it grows" defaultValue={longMessage} />
      <RichText label="Large" size="lg" defaultValue="Thanks!" />
      <RichText aria-label="No visible label" defaultValue="A reply" />
      <RichText label="With a description" description="Markdown works too." />
      <RichText label="Invalid (required)" required invalid error="Write a message before sending." />
      <RichText label="Disabled" disabled defaultValue="Messages are **closed**." />
      <RichText label="Read only" readOnly defaultValue="Sent on **Tuesday**." />
    </div>
  );
}

/**
 * Every state in all three themes at once. Chromatic snapshots this one. The story also checks the contrast of
 * what pnpm check can't see in an experiment: inline code, the pressed toggle's edge, links, and code blocks.
 */
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
  play: async ({ canvasElement }) => {
    // Colors change with a short transition when the toolbar catches up with the caret: measure the end state
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
    for (const section of canvasElement.querySelectorAll<HTMLElement>("section[data-theme]")) {
      const theme = section.dataset.theme;
      const field = [...section.querySelectorAll<HTMLElement>(".rich-text")].find((el) => el.textContent?.includes("Every format"))!;
      const surface = getComputedStyle(field.querySelector(".rich-text__box")!).backgroundColor;
      const code = getComputedStyle(field.querySelector(".rich-text__editor p code")!);
      const link = getComputedStyle(field.querySelector(".rich-text__editor a")!);
      const block = getComputedStyle(field.querySelector(".rich-text__editor pre")!);
      const pressed = section.querySelector<HTMLElement>('.rich-text__tool[aria-pressed="true"]')!;
      await expect(pressed, `${theme}: a pressed toggle`).not.toBeNull();
      await expect(contrast(code.color, code.backgroundColor), `${theme}: inline code on its background`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(code.color, surface), `${theme}: inline code on surface`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(link.color, surface), `${theme}: link on surface`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(block.color, block.backgroundColor), `${theme}: code block text`).toBeGreaterThanOrEqual(4.5);
      await expect(contrast(getComputedStyle(pressed).borderTopColor, surface), `${theme}: pressed toggle edge on surface`).toBeGreaterThanOrEqual(3);
      await expect(contrast(getComputedStyle(pressed).color, getComputedStyle(pressed).backgroundColor), `${theme}: pressed toggle icon`).toBeGreaterThanOrEqual(3);
    }
  },
};
