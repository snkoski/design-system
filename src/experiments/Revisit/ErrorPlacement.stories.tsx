import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect } from "storybook/test";
import { Checkbox } from "../../components/Checkbox";
import { CheckboxGroup } from "../../components/CheckboxGroup";
import { Input } from "../../components/Input";
import { Radio, RadioGroup } from "../../components/RadioGroup";
import { Segment, SegmentedControl } from "../../components/SegmentedControl";
import { Switch } from "../../components/Switch";
import { TextArea } from "../../components/TextArea";
import { Option, Options, Themes } from "./Compare";
import "./error-placement.css";

const meta = {
  title: "Revisit/Where a field's error goes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The same message, with the hidden "Error:" that forms.md asks for when the error sits above the field */
function message(text: string, prefixed: boolean): ReactNode {
  return prefixed ? (
    <>
      <span className="sr-only">Error: </span>
      {text}
    </>
  ) : (
    text
  );
}

/** Every form control, invalid, with its error where the option puts it */
function Fields({ id, above }: { id: string; above: boolean }) {
  return (
    <>
      <Input
        label="Email address"
        description="We only use it to reply to you."
        invalid
        defaultValue="ada@"
        error={message("Enter an email address like ada@example.com.", above)}
      />
      <TextArea
        label="Message"
        description="Tell me what you're working on."
        invalid
        rows={2}
        error={message("Enter a message.", above)}
      />
      <Checkbox invalid required error={message("Accept the terms to continue.", above)}>
        I accept the terms
      </Checkbox>
      <Switch invalid error={message("Turn on notifications to get booking updates.", above)}>
        Booking notifications
      </Switch>
      <CheckboxGroup
        label="Services"
        description="Pick any that apply."
        invalid
        defaultValue={[]}
        error={message("Choose at least one service.", above)}
      >
        <Checkbox value="design">Design</Checkbox>
        <Checkbox value="development">Development</Checkbox>
        <Checkbox value="writing">Writing</Checkbox>
      </CheckboxGroup>
      <RadioGroup
        label="Plan"
        name={`${id}-plan`}
        description="You can change it later."
        invalid
        error={message("Choose a plan.", above)}
      >
        <Radio value="solo">Solo</Radio>
        <Radio value="team">Team</Radio>
      </RadioGroup>
      <SegmentedControl
        label="Delivery speed"
        name={`${id}-delivery`}
        invalid
        error={message("Choose a delivery speed.", above)}
      >
        <Segment value="standard">Standard</Segment>
        <Segment value="express">Express</Segment>
        <Segment value="overnight">Overnight</Segment>
      </SegmentedControl>
    </>
  );
}

/**
 * Every form control, invalid, with its error after the field (today) and between the label and the field (the
 * GOV.UK pattern in `docs/brand/forms.md`), in all three themes. The "above" version also puts a visually hidden
 * "Error:" before each message, so a screen reader says it; it doesn't change what you see. Settles "Where a
 * field's error goes" in `docs/revisit.md`.
 */
export const SideBySide: Story = {
  render: () => (
    <Themes>
      {(theme) => (
        <Options>
          <Option
            title="After the field (today)"
            note="What every form control does now, and what most React libraries do."
          >
            <Fields id={`${theme}-below`} above={false} />
          </Option>
          <Option
            title="Between the label and the field"
            note="Read before the field, and a phone keyboard or autofill menu can't cover it."
            className="error-above"
          >
            <Fields id={`${theme}-above`} above />
          </Option>
        </Options>
      )}
    </Themes>
  ),
  play: async ({ canvasElement }) => {
    // The mock really moves the error: above the field in the second option, below it in the first
    const [below, above] = [...canvasElement.querySelectorAll<HTMLElement>("section[data-theme=light] .compare-option")];
    const top = (root: HTMLElement, selector: string) => root.querySelector(selector)!.getBoundingClientRect().top;
    await expect(top(below!, ".input__error")).toBeGreaterThan(top(below!, ".input__control"));
    await expect(top(above!, ".input__error")).toBeLessThan(top(above!, ".input__control"));
    await expect(top(above!, ".segmented-control__error")).toBeLessThan(top(above!, ".segmented-control__track"));
  },
};
