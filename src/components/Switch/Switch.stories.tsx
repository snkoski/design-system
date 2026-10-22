import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Button } from "../Button";
import { Switch } from "./Switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  args: {
    children: "Email me about new projects",
    defaultChecked: false,
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    onCheckedChange: fn(),
  },
  argTypes: {
    checked: { control: false },
    ref: { control: false },
    inputRef: { control: false },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change any prop in the Controls panel. */
export const Playground: Story = {};

/** Off and on. The thumb's position says which, so the state never relies on color alone. */
export const States: Story = {
  render: (args) => (
    <div className="grid gap-1">
      <Switch {...args}>Off</Switch>
      <Switch {...args} defaultChecked>On</Switch>
    </div>
  ),
};

/** The description is linked to the switch, so screen readers read it after the label. */
export const WithDescription: Story = {
  args: {
    children: "Email me about new projects",
    description: "About once a month. You can turn this off at any time.",
  },
};

/** Pair `invalid` with `error`: the message has an icon and words, so the problem isn't only red. */
export const Invalid: Story = {
  args: {
    children: "Share my portfolio publicly (required)",
    required: true,
    invalid: true,
    error: "Turn this on to publish your portfolio.",
  },
};

/** A disabled switch can't be focused or changed. It keeps its state. */
export const Disabled: Story = {
  render: (args) => (
    <div className="grid gap-1">
      <Switch {...args} disabled>Off and disabled</Switch>
      <Switch {...args} disabled defaultChecked>On and disabled</Switch>
    </div>
  ),
};

/** Read-only keeps the switch in the tab order, so its value can still be read, but blocks changes. */
export const ReadOnly: Story = {
  args: { children: "Two-step sign-in", readOnly: true, defaultChecked: true },
};

/** With no visible label, an `aria-label` is required. The hit area is still `target-min`: 24px with a mouse, 44px on touch. */
export const WithoutVisibleLabel: Story = {
  args: { children: undefined, "aria-label": "Dark mode" },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole("switch", { name: "Dark mode" });
    const height = () => control.closest(".switch")!.getBoundingClientRect().height;
    // With a mouse, its own box is choice-row tall (32px), more than its 24px hit area
    await expect(height()).toBeGreaterThanOrEqual(32);
    // On touch, its box is target-min tall, so its 44px hit area doesn't spill into the control above or below it
    canvasElement.dataset.pointer = "coarse";
    try {
      await expect(height()).toBeGreaterThanOrEqual(44);
    } finally {
      delete canvasElement.dataset.pointer;
    }
  },
};

/** `uncheckedValue` makes an off switch submit a value too, which suits on/off settings. */
export const InAForm: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const entries = [...new FormData(event.currentTarget).entries()];
          setSubmitted(entries.map(([key, value]) => `${key}=${String(value)}`).join(", "));
        }}
      >
        <Switch name="newsletter" value="yes" uncheckedValue="no">Newsletter</Switch>
        <Switch name="alerts" value="yes" uncheckedValue="no" defaultChecked>Project alerts</Switch>
        <Button type="submit" variant="secondary" className="justify-self-start">Save settings</Button>
        <output>{submitted && `Submitted: ${submitted}`}</output>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Newsletter" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save settings" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Submitted: newsletter=yes, alerts=yes");
  },
};

function Matrix() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <Switch>Off</Switch>
        <Switch defaultChecked>On</Switch>
        <Switch aria-label="No visible label" defaultChecked />
      </div>
      <div className="grid gap-1">
        <Switch disabled>Disabled</Switch>
        <Switch disabled defaultChecked>Disabled and on</Switch>
        <Switch readOnly defaultChecked>Read only</Switch>
      </div>
      <Switch defaultChecked description="About once a month. You can turn this off at any time.">
        With a description
      </Switch>
      <Switch required invalid error="Turn this on to publish your portfolio.">
        Invalid, with an error (required)
      </Switch>
      <Switch required invalid defaultChecked error="On but still invalid.">
        Invalid and on
      </Switch>
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
