import type { Meta, StoryObj } from "@storybook/react-vite";
import { Lock } from "lucide-react";
import type { ReactElement } from "react";
import { expect } from "storybook/test";
import { Checkbox } from "../../components/Checkbox";
import { Input } from "../../components/Input";
import { Radio, RadioGroup } from "../../components/RadioGroup";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Switch } from "../../components/Switch";
import { TextArea } from "../../components/TextArea";
import { Option, Options, Themes } from "./Compare";
import "./read-only.css";

const meta = {
  title: "Revisit/How read-only fields look",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** "Read only" and a lock, beside a label. Hidden from screen readers, which already announce each control as read only. */
function Note() {
  return (
    <span className="ro-note__tag" aria-hidden="true">
      <Lock />
      Read only
    </span>
  );
}

/** Every form control, read-only, with a value. With `note`, each label says "Read only" in words. */
function Controls({ id, note = false }: { id: string; note?: boolean }) {
  const label = (text: string): ReactElement | string => (note ? <>{text}<Note /></> : text);

  return (
    <>
      <Input label={label("Email")} name={`${id}-email`} defaultValue="ana@example.com" readOnly className="w-full" />
      <TextArea
        label={label("Delivery notes")}
        name={`${id}-notes`}
        defaultValue="Leave it with the neighbor at number 12 if nobody answers."
        rows={2}
        readOnly
        className="w-full"
      />
      <Checkbox name={`${id}-newsletter`} defaultChecked readOnly>
        {label("Send me the newsletter")}
      </Checkbox>
      <Switch name={`${id}-updates`} defaultChecked readOnly>
        {label("Email me when it ships")}
      </Switch>
      <RadioGroup label={label("Delivery speed")} name={`${id}-speed`} defaultValue="standard" readOnly>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
      </RadioGroup>
      <SegmentedControl label={label("Billing")} name={`${id}-billing`} defaultValue="yearly" readOnly>
        <Segment value="monthly">Monthly</Segment>
        <Segment value="yearly">Yearly</Segment>
        <Segment value="lifetime">Lifetime</Segment>
      </SegmentedControl>
    </>
  );
}

/**
 * Three ways to show a read-only field: each control's own dim (today), the field drawn as plain text with no dim,
 * and a "Read only" note with a lock beside the label, with no dim. Input, TextArea, Checkbox, Switch, RadioGroup,
 * and SegmentedControl, each read-only with a value, in all three themes. Settles "How read-only fields look" in
 * `docs/revisit.md`.
 */
export const SideBySide: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option
            title="Each control dims (today)"
            note="Text fields dim to 75% and keep the label at full strength. Checkboxes, switches, and radios dim the control. A segmented control dims only the options that aren't chosen."
          >
            <Controls id={`${theme}-today`} />
          </Option>
          <Option
            title="Plain text"
            note="Text fields lose their edge, background, and padding, so the value reads like the text around it. Choice controls have nothing to drop, so they just stay at full strength."
            className="ro-plain"
          >
            <Controls id={`${theme}-plain`} />
          </Option>
          <Option
            title="A note in words"
            note="Every control at full strength, with “Read only” and a lock beside its label. The note is hidden from screen readers, which already announce read only."
            className="ro-note"
          >
            <Controls id={`${theme}-note`} note />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The options really differ: today dims, the other two don't, and plain text has no visible edge
    const [today, plain, note] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const style = (root: HTMLElement, selector: string) => getComputedStyle(root.querySelector(selector)!);
    for (const selector of [".input__control", ".text-area__control", ".checkbox__box", ".switch__track", ".radio__circle"]) {
      await expect(style(today!, selector).opacity).toBe("0.75");
      await expect(style(plain!, selector).opacity).toBe("1");
      await expect(style(note!, selector).opacity).toBe("1");
    }
    await expect(style(today!, ".input__control").borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(style(plain!, ".input__control").borderTopColor).toBe("rgba(0, 0, 0, 0)");
    await expect(note!.querySelectorAll(".ro-note__tag")).toHaveLength(6);
  },
};
