import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { Checkbox } from "../Checkbox";
import { CheckboxGroup } from "./CheckboxGroup";
import type { CheckboxGroupProps } from "./CheckboxGroup";

const options = (
  <>
    <Checkbox value="design">Design</Checkbox>
    <Checkbox value="development">Development</Checkbox>
    <Checkbox value="writing">Writing</Checkbox>
  </>
);

const getGroup = () => screen.getByRole("group");
const getBox = (name: string) => screen.getByRole("checkbox", { name });
const getBoxes = () => {
  const boxes = screen.getAllByRole("checkbox");
  expect(boxes.length).toBeGreaterThan(0);
  return boxes;
};
/** The names of the ticked boxes, in order */
const ticked = () =>
  ["All services", "Design", "Development", "Writing"].filter(
    (name) => screen.queryByRole("checkbox", { name })?.getAttribute("aria-checked") === "true",
  );
const submitted = (form: HTMLFormElement, name: string) => new FormData(form).getAll(name);

describe("CheckboxGroup", () => {
  describe("rendering", () => {
    it("renders a group named by its label, holding its checkboxes", () => {
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      const group = screen.getByRole("group", { name: "Services" });
      expect(group).toContainElement(getBox("Design"));
      expect(group).toContainElement(getBox("Writing"));
    });

    it("renders the label as the group's legend, so CSS can target it", () => {
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      expect(screen.getByText("Services")).toHaveClass("checkbox-group__label");
      expect(getGroup()).toContainElement(screen.getByText("Services"));
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<CheckboxGroup aria-label="Services">{options}</CheckboxGroup>);
      expect(screen.getByRole("group", { name: "Services" })).toBeInTheDocument();
      expect(container.querySelector(".checkbox-group__label")).toBeNull();
      expect(getGroup()).not.toHaveAttribute("aria-labelledby");
    });

    it("ticks nothing by default", () => {
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      for (const box of getBoxes()) expect(box).toHaveAttribute("aria-checked", "false");
    });

    it("puts the options inside one options wrapper", () => {
      const { container } = render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      const wrapper = container.querySelector(".checkbox-group__options");
      expect(wrapper).toBeInTheDocument();
      for (const box of getBoxes()) expect(wrapper).toContainElement(box);
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(
        <CheckboxGroup label="Services" className="mt-4">
          {options}
        </CheckboxGroup>,
      );
      expect(container.firstElementChild).toHaveClass("checkbox-group", "mt-4");
    });

    it("passes other props through to the group element", () => {
      render(
        <CheckboxGroup label="Services" data-testid="services">
          {options}
        </CheckboxGroup>,
      );
      expect(screen.getByTestId("services")).toBe(getGroup());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <CheckboxGroup label="Services" invalid disabled readOnly description="More" error="Required">
          {options}
        </CheckboxGroup>,
      );
      expect(container.querySelector(".checkbox-group__options")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/checkbox-group--/);
    });
  });

  describe("ticking and unticking", () => {
    it("starts with the defaultValue options ticked", () => {
      render(
        <CheckboxGroup label="Services" defaultValue={["design", "writing"]}>
          {options}
        </CheckboxGroup>,
      );
      expect(getBox("Design")).toBeChecked();
      expect(getBox("Development")).not.toBeChecked();
      expect(getBox("Writing")).toBeChecked();
    });

    it("ticks and unticks options independently, reporting the whole value each time", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" defaultValue={["design"]} onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(getBox("Development"));
      await user.click(getBox("Design"));
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([["design", "development"], ["development"]]);
      expect(getBox("Design")).not.toBeChecked();
      expect(getBox("Development")).toBeChecked();
    });

    it("ticks an option when its label text is clicked, once per click", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(screen.getByText("Writing"));
      expect(getBox("Writing")).toBeChecked();
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    it("does nothing when the group's own label is clicked", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(screen.getByText("Services"));
      expect(getBoxes()).toHaveLength(3);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <CheckboxGroup label="Services" value={["design"]} onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(getBox("Writing"));
      expect(onValueChange).toHaveBeenCalledWith(["design", "writing"], expect.anything());
      expect(getBox("Writing")).not.toBeChecked();
      rerender(
        <CheckboxGroup label="Services" value={["writing"]} onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      expect(getBox("Design")).not.toBeChecked();
      expect(getBox("Writing")).toBeChecked();
    });

    it("works as a controlled group driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<string[]>([]);
        return (
          <>
            <CheckboxGroup label="Services" value={value} onValueChange={setValue}>
              {options}
            </CheckboxGroup>
            <output>{value.join(",") || "none"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("none");
      await user.click(getBox("Writing"));
      await user.click(getBox("Design"));
      expect(screen.getByRole("status")).toHaveTextContent("writing,design");
    });
  });

  describe("keyboard", () => {
    it("makes every option its own Tab stop, in source order", async () => {
      const user = userEvent.setup();
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      await user.tab();
      expect(getBox("Design")).toHaveFocus();
      await user.tab();
      expect(getBox("Development")).toHaveFocus();
      await user.tab();
      expect(getBox("Writing")).toHaveFocus();
      await user.tab({ shift: true });
      expect(getBox("Development")).toHaveFocus();
    });

    it("ticks and unticks the focused option with Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.tab();
      await user.keyboard(" ");
      expect(getBox("Design")).toBeChecked();
      await user.keyboard(" ");
      expect(getBox("Design")).not.toBeChecked();
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([["design"], []]);
    });

    it("does not tick with Enter", async () => {
      const user = userEvent.setup();
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      await user.tab();
      expect(getBox("Design")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(getBox("Design")).not.toBeChecked();
    });

    it("submits the form with Enter, like a native checkbox, without ticking", async () => {
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
          <CheckboxGroup label="Services" name="services">
            {options}
          </CheckboxGroup>
          <button type="submit">Save</button>
        </form>,
      );
      await user.tab();
      expect(getBox("Design")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(getBox("Design")).not.toBeChecked();
    });

    it("doesn't move focus or tick with the arrow keys, Home, or End", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.tab();
      await user.keyboard("{ArrowDown}{ArrowRight}{End}");
      expect(getBox("Design")).toHaveFocus();
      await user.tab();
      await user.keyboard("{ArrowUp}{ArrowLeft}{Home}");
      expect(getBox("Development")).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("description and error", () => {
    it("links the description to the group", () => {
      render(
        <CheckboxGroup label="Services" description="Pick any that apply.">
          {options}
        </CheckboxGroup>,
      );
      expect(getGroup()).toHaveAccessibleDescription("Pick any that apply.");
      expect(getGroup()).toHaveAccessibleName("Services");
    });

    it("puts the description between the label and the options", () => {
      render(
        <CheckboxGroup label="Services" description="Pick any that apply.">
          {options}
        </CheckboxGroup>,
      );
      const description = screen.getByText("Pick any that apply.");
      expect(description).toHaveClass("checkbox-group__description");
      expect(screen.getByText("Services").compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(getBox("Design"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("also describes each option with the group's description, before the option's own", () => {
      render(
        <CheckboxGroup label="Services" description="Pick any that apply.">
          <Checkbox value="design" description="Logos and layouts">
            Design
          </Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      expect(getBox("Design")).toHaveAccessibleDescription("Pick any that apply. Logos and layouts");
      expect(getBox("Writing")).toHaveAccessibleDescription("Pick any that apply.");
    });

    it("shows the error after the options, linked to the group, when invalid", () => {
      render(
        <CheckboxGroup label="Services" invalid error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      const error = screen.getByText("Choose at least one service.");
      expect(getGroup()).toHaveAccessibleDescription("Choose at least one service.");
      expect(getBox("Writing").compareDocumentPosition(error)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(
        <CheckboxGroup label="Services" invalid error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      const error = screen.getByText("Choose at least one service.").closest(".checkbox-group__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("reads the description and the error together", () => {
      render(
        <CheckboxGroup label="Services" invalid description="Pick any that apply." error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      expect(getGroup()).toHaveAccessibleDescription("Pick any that apply. Choose at least one service.");
    });

    it("hides the error when the group is valid", () => {
      render(
        <CheckboxGroup label="Services" error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      expect(getBoxes()).toHaveLength(3);
      expect(screen.queryByText("Choose at least one service.")).not.toBeInTheDocument();
      expect(getGroup()).toHaveAccessibleDescription("");
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(
        <CheckboxGroup label="Services" error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      expect(getBoxes()).toHaveLength(3);
      expect(screen.queryByText("Choose at least one service.")).not.toBeInTheDocument();
      rerender(
        <CheckboxGroup label="Services" invalid error="Choose at least one service.">
          {options}
        </CheckboxGroup>,
      );
      expect(screen.getByText("Choose at least one service.")).toBeInTheDocument();
    });

    it("marks every option invalid when the group is", () => {
      render(
        <CheckboxGroup label="Services" invalid>
          {options}
        </CheckboxGroup>,
      );
      for (const box of getBoxes()) expect(box).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      for (const box of getBoxes()) expect(box).not.toHaveAttribute("aria-invalid", "true");
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(
        <CheckboxGroup label="Services" invalid>
          {options}
        </CheckboxGroup>,
      );
      expect(getBox("Design")).toBeInvalid();
      expect(container.querySelector(".checkbox-group__error")).toBeNull();
    });
  });

  describe("asking for at least one choice", () => {
    // There's no `required` prop: ARIA has no required state for a group. The consumer says
    // "(required)" in the label, checks the value, and sets `invalid` and `error`.
    function RequiredServices() {
      const [value, setValue] = useState<string[]>([]);
      const [submitted, setSubmitted] = useState(false);
      const invalid = submitted && value.length === 0;
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <CheckboxGroup
            label="Services (required)"
            name="services"
            value={value}
            onValueChange={setValue}
            invalid={invalid}
            error="Choose at least one service."
          >
            {options}
          </CheckboxGroup>
          <button type="submit">Send</button>
        </form>
      );
    }

    it("shows the error on the group and every option when nothing is ticked", async () => {
      const user = userEvent.setup();
      render(<RequiredServices />);
      expect(screen.getByRole("group", { name: "Services (required)" })).toBeInTheDocument();
      expect(screen.queryByText("Choose at least one service.")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(getGroup()).toHaveAccessibleDescription("Choose at least one service.");
      for (const box of getBoxes()) {
        expect(box).toHaveAttribute("aria-invalid", "true");
        expect(box).toHaveAccessibleDescription("Choose at least one service.");
      }
    });

    it("clears the error once an option is ticked", async () => {
      const user = userEvent.setup();
      render(<RequiredServices />);
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(screen.getByText("Choose at least one service.")).toBeInTheDocument();
      await user.click(getBox("Design"));
      expect(screen.queryByText("Choose at least one service.")).not.toBeInTheDocument();
      expect(getBox("Writing")).not.toHaveAttribute("aria-invalid", "true");
    });

    it("leaves the browser's own validation alone, since no single box is required", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services (required)" name="services">
            {options}
          </CheckboxGroup>
        </form>,
      );
      expect(screen.getByTestId("form").querySelectorAll("input[name=services]")).toHaveLength(3);
      expect((screen.getByTestId("form") as HTMLFormElement).checkValidity()).toBe(true);
      for (const box of getBoxes()) expect(box).not.toHaveAttribute("aria-required");
    });
  });

  describe("disabled", () => {
    it("disables every option and marks the wrapper", () => {
      const { container } = render(
        <CheckboxGroup label="Services" disabled>
          {options}
        </CheckboxGroup>,
      );
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      for (const box of getBoxes()) {
        expect(box).toHaveAttribute("aria-disabled", "true");
        expect(box).toHaveAttribute("data-disabled");
        // The row's data-disabled is what dims the option's label
        expect(box.closest(".checkbox__row")).toHaveAttribute("data-disabled");
      }
    });

    it("blocks clicks on the boxes and their labels", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" disabled onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(getBox("Design"));
      await user.click(screen.getByText("Writing"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(getBox("Design")).not.toBeChecked();
      expect(getBox("Writing")).not.toBeChecked();
    });

    it("ignores Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" disabled onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      getBox("Design").focus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("takes every option out of the tab order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <CheckboxGroup label="Services" disabled>
            {options}
          </CheckboxGroup>
          <button type="button">After</button>
        </>,
      );
      expect(getBoxes()).toHaveLength(3);
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("keeps ticked options ticked", () => {
      render(
        <CheckboxGroup label="Services" disabled defaultValue={["design"]}>
          {options}
        </CheckboxGroup>,
      );
      expect(getBox("Design")).toBeChecked();
    });
  });

  describe("read only", () => {
    it("marks every option read-only", () => {
      render(
        <CheckboxGroup label="Services" readOnly>
          {options}
        </CheckboxGroup>,
      );
      for (const box of getBoxes()) expect(box).toHaveAttribute("aria-readonly", "true");
    });

    it("blocks changes from the boxes, their labels, and the keyboard", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" readOnly defaultValue={["design"]} onValueChange={onValueChange}>
          {options}
        </CheckboxGroup>,
      );
      await user.click(getBox("Design"));
      await user.click(screen.getByText("Writing"));
      getBox("Development").focus();
      expect(getBox("Development")).toHaveFocus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(getBox("Development")).not.toBeChecked();
      expect(getBox("Design")).toBeChecked();
      expect(getBox("Writing")).not.toBeChecked();
    });

    it("keeps every option in the tab order, so the value can be read", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" readOnly>
          {options}
        </CheckboxGroup>,
      );
      await user.tab();
      expect(getBox("Design")).toHaveFocus();
      await user.tab();
      expect(getBox("Development")).toHaveFocus();
    });

    it("is not read-only by default", () => {
      render(<CheckboxGroup label="Services">{options}</CheckboxGroup>);
      for (const box of getBoxes()) expect(box).not.toHaveAttribute("aria-readonly", "true");
    });
  });

  describe("in a form", () => {
    it("submits each ticked option's value under the group's name, in order", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" defaultValue={["writing", "design"]}>
            {options}
          </CheckboxGroup>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual(["design", "writing"]);
    });

    it("submits nothing when nothing is ticked", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services">
            {options}
          </CheckboxGroup>
        </form>,
      );
      expect(screen.getByTestId("form").querySelectorAll("input[name=services]")).toHaveLength(3);
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual([]);
    });

    it("starts submitting an option after the user ticks it", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services">
            {options}
          </CheckboxGroup>
        </form>,
      );
      await user.click(getBox("Development"));
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual(["development"]);
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" disabled defaultValue={["design"]}>
            {options}
          </CheckboxGroup>
        </form>,
      );
      const input = screen.getByTestId("form").querySelector<HTMLInputElement>("input[name=services][value=design]");
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual([]);
    });

    it("submits when read-only", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" readOnly defaultValue={["design"]}>
            {options}
          </CheckboxGroup>
        </form>,
      );
      expect(submitted(screen.getByTestId("form") as HTMLFormElement, "services")).toEqual(["design"]);
    });
  });

  describe("select all", () => {
    const allValues = ["design", "development", "writing"];
    const withParent = (
      <>
        <Checkbox parent>All services</Checkbox>
        {options}
      </>
    );

    it("shows a dash on the parent, announced as mixed, when some options are ticked", () => {
      render(
        <CheckboxGroup label="Services" allValues={allValues} defaultValue={["design"]}>
          {withParent}
        </CheckboxGroup>,
      );
      const parent = getBox("All services");
      expect(parent).toHaveAttribute("aria-checked", "mixed");
      expect(parent.querySelector("svg path")).toHaveAttribute("d", "M3.5 8h9");
    });

    it("shows a tick on the parent when every option is ticked", () => {
      render(
        <CheckboxGroup label="Services" allValues={allValues} defaultValue={allValues}>
          {withParent}
        </CheckboxGroup>,
      );
      const parent = getBox("All services");
      expect(parent).toHaveAttribute("aria-checked", "true");
      expect(parent.querySelector("svg path")).toHaveAttribute("d", expect.stringContaining("m3 8.5"));
    });

    it("leaves the parent unticked, with no mark, when no option is ticked", () => {
      render(
        <CheckboxGroup label="Services" allValues={allValues}>
          {withParent}
        </CheckboxGroup>,
      );
      const parent = getBox("All services");
      expect(parent).toHaveAttribute("aria-checked", "false");
      expect(parent.querySelector("svg")).toBeNull();
    });

    it("tells assistive technology which options it controls", () => {
      render(
        <CheckboxGroup label="Services" allValues={allValues}>
          {withParent}
        </CheckboxGroup>,
      );
      const controls = getBox("All services").getAttribute("aria-controls")?.split(" ");
      expect(controls).toEqual([getBox("Design").id, getBox("Development").id, getBox("Writing").id]);
    });

    it("cycles from the mix you made, to all, to none, and back to your mix", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" allValues={allValues} defaultValue={["design"]} onValueChange={onValueChange}>
          {withParent}
        </CheckboxGroup>,
      );
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["All services", "Design", "Development", "Writing"]);
      await user.click(getBox("All services"));
      expect(ticked()).toEqual([]);
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["Design"]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([allValues, [], ["design"]]);
    });

    it("toggles between all and none when every option is already on or off", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" allValues={allValues}>
          {withParent}
        </CheckboxGroup>,
      );
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["All services", "Design", "Development", "Writing"]);
      await user.click(getBox("All services"));
      expect(ticked()).toEqual([]);
    });

    it("follows the options as they're ticked one by one", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" allValues={allValues}>
          {withParent}
        </CheckboxGroup>,
      );
      await user.click(getBox("Design"));
      expect(getBox("All services")).toHaveAttribute("aria-checked", "mixed");
      await user.click(getBox("Development"));
      await user.click(getBox("Writing"));
      expect(getBox("All services")).toHaveAttribute("aria-checked", "true");
    });

    it("leaves a disabled option as it is", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" allValues={allValues} defaultValue={["design", "development"]}>
          <Checkbox parent>All services</Checkbox>
          <Checkbox value="design" disabled>
            Design
          </Checkbox>
          <Checkbox value="development">Development</Checkbox>
          <Checkbox value="writing">Writing</Checkbox>
        </CheckboxGroup>,
      );
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["All services", "Design", "Development", "Writing"]);
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["Design"]);
    });

    it("is not submitted with the form", () => {
      render(
        <form data-testid="form">
          <CheckboxGroup label="Services" name="services" allValues={allValues} defaultValue={allValues}>
            {withParent}
          </CheckboxGroup>
        </form>,
      );
      expect(getBox("All services")).toBeChecked();
      expect([...new FormData(screen.getByTestId("form") as HTMLFormElement).values()]).toEqual(allValues);
    });

    it("needs allValues: without it, the parent ticks only itself", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" defaultValue={["design"]}>
          {withParent}
        </CheckboxGroup>,
      );
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["All services", "Design"]);
      expect(takeWarnings()).toEqual([
        "[design-system] Checkbox: a parent box ticks only itself unless its CheckboxGroup has allValues. Pass every option's value as allValues.",
      ]);
    });

    it("changes nothing when the group is read-only", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" readOnly allValues={allValues} defaultValue={["design"]} onValueChange={onValueChange}>
          {withParent}
        </CheckboxGroup>,
      );
      expect(getBox("All services")).toHaveAttribute("aria-readonly", "true");
      await user.click(getBox("All services"));
      getBox("All services").focus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(ticked()).toEqual(["Design"]);
      expect(getBox("All services")).toHaveAttribute("aria-checked", "mixed");
    });

    it("changes nothing when the group is disabled", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CheckboxGroup label="Services" disabled allValues={allValues} defaultValue={["design"]} onValueChange={onValueChange}>
          {withParent}
        </CheckboxGroup>,
      );
      expect(getBox("All services")).toHaveAttribute("aria-disabled", "true");
      await user.click(getBox("All services"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(ticked()).toEqual(["Design"]);
    });

    it("works when the group is controlled", async () => {
      function Controlled() {
        const [value, setValue] = useState<string[]>(["writing"]);
        return (
          <CheckboxGroup label="Services" allValues={allValues} value={value} onValueChange={setValue}>
            {withParent}
          </CheckboxGroup>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(getBox("All services")).toHaveAttribute("aria-checked", "mixed");
      await user.click(getBox("All services"));
      expect(ticked()).toEqual(["All services", "Design", "Development", "Writing"]);
    });
  });

  describe("refs", () => {
    it("forwards ref to the group element", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <CheckboxGroup label="Services" ref={ref}>
          {options}
        </CheckboxGroup>,
      );
      expect(ref.current).toBe(getGroup());
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<CheckboxGroupProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<CheckboxGroupProps>();
      expectTypeOf<object>().not.toExtend<CheckboxGroupProps>();
      expectTypeOf<{ description: string }>().not.toExtend<CheckboxGroupProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ label: undefined }>().not.toExtend<CheckboxGroupProps>();
      expectTypeOf<{ label: null }>().not.toExtend<CheckboxGroupProps>();
      expectTypeOf<{ label: false }>().not.toExtend<CheckboxGroupProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<CheckboxGroupProps>();
    });

    it("keeps Base UI's render out of the public props, and takes className as a string", () => {
      expectTypeOf<CheckboxGroupProps>().not.toHaveProperty("render");
      expectTypeOf<CheckboxGroupProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("has no required prop, since a group has no required state", () => {
      expectTypeOf<CheckboxGroupProps>().not.toHaveProperty("required");
    });

    it("takes and reports the value as an array of strings", () => {
      expectTypeOf<CheckboxGroupProps["value"]>().toEqualTypeOf<string[] | undefined>();
      expectTypeOf<CheckboxGroupProps["defaultValue"]>().toEqualTypeOf<string[] | undefined>();
      expectTypeOf<CheckboxGroupProps["allValues"]>().toEqualTypeOf<string[] | undefined>();
      expectTypeOf<CheckboxGroupProps["onValueChange"]>().parameter(0).toEqualTypeOf<string[]>();
    });

    it("takes a string name", () => {
      expectTypeOf<CheckboxGroupProps["name"]>().toEqualTypeOf<string | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<CheckboxGroup label="">{options}</CheckboxGroup>);
      expect(getGroup()).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] CheckboxGroup: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label."]);
    });

    it("stays quiet when aria-labelledby names it", () => {
      render(
        <>
          <h2 id="services-heading">Services</h2>
          <CheckboxGroup aria-label="" aria-labelledby="services-heading">
            {options}
          </CheckboxGroup>
        </>,
      );
      expect(screen.getByRole("group", { name: "Services" })).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });
  });
});
