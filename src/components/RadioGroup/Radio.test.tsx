import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Radio } from "./Radio";
import type { RadioProps } from "./Radio";
import { RadioGroup } from "./RadioGroup";

const getRadio = (name: string) => screen.getByRole("radio", { name });
const getInput = (container: HTMLElement, value: string) =>
  container.querySelector<HTMLInputElement>(`input[type=radio][value=${value}]`)!;

describe("Radio", () => {
  describe("rendering", () => {
    it("renders a radio named by its label", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free">Free</Radio>
        </RadioGroup>,
      );
      expect(screen.getByRole("radio", { name: "Free" })).toBeInTheDocument();
    });

    it("puts the circle and the label text inside one <label>", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free">Free</Radio>
        </RadioGroup>,
      );
      expect(screen.getByText("Free")).toHaveClass("radio__label");
      const label = screen.getByText("Free").closest("label");
      expect(label).toHaveClass("radio__row");
      expect(label).toContainElement(getRadio("Free"));
      expect(getRadio("Free")).toHaveClass("radio__circle");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(
        <RadioGroup aria-label="Plan">
          <Radio value="free" aria-label="Free plan" />
        </RadioGroup>,
      );
      expect(screen.getByRole("radio", { name: "Free plan" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the shared choice classes next to its own, so choice.css and field.css draw what Checkbox, Radio, and Switch share", () => {
      render(
        <RadioGroup label="Plan" defaultValue="free">
          <Radio value="free" description="For one person.">Free</Radio>
        </RadioGroup>,
      );
      expect(screen.getByText("Free").closest(".radio")).toHaveClass("choice", "radio");
      expect(screen.getByText("Free")).toHaveClass("choice__label", "radio__label");
      expect(screen.getByText("Free").closest("label")).toHaveClass("choice__row", "radio__row");
      expect(getRadio("Free")).toHaveClass("choice__control", "radio__circle");
      expect(getRadio("Free").firstElementChild).toHaveClass("choice__indicator", "radio__indicator");
      expect(screen.getByText("For one person.")).toHaveClass("field-description", "radio__description");
    });

    it("applies className to its wrapper, next to its own class", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free" className="mt-4">
            Free
          </Radio>
        </RadioGroup>,
      );
      expect(screen.getByText("Free").closest(".radio")).toHaveClass("radio", "mt-4");
    });

    it("passes other props through to the radio element", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free" data-testid="free-radio">
            Free
          </Radio>
        </RadioGroup>,
      );
      expect(screen.getByTestId("free-radio")).toBe(getRadio("Free"));
    });

    it("tells the group which value it stands for", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <RadioGroup label="Plan" name="plan">
          <Radio value="free">Free</Radio>
        </RadioGroup>,
      );
      expect(getInput(container, "free")).toHaveAttribute("name", "plan");
      await user.click(getRadio("Free"));
      expect(getInput(container, "free")).toBeChecked();
    });
  });

  describe("the dot", () => {
    it("shows no dot when not selected", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free">Free</Radio>
        </RadioGroup>,
      );
      expect(getRadio("Free")).toHaveAttribute("aria-checked", "false");
      expect(getRadio("Free").querySelector("svg")).toBeNull();
    });

    it("shows a dot when selected, hidden from screen readers", () => {
      render(
        <RadioGroup label="Plan" defaultValue="free">
          <Radio value="free">Free</Radio>
        </RadioGroup>,
      );
      const dot = getRadio("Free").querySelector("svg");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("radio__dot");
      expect(dot).toHaveAttribute("aria-hidden", "true");
      expect(dot).toHaveAttribute("focusable", "false");
      expect(dot?.querySelector("circle")).toBeInTheDocument();
    });
  });

  describe("description", () => {
    it("links its description to the radio, after the group's", () => {
      render(
        <RadioGroup label="Plan" description="You can change it later.">
          <Radio value="team" description="Up to 10 people">
            Team
          </Radio>
        </RadioGroup>,
      );
      expect(getRadio("Team")).toHaveAccessibleDescription("You can change it later. Up to 10 people");
      expect(screen.getByText("Up to 10 people")).toHaveClass("radio__description");
    });

    it("keeps the description out of the accessible name", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="team" description="Up to 10 people">
            Team
          </Radio>
        </RadioGroup>,
      );
      expect(getRadio("Team")).toHaveAccessibleName("Team");
    });

    it("renders a description for a radio named by aria-label", () => {
      render(
        <RadioGroup aria-label="Plan">
          <Radio value="team" aria-label="Team" description="Up to 10 people" />
        </RadioGroup>,
      );
      expect(getRadio("Team")).toHaveAccessibleDescription("Up to 10 people");
    });
  });

  describe("disabled on its own", () => {
    const plans = (
      <>
        <Radio value="free">Free</Radio>
        <Radio value="team" disabled>
          Team
        </Radio>
        <Radio value="business">Business</Radio>
      </>
    );

    it("is marked disabled, and so is its label row, but not the others", () => {
      render(<RadioGroup label="Plan">{plans}</RadioGroup>);
      expect(getRadio("Team")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByText("Team").closest(".radio__row")).toHaveAttribute("data-disabled");
      expect(getRadio("Free")).not.toHaveAttribute("aria-disabled", "true");
      expect(screen.getByText("Free").closest(".radio__row")).not.toHaveAttribute("data-disabled");
    });

    it("can't be chosen by clicking it or its label, while the others can", async () => {
      const user = userEvent.setup();
      render(<RadioGroup label="Plan">{plans}</RadioGroup>);
      await user.click(getRadio("Team"));
      await user.click(screen.getByText("Team"));
      expect(getRadio("Team")).toHaveAttribute("aria-checked", "false");
      await user.click(getRadio("Business"));
      expect(getRadio("Business")).toHaveAttribute("aria-checked", "true");
    });

    it("is skipped by the arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup label="Plan" defaultValue="free">
          {plans}
        </RadioGroup>,
      );
      await user.tab();
      expect(getRadio("Free")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(getRadio("Business")).toHaveFocus();
      expect(getRadio("Business")).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{ArrowUp}");
      expect(getRadio("Free")).toHaveFocus();
    });
  });

  describe("id and refs", () => {
    it("puts id on the hidden input, not on the visible radio", () => {
      const { container } = render(
        <RadioGroup label="Plan">
          <Radio value="free" id="plan-free">
            Free
          </Radio>
        </RadioGroup>,
      );
      expect(getInput(container, "free")).toHaveAttribute("id", "plan-free");
      expect(getRadio("Free")).not.toHaveAttribute("id", "plan-free");
    });

    it("forwards ref to the radio element", () => {
      const ref = createRef<HTMLElement>();
      render(
        <RadioGroup label="Plan">
          <Radio value="free" ref={ref}>
            Free
          </Radio>
        </RadioGroup>,
      );
      expect(ref.current).toBe(getRadio("Free"));
    });

    it("forwards inputRef to the hidden input", () => {
      const inputRef = createRef<HTMLInputElement>();
      const { container } = render(
        <RadioGroup label="Plan">
          <Radio value="free" inputRef={inputRef}>
            Free
          </Radio>
        </RadioGroup>,
      );
      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(inputRef.current).toBe(getInput(container, "free"));
    });
  });

  describe("dev warnings", () => {
    it("warns when the label text is empty and there's no aria-label", () => {
      render(
        <RadioGroup label="Plan">
          <Radio value="free">{""}</Radio>
        </RadioGroup>,
      );
      expect(screen.getByRole("radio")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Radio: has no accessible name, so screen readers announce it without one. Give it label text (children) or an aria-label.",
      ]);
    });
  });

  describe("types", () => {
    it("requires a value", () => {
      expectTypeOf<{ value: string; children: string }>().toExtend<RadioProps>();
      expectTypeOf<{ children: string }>().not.toExtend<RadioProps>();
      expectTypeOf<RadioProps["value"]>().toEqualTypeOf<string>();
    });

    it("requires visible label content or an aria-label", () => {
      expectTypeOf<{ value: string; "aria-label": string }>().toExtend<RadioProps>();
      expectTypeOf<{ value: string }>().not.toExtend<RadioProps>();
      expectTypeOf<{ value: string; children: undefined }>().not.toExtend<RadioProps>();
      expectTypeOf<{ value: string; children: null }>().not.toExtend<RadioProps>();
      expectTypeOf<{ value: string; children: false }>().not.toExtend<RadioProps>();
      expectTypeOf<{ value: string; children: string | undefined }>().not.toExtend<RadioProps>();
    });

    it("leaves out what the group owns, and Base UI's render and nativeButton", () => {
      expectTypeOf<RadioProps>().not.toHaveProperty("name");
      expectTypeOf<RadioProps>().not.toHaveProperty("required");
      expectTypeOf<RadioProps>().not.toHaveProperty("readOnly");
      expectTypeOf<RadioProps>().not.toHaveProperty("invalid");
      expectTypeOf<RadioProps>().not.toHaveProperty("error");
      expectTypeOf<RadioProps>().not.toHaveProperty("checked");
      expectTypeOf<RadioProps>().not.toHaveProperty("defaultChecked");
      expectTypeOf<RadioProps>().not.toHaveProperty("render");
      expectTypeOf<RadioProps>().not.toHaveProperty("nativeButton");
      expectTypeOf<RadioProps["className"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
