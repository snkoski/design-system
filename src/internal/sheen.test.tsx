import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { Input } from "../components/Input";
import { Radio, RadioGroup } from "../components/RadioGroup";
import { Switch } from "../components/Switch";

// The focus sheen is CSS (sheen.css): these check that every component opts its focusable part in.
// The story in FocusSheen.stories.tsx checks in Chromium that the sweep actually plays on focus.
describe("focus sheen", () => {
  it("is on the element that takes focus in Button and ButtonLink", () => {
    render(
      <>
        <Button>Save</Button>
        <ButtonLink href="/plans">See plans</ButtonLink>
      </>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("sheen");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveClass("sheen");
  });

  it("is on the box, track, and circle of Checkbox, Switch, and Radio, not on their label rows", () => {
    render(
      <>
        <Checkbox>Email me</Checkbox>
        <Switch>Dark mode</Switch>
        <RadioGroup label="Plan">
          <Radio value="free">Free</Radio>
        </RadioGroup>
      </>,
    );
    for (const control of [
      screen.getByRole("checkbox", { name: "Email me" }),
      screen.getByRole("switch", { name: "Dark mode" }),
      screen.getByRole("radio", { name: "Free" }),
    ]) {
      expect(control).toHaveClass("sheen");
      expect(control.closest("label")).not.toHaveClass("sheen");
    }
  });

  it("is on Input's box, around the field, because an <input> can't have pseudo-elements", () => {
    render(<Input label="Email" />);
    const field = screen.getByRole("textbox", { name: "Email" });
    expect(field).not.toHaveClass("sheen");
    const box = field.closest(".sheen");
    expect(box).toHaveClass("input__box");
    expect(box).toContainElement(field);
  });
});
