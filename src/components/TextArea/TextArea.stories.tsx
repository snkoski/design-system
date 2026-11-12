import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea/TextArea";

// Fields fill their container, so give single stories a realistic width. (Defined outside meta: written
// inline, its context argument breaks Storybook's inference of the story args.)
const realisticWidth: Decorator = (Story, { parameters }) =>
  parameters.layout === "fullscreen" ? <Story /> : <div className="w-80"><Story /></div>;

const longText =
  "Thanks for the quick reply. I'd love to talk about the new site: we need a portfolio, a contact form, and somewhere to post the occasional article. Hot dog mode is non-negotiable. Could we meet next week? Tuesday or Thursday afternoon works best for me, and I can bring the old brand files.";

/** The px value of a length token, measured in the browser. Pass a parent to see its `data-pointer`. */
function measure(token: string, parent: HTMLElement = document.body) {
  const probe = document.createElement("div");
  probe.style.height = `var(${token})`;
  parent.append(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

const meta = {
  title: "Components/Text area",
  component: TextArea,
  args: {
    label: "Message",
    size: "md",
    rows: 4,
    resize: "vertical",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    resize: { control: "inline-radio", options: ["vertical", "none"] },
    rows: { control: { type: "number", min: 1, max: 20 } },
    value: { control: false },
    ref: { control: false },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
  },
  decorators: [realisticWidth],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Empty, filled, overflowing, invalid, disabled, and read-only. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} label="Empty" />
      <TextArea {...args} label="Filled" defaultValue={"Hi Ada,\nThanks for the quick reply."} />
      <TextArea {...args} label="Longer than it is tall" defaultValue={longText} />
      <TextArea {...args} label="Invalid" invalid error="Write a message before sending." />
      <TextArea {...args} label="Disabled" disabled defaultValue="Messages are closed." />
      <TextArea {...args} label="Read only" readOnly defaultValue="Sent on Tuesday." />
    </div>
  ),
};

/** Medium is the default. Large matches a large Input, so the two line up in a form. */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} size="md" label="Medium" />
      <TextArea {...args} size="lg" label="Large" />
    </div>
  ),
};

/**
 * `rows` sets how tall it starts. One row is as tall as an Input, and the story checks it still meets `target-min`
 * at both sizes: 24px with a mouse, 44px on touch.
 */
export const Rows: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} rows={1} label="One row" />
      <TextArea {...args} rows={1} size="lg" label="One row, large" />
      <TextArea {...args} rows={4} label="Four rows (the default)" />
      <TextArea {...args} rows={8} label="Eight rows" />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const check = async (floor: number) => {
      const target = measure("--target-min", canvasElement);
      await expect(target).toBeGreaterThanOrEqual(floor);
      for (const name of ["One row", "One row, large"]) {
        await expect(canvas.getByRole("textbox", { name }).getBoundingClientRect().height).toBeGreaterThanOrEqual(target);
      }
    };
    // With a mouse, target-min is 24px
    await check(24);
    // On touch, target-min is 44px, and a one-row text area grows to meet it
    canvasElement.dataset.pointer = "coarse";
    try {
      await check(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/**
 * People can drag it taller from the corner, but never wider. Turn that off with `resize="none"`; a disabled
 * text area can't be resized either. The story checks the browser gets each setting.
 */
export const Resize: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <TextArea {...args} label="Drag the corner to make it taller" />
      <TextArea {...args} resize="none" label="Fixed height" />
      <TextArea {...args} disabled label="Disabled" />
    </div>
  ),
  play: async ({ canvas }) => {
    const resizeOf = (name: string) => getComputedStyle(canvas.getByRole("textbox", { name })).resize;
    await expect(resizeOf("Drag the corner to make it taller")).toBe("vertical");
    await expect(resizeOf("Fixed height")).toBe("none");
    await expect(resizeOf("Disabled")).toBe("none");
  },
};

/** The description sits between the label and the field, so people read it before they type. */
export const WithDescription: Story = {
  args: { label: "Message", description: "Tell us about your project. We reply within two days." },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: { label: "Message (required)", required: true, invalid: true, error: "Write a message before sending." },
};

/** Placeholders show an example. They never replace the label, because they disappear as you type. */
export const WithPlaceholder: Story = {
  args: { label: "Message", placeholder: "Hi, I'd like to talk about…" },
};

/** A disabled field can't be focused, changed, resized, or submitted. */
export const Disabled: Story = {
  args: { label: "Message", disabled: true, defaultValue: "Messages are closed." },
};

/** Read-only stays focusable, so its text can be read and copied, and it is submitted with the form. */
export const ReadOnly: Story = {
  args: { label: "Notes", readOnly: true, defaultValue: "Sent on Tuesday." },
};

/** A field with no visible label needs an `aria-label`. */
export const WithoutVisibleLabel: Story = {
  args: { label: undefined, "aria-label": "Reply", placeholder: "Write a reply" },
};

/** Enter adds a new line instead of submitting the form; the button sends it. */
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
        <TextArea label="Message" name="message" />
        <Button type="submit" variant="secondary" className="justify-self-start">Send message</Button>
        <output>{sent && `Sent ${sent.split("\n").length} lines`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Message" }), "Hi Ada,{Enter}Thanks!");
    await expect(canvas.getByRole("status")).toHaveTextContent("");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Sent 2 lines");
  },
};

/**
 * An Input and a TextArea side by side, at both sizes and in all three themes. Their first lines of text sit at
 * the same height, which the story checks.
 */
export const BesideInput: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid">
      {(["light", "dark", "hotdog"] as const).map((theme) => (
        <section key={theme} data-theme={theme} className="grid gap-6 p-8" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <h2 className="text-label">{theme === "hotdog" ? "Hot dog" : theme}</h2>
          {(["md", "lg"] as const).map((size) => (
            <div key={size} className="grid grid-cols-2 items-start gap-4" data-testid={`${theme}-${size}`} style={{ maxWidth: "40rem" }}>
              <Input label={`Subject (${size})`} size={size} defaultValue="New website" />
              <TextArea label={`Message (${size})`} size={size} rows={2} defaultValue={"Hi Ada,\nCould we talk next week?"} />
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const firstLine = (field: HTMLElement) => {
      const box = field.getBoundingClientRect();
      const style = getComputedStyle(field);
      const lineHeight = parseFloat(style.lineHeight);
      // An input centers its line in its height; a textarea starts it after its edge and padding
      return field.tagName === "INPUT"
        ? box.top + (box.height - lineHeight) / 2
        : box.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
    };
    for (const theme of ["light", "dark", "hotdog"]) {
      for (const size of ["md", "lg"]) {
        const row = canvas.getByTestId(`${theme}-${size}`);
        const [input, textArea] = [row.querySelector("input")!, row.querySelector("textarea")!];
        await expect(Math.abs(firstLine(input) - firstLine(textArea))).toBeLessThan(0.5);
      }
    }
  },
};

function Matrix() {
  return (
    <div className="grid w-80 gap-4">
      <TextArea label="Empty" />
      <TextArea label="Filled" defaultValue={"Hi Ada,\nThanks for the quick reply."} />
      <TextArea label="Longer than it is tall" rows={3} defaultValue={longText} />
      <TextArea label="Placeholder" placeholder="Hi, I'd like to talk about…" />
      <TextArea label="Large" size="lg" rows={2} defaultValue="Thanks!" />
      <TextArea label="One row" rows={1} defaultValue="Short note" />
      <TextArea label="Fixed height" resize="none" rows={2} />
      <TextArea aria-label="No visible label" rows={2} defaultValue="A reply" />
      <TextArea label="With a description" rows={2} description="We reply within two days." />
      <TextArea label="Invalid (required)" rows={2} required invalid error="Write a message before sending." />
      <TextArea label="Disabled" rows={2} disabled defaultValue="Messages are closed." />
      <TextArea label="Read only" rows={2} readOnly defaultValue="Sent on Tuesday." />
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
