import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ChangeEvent, Ref } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { NativeSelect } from "@/components/NativeSelect/NativeSelect";
import type {
  NativeSelectGroup,
  NativeSelectOption,
  NativeSelectProps,
  NativeSelectSize,
} from "@/components/NativeSelect/NativeSelect";

const getSelect = () => screen.getByRole("combobox") as HTMLSelectElement;
const optionTexts = (select: HTMLSelectElement) => [...select.options].map((option) => option.textContent);

const statuses: NativeSelectOption[] = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
];

const grouped: (NativeSelectOption | NativeSelectGroup)[] = [
  { value: "applied", label: "Applied" },
  {
    label: "Closed",
    options: [
      { value: "offer", label: "Offer" },
      { value: "rejected", label: "Rejected", disabled: true },
    ],
  },
  { label: "Archived", disabled: true, options: [{ value: "withdrawn", label: "Withdrawn" }] },
];

const noMatch = (value: string) =>
  `[design-system] NativeSelect: value "${value}" matches none of its options, so it shows something other than the value it holds. Pass one of the options' values, or add a placeholder for an empty value.`;

describe("NativeSelect", () => {
  describe("rendering", () => {
    it("renders a select named by its label", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    });

    it("renders a native select with its own class", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(getSelect().tagName).toBe("SELECT");
      expect(getSelect()).toHaveClass("native-select__control");
    });

    it("renders the label as a <label> pointing at the select", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      const label = screen.getByText("Status");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("native-select__label");
      expect(label).toHaveAttribute("for", getSelect().id);
    });

    it("defaults to the md size", () => {
      const { container } = render(<NativeSelect label="Status" options={statuses} />);
      expect(container.firstElementChild).toHaveClass("native-select");
      expect(container.firstElementChild).toHaveAttribute("data-size", "md");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<NativeSelect label="Status" options={statuses} size={size} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("never sets the select's own size attribute, which would turn it into a list box", () => {
      render(<NativeSelect label="Status" options={statuses} size="lg" />);
      expect(getSelect()).toBeInTheDocument();
      expect(getSelect()).not.toHaveAttribute("size");
    });

    it("can be named by aria-label alone, with no <label> element", () => {
      const { container } = render(<NativeSelect aria-label="Sort by" options={statuses} />);
      expect(screen.getByRole("combobox", { name: "Sort by" })).toBeInTheDocument();
      expect(container.querySelector("label")).toBeNull();
    });

    it("puts the description and then the error between the label and the field", () => {
      const { container } = render(
        <NativeSelect label="Status" options={statuses} description="Where it stands." invalid error="Choose a status." />,
      );
      const parts = ["native-select__label", "native-select__description", "native-select__error", "native-select__control"];
      const order = [...container.querySelectorAll(parts.map((part) => `.${part}`).join(", "))].map((el) =>
        parts.find((part) => el.classList.contains(part)),
      );
      expect(order).toEqual(parts);
    });

    it("puts the shared text field classes next to its own, so text-field.css and field.css draw what it shares with Input", () => {
      const { container } = render(<NativeSelect label="Status" options={statuses} description="Where it stands." />);
      expect(container.firstElementChild).toHaveClass("text-field", "native-select");
      expect(screen.getByText("Status")).toHaveClass("field-label", "native-select__label");
      expect(screen.getByText("Where it stands.")).toHaveClass("field-description", "native-select__description");
      expect(getSelect()).toHaveClass("text-field__control", "native-select__control");
    });

    it("draws an arrow at the end that's hidden from screen readers and lets clicks through to the select", () => {
      const { container } = render(<NativeSelect label="Status" options={statuses} />);
      const box = container.querySelector(".native-select__box");
      expect(box).toContainElement(getSelect());
      const icon = box?.querySelector("svg");
      expect(icon).toHaveClass("native-select__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
      // It comes after the select, so it sits at the end
      expect(getSelect().compareDocumentPosition(icon as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<NativeSelect label="Status" options={statuses} className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("native-select", "mt-4");
    });

    it("passes select attributes and other props through to the select", () => {
      render(
        <NativeSelect label="Country" options={statuses} autoComplete="country" title="Country" data-testid="country" />,
      );
      expect(screen.getByTestId("country")).toBe(getSelect());
      expect(getSelect()).toHaveAttribute("autocomplete", "country");
      expect(getSelect()).toHaveAttribute("title", "Country");
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <NativeSelect label="Status" options={grouped} placeholder="Choose a status" size="lg" invalid disabled error="Bad" description="More" />,
      );
      expect(getSelect()).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/native-select--/);
    });
  });

  describe("options", () => {
    it("renders each option in order, with its value and words", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(optionTexts(getSelect())).toEqual(["Applied", "Interview", "Offer"]);
      expect([...getSelect().options].map((option) => option.value)).toEqual(["applied", "interview", "offer"]);
    });

    it("renders a group as an <optgroup> with its options inside", () => {
      render(<NativeSelect label="Status" options={grouped} />);
      const group = getSelect().querySelector('optgroup[label="Closed"]') as HTMLOptGroupElement;
      expect(group).toBeInTheDocument();
      expect([...group.querySelectorAll("option")].map((option) => option.value)).toEqual(["offer", "rejected"]);
      expect(group.disabled).toBe(false);
    });

    it("disables an option, and every option in a disabled group", () => {
      render(<NativeSelect label="Status" options={grouped} />);
      const option = (value: string) => [...getSelect().options].find((o) => o.value === value) as HTMLOptionElement;
      expect(option("rejected").disabled).toBe(true);
      expect(option("offer").disabled).toBe(false);
      expect((getSelect().querySelector('optgroup[label="Archived"]') as HTMLOptGroupElement).disabled).toBe(true);
    });

    it("won't let a disabled option, or one in a disabled group, be chosen", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={grouped} onValueChange={onValueChange} />);
      expect(getSelect()).toHaveValue("applied");
      await user.selectOptions(getSelect(), "rejected");
      await user.selectOptions(getSelect(), "withdrawn");
      expect(getSelect()).toHaveValue("applied");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("adds the placeholder as a first, empty, selectable option, chosen to start with", () => {
      render(<NativeSelect label="Status" options={statuses} placeholder="Choose a status" />);
      const first = getSelect().options[0] as HTMLOptionElement;
      expect(first).toHaveTextContent("Choose a status");
      expect(first.value).toBe("");
      expect(first).toHaveClass("native-select__placeholder");
      expect(first.disabled).toBe(false);
      expect(first.hidden).toBe(false);
      expect(getSelect()).toHaveValue("");
      expect(optionTexts(getSelect())).toEqual(["Choose a status", "Applied", "Interview", "Offer"]);
    });

    it.each(["", "   "])("treats placeholder=%j as no placeholder", (placeholder) => {
      render(<NativeSelect label="Status" options={statuses} placeholder={placeholder} />);
      expect(optionTexts(getSelect())).toEqual(["Applied", "Interview", "Offer"]);
    });

    it("marks only the placeholder, never an option of the page's own whose value is empty", () => {
      render(
        <NativeSelect label="Status" options={[{ value: "", label: "Any" }, ...statuses]} />,
      );
      expect(getSelect().options[0]).toHaveTextContent("Any");
      expect(getSelect().querySelector(".native-select__placeholder")).toBeNull();
    });

    it("chooses the first option to start with when there's no placeholder", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(getSelect()).toHaveValue("applied");
    });

    it("keeps the chosen option when the options change around it, uncontrolled", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<NativeSelect label="Status" options={statuses} name="status" />);
      await user.selectOptions(getSelect(), "offer");
      rerender(<NativeSelect label="Status" options={[{ value: "saved", label: "Saved" }, ...statuses]} name="status" />);
      expect(optionTexts(getSelect())).toEqual(["Saved", "Applied", "Interview", "Offer"]);
      expect(getSelect()).toHaveValue("offer");
      rerender(<NativeSelect label="Status" options={statuses.filter((option) => option.value !== "applied")} name="status" />);
      expect(getSelect()).toHaveValue("offer");
    });

    it("keeps the chosen option when a group is added before it", async () => {
      const user = userEvent.setup();
      const closed: NativeSelectGroup = { label: "Closed", options: [{ value: "offer", label: "Offer" }] };
      const { rerender } = render(<NativeSelect label="Status" options={[closed]} />);
      await user.selectOptions(getSelect(), "offer");
      rerender(<NativeSelect label="Status" options={[{ label: "Open", options: [{ value: "applied", label: "Applied" }] }, closed]} />);
      expect(getSelect()).toHaveValue("offer");
    });

    it("renders an option whose value matches a group's label without React complaining about keys", () => {
      const error = vi.spyOn(console, "error");
      render(
        <NativeSelect label="Status" options={[{ value: "Closed", label: "Any closed" }, { label: "Closed", options: [{ value: "offer", label: "Offer" }] }]} />,
      );
      expect(optionTexts(getSelect())).toEqual(["Any closed", "Offer"]);
      expect(error).not.toHaveBeenCalled();
    });

    it("renders two options with the same value without React complaining about keys", () => {
      const error = vi.spyOn(console, "error");
      render(
        <NativeSelect
          label="Status"
          options={[
            { value: "a", label: "First" },
            { value: "a", label: "Second" },
          ]}
        />,
      );
      expect(optionTexts(getSelect())).toEqual(["First", "Second"]);
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe("choosing and value", () => {
    it("changes when an option is chosen, uncontrolled", async () => {
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} />);
      await user.selectOptions(getSelect(), "offer");
      expect(getSelect()).toHaveValue("offer");
    });

    it("starts with defaultValue", () => {
      render(<NativeSelect label="Status" options={statuses} defaultValue="interview" />);
      expect(getSelect()).toHaveValue("interview");
    });

    it("calls onValueChange with the chosen option's value", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={grouped} onValueChange={onValueChange} />);
      await user.selectOptions(getSelect(), "offer");
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith("offer", expect.anything());
    });

    it("calls onFocus and onBlur as focus moves in and out", async () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} onFocus={onFocus} onBlur={onBlur} />);
      await user.tab();
      expect(getSelect()).toHaveFocus();
      expect(onFocus).toHaveBeenCalledOnce();
      await user.tab();
      expect(onBlur).toHaveBeenCalledOnce();
    });

    it("still calls a native onChange", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} onChange={onChange} />);
      await user.selectOptions(getSelect(), "offer");
      expect(onChange).toHaveBeenCalledOnce();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <NativeSelect label="Status" options={statuses} value="applied" onValueChange={onValueChange} />,
      );
      await user.selectOptions(getSelect(), "offer");
      expect(onValueChange).toHaveBeenCalledWith("offer", expect.anything());
      expect(getSelect()).toHaveValue("applied");
      rerender(<NativeSelect label="Status" options={statuses} value="interview" onValueChange={onValueChange} />);
      expect(getSelect()).toHaveValue("interview");
    });

    it("works as a controlled select driven by state, back to the placeholder too", async () => {
      function Controlled() {
        const [value, setValue] = useState("");
        return (
          <>
            <NativeSelect label="Status" options={statuses} placeholder="Choose a status" value={value} onValueChange={setValue} />
            <output>{value || "nothing"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("nothing");
      await user.selectOptions(getSelect(), "offer");
      expect(getSelect()).toHaveValue("offer");
      expect(screen.getByRole("status")).toHaveTextContent("offer");
      await user.selectOptions(getSelect(), "");
      expect(getSelect()).toHaveValue("");
      expect(screen.getByRole("status")).toHaveTextContent("nothing");
    });

    it("focuses the select when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} />);
      await user.click(screen.getByText("Status"));
      expect(getSelect()).toHaveFocus();
    });
  });

  describe("keyboard", () => {
    it("is reachable with Tab, one stop per select", async () => {
      const user = userEvent.setup();
      render(
        <>
          <NativeSelect label="First" options={statuses} />
          <NativeSelect label="Second" options={statuses} />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("combobox", { name: "First" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("combobox", { name: "Second" })).toHaveFocus();
    });
  });

  describe("disabled", () => {
    it("can't be changed", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} disabled defaultValue="offer" onValueChange={onValueChange} />);
      expect(getSelect()).toHaveValue("offer");
      await user.selectOptions(getSelect(), "applied");
      expect(getSelect()).toHaveValue("offer");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is marked disabled, with the wrapper and label marked for the CSS", () => {
      const { container } = render(<NativeSelect label="Status" options={statuses} disabled />);
      expect(getSelect()).toBeDisabled();
      expect(getSelect()).toHaveAttribute("data-disabled");
      // The CSS dims the label and the arrow from these
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(screen.getByText("Status")).toHaveAttribute("data-disabled");
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <NativeSelect label="Off" options={statuses} disabled />
          <NativeSelect label="On" options={statuses} />
        </>,
      );
      await user.tab();
      expect(screen.getByRole("combobox", { name: "On" })).toHaveFocus();
    });
  });

  describe("props it leaves out", () => {
    // Each is kept out of the props type; these check that passing one anyway from JavaScript changes nothing.
    const untyped = (props: Record<string, unknown>) => props as unknown as Partial<NativeSelectProps>;

    it("drops readOnly, which a select ignores, so no do-nothing readonly attribute or note appears", () => {
      render(<NativeSelect label="Status" options={statuses} {...untyped({ readOnly: true })} />);
      expect(getSelect()).toBeInTheDocument();
      expect(getSelect()).not.toHaveAttribute("readonly");
      expect(getSelect()).not.toHaveAttribute("aria-readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("drops multiple, so the value stays one string", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<NativeSelect label="Status" options={statuses} onValueChange={onValueChange} {...untyped({ multiple: true })} />);
      expect(getSelect().multiple).toBe(false);
      expect(getSelect()).not.toHaveAttribute("multiple");
      await user.selectOptions(getSelect(), "offer");
      expect(onValueChange).toHaveBeenCalledWith("offer", expect.anything());
    });

    it("drops children, so the options always come from options", () => {
      render(
        <NativeSelect
          label="Status"
          options={statuses}
          {...untyped({ children: <option value="other">Other</option> })}
        />,
      );
      expect(optionTexts(getSelect())).toEqual(["Applied", "Interview", "Offer"]);
    });
  });

  describe("required and invalid", () => {
    it("is required for assistive technology and the form", () => {
      render(<NativeSelect label="Status" options={statuses} required />);
      expect(getSelect()).toBeRequired();
    });

    it("is not required by default", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(getSelect()).toBeInTheDocument();
      expect(getSelect()).not.toBeRequired();
    });

    it("fails the form's own check while a required select is on its placeholder", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={statuses} placeholder="Choose a status" required />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      await user.selectOptions(getSelect(), "offer");
      expect(form.checkValidity()).toBe(true);
    });

    it("is announced as invalid", () => {
      render(<NativeSelect label="Status" options={statuses} invalid />);
      expect(getSelect()).toBeInvalid();
      expect(getSelect()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<NativeSelect label="Status" options={statuses} />);
      expect(getSelect()).toBeInTheDocument();
      expect(getSelect()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the select", () => {
      render(<NativeSelect label="Status" options={statuses} description="Where it stands." />);
      expect(getSelect()).toHaveAccessibleDescription("Where it stands.");
      expect(screen.getByText("Where it stands.")).toHaveClass("native-select__description");
    });

    it("keeps the description out of the accessible name", () => {
      render(<NativeSelect label="Status" options={statuses} description="Where it stands." />);
      expect(getSelect()).toHaveAccessibleName("Status");
    });

    it("shows the error, linked to the select, when invalid", () => {
      render(<NativeSelect label="Status" options={statuses} invalid error="Choose a status." />);
      expect(screen.getByText("Choose a status.")).toBeInTheDocument();
      expect(getSelect()).toHaveAccessibleDescription("Error: Choose a status.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<NativeSelect label="Status" options={statuses} invalid error="Choose a status." />);
      const error = screen.getByText("Choose a status.").closest(".native-select__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the select is valid", () => {
      render(<NativeSelect label="Status" options={statuses} error="Choose a status." />);
      expect(getSelect()).toBeInTheDocument();
      expect(screen.queryByText("Choose a status.")).not.toBeInTheDocument();
      expect(getSelect()).toHaveAccessibleDescription("");
    });

    it("reads the description and the error together", () => {
      render(
        <NativeSelect label="Status" options={statuses} invalid description="Where it stands." error="Choose a status." />,
      );
      expect(getSelect()).toHaveAccessibleDescription("Where it stands. Error: Choose a status.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">You can change it later.</p>
          <NativeSelect
            label="Status"
            options={statuses}
            description="Where it stands."
            invalid
            error="Choose a status."
            aria-describedby="hint"
          />
        </>,
      );
      expect(getSelect()).toHaveAccessibleDescription("You can change it later. Where it stands. Error: Choose a status.");
      expect(getSelect()).toHaveAttribute("aria-invalid", "true");
    });

    it("renders a description for a select named by aria-label", () => {
      render(<NativeSelect aria-label="Sort by" options={statuses} description="Newest first by default." />);
      expect(getSelect()).toHaveAccessibleName("Sort by");
      expect(getSelect()).toHaveAccessibleDescription("Newest first by default.");
    });
  });

  describe("in a form", () => {
    const submitted = (form: HTMLFormElement) => [...new FormData(form).entries()];
    const getForm = () => screen.getByTestId("form") as HTMLFormElement;

    it("submits the chosen option's value under its name", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={grouped} />
        </form>,
      );
      await user.selectOptions(getSelect(), "offer");
      expect(submitted(getForm())).toEqual([["status", "offer"]]);
    });

    it("submits its defaultValue untouched", () => {
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={statuses} defaultValue="interview" />
        </form>,
      );
      expect(submitted(getForm())).toEqual([["status", "interview"]]);
    });

    it("submits the first option when nothing else is chosen and there's no placeholder", () => {
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={statuses} />
        </form>,
      );
      expect(submitted(getForm())).toEqual([["status", "applied"]]);
    });

    it("submits an empty value while the placeholder is chosen", () => {
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={statuses} placeholder="Choose a status" />
        </form>,
      );
      expect(submitted(getForm())).toEqual([["status", ""]]);
    });

    it("does not submit when disabled", () => {
      render(
        <form data-testid="form">
          <NativeSelect label="Status" name="status" options={statuses} defaultValue="offer" disabled />
        </form>,
      );
      expect(getSelect()).toHaveValue("offer");
      expect(getSelect()).toBeDisabled();
      expect(submitted(getForm())).toEqual([]);
    });
  });

  describe("id and form", () => {
    it("puts id on the select, and the label points to it", () => {
      render(<NativeSelect label="Status" options={statuses} id="status" />);
      expect(getSelect()).toHaveAttribute("id", "status");
      expect(screen.getByText("Status")).toHaveAttribute("for", "status");
    });

    it("can be labelled by an outside <label htmlFor>, because id is on the select", () => {
      render(
        <>
          <label htmlFor="status-field">Outside label</label>
          <NativeSelect id="status-field" aria-label="Inner name" options={statuses} />
        </>,
      );
      expect(screen.getByLabelText("Outside label")).toBe(getSelect());
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="application" data-testid="outside-form" />
          <NativeSelect label="Status" name="status" form="application" options={statuses} defaultValue="offer" />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([["status", "offer"]]);
    });
  });

  describe("refs", () => {
    it("forwards ref to the select element", () => {
      const ref = createRef<HTMLSelectElement>();
      render(<NativeSelect label="Status" options={statuses} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
      expect(ref.current).toBe(getSelect());
    });

    it("lets the ref focus the select and read its value", () => {
      const ref = createRef<HTMLSelectElement>();
      render(<NativeSelect label="Status" options={statuses} ref={ref} defaultValue="offer" />);
      ref.current?.focus();
      expect(getSelect()).toHaveFocus();
      expect(ref.current?.value).toBe("offer");
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string; options: [] }>().toExtend<NativeSelectProps>();
      expectTypeOf<{ "aria-label": string; options: [] }>().toExtend<NativeSelectProps>();
      expectTypeOf<{ options: [] }>().not.toExtend<NativeSelectProps>();
      // Empty label content isn't a name, so it still needs an aria-label
      expectTypeOf<{ label: undefined; options: [] }>().not.toExtend<NativeSelectProps>();
      expectTypeOf<{ label: null; options: [] }>().not.toExtend<NativeSelectProps>();
      expectTypeOf<{ label: string | undefined; options: [] }>().not.toExtend<NativeSelectProps>();
    });

    it("requires options, as plain-text options and groups", () => {
      expectTypeOf<{ label: string }>().not.toExtend<NativeSelectProps>();
      expectTypeOf<NativeSelectProps["options"]>().toEqualTypeOf<(NativeSelectOption | NativeSelectGroup)[]>();
      expectTypeOf<NativeSelectOption>().toEqualTypeOf<{ value: string; label: string; disabled?: boolean }>();
      expectTypeOf<NativeSelectGroup>().toEqualTypeOf<{ label: string; options: NativeSelectOption[]; disabled?: boolean }>();
    });

    it("takes no children, no multiple, and no readOnly", () => {
      expectTypeOf<NativeSelectProps>().not.toHaveProperty("children");
      expectTypeOf<NativeSelectProps>().not.toHaveProperty("multiple");
      expectTypeOf<NativeSelectProps>().not.toHaveProperty("readOnly");
    });

    it("only accepts the two sizes, never the select's numeric size", () => {
      expectTypeOf<NativeSelectProps["size"]>().toEqualTypeOf<NativeSelectSize | undefined>();
      expectTypeOf<NativeSelectSize>().toEqualTypeOf<"md" | "lg">();
    });

    it("takes string values and reports strings", () => {
      expectTypeOf<NativeSelectProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NativeSelectProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NativeSelectProps["placeholder"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NativeSelectProps["onValueChange"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("types events and the ref for a select, and keeps Base UI's render out", () => {
      expectTypeOf<NonNullable<NativeSelectProps["onChange"]>>().parameter(0).toEqualTypeOf<ChangeEvent<HTMLSelectElement>>();
      expectTypeOf<NativeSelectProps["ref"]>().toEqualTypeOf<Ref<HTMLSelectElement> | undefined>();
      expectTypeOf<NativeSelectProps>().not.toHaveProperty("render");
      expectTypeOf<NativeSelectProps["className"]>().toEqualTypeOf<string | undefined>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<NativeSelect label="" options={statuses} />);
      expect(getSelect()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] NativeSelect: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("warns when value matches none of the options", () => {
      render(<NativeSelect label="Status" options={statuses} value="hired" onValueChange={() => {}} />);
      expect(getSelect()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([noMatch("hired")]);
    });

    it("warns when defaultValue matches none of the options", () => {
      render(<NativeSelect label="Status" options={statuses} defaultValue="hired" />);
      expect(getSelect()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([noMatch("hired")]);
    });

    it("warns about an empty value when there's no placeholder and no empty option", () => {
      render(<NativeSelect label="Status" options={statuses} value="" onValueChange={() => {}} />);
      expect(getSelect()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([noMatch("")]);
    });

    it("stays quiet when the value matches an option, a grouped one, a disabled one, or the placeholder", () => {
      const { rerender } = render(<NativeSelect label="Status" options={grouped} value="offer" onValueChange={() => {}} />);
      expect(getSelect()).toHaveValue("offer");
      rerender(<NativeSelect label="Status" options={grouped} value="rejected" onValueChange={() => {}} />);
      expect(getSelect()).toHaveValue("rejected");
      rerender(<NativeSelect label="Status" options={grouped} value="withdrawn" onValueChange={() => {}} />);
      expect(getSelect()).toHaveValue("withdrawn");
      rerender(<NativeSelect label="Status" options={grouped} placeholder="Choose a status" value="" onValueChange={() => {}} />);
      expect(getSelect()).toHaveValue("");
      expect(takeWarnings()).toEqual([]);
    });

    it("warns when defaultValue was set before any options arrived, since the browser then chooses the first one", () => {
      const { rerender } = render(<NativeSelect label="Status" options={[]} defaultValue="offer" />);
      expect(getSelect()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
      rerender(<NativeSelect label="Status" options={statuses} defaultValue="offer" />);
      expect(getSelect()).toHaveValue("applied");
      expect(takeWarnings()).toEqual([
        `[design-system] NativeSelect: defaultValue "offer" was set before any options arrived, so the browser chose the first option instead. Pass value while the options load, or render the select once they have.`,
      ]);
    });

    it("stays quiet when a controlled value is set before the options arrive, since it's applied once they do", () => {
      const { rerender } = render(<NativeSelect label="Status" options={[]} value="offer" onValueChange={() => {}} />);
      rerender(<NativeSelect label="Status" options={statuses} value="offer" onValueChange={() => {}} />);
      expect(getSelect()).toHaveValue("offer");
      expect(takeWarnings()).toEqual([]);
    });

    it("stays quiet with no value set, or before any options have arrived", () => {
      const { rerender } = render(<NativeSelect label="Status" options={statuses} />);
      expect(getSelect()).toBeInTheDocument();
      rerender(<NativeSelect label="Status" options={[]} value="offer" onValueChange={() => {}} />);
      expect(getSelect()).toBeInTheDocument();
      rerender(<NativeSelect label="Status" options={[]} placeholder="Choose a status" value="offer" onValueChange={() => {}} />);
      expect(within(getSelect()).getByText("Choose a status")).toBeInTheDocument();
      rerender(<NativeSelect label="Status" options={[{ label: "Closed", options: [] }]} defaultValue="offer" />);
      expect(getSelect().querySelector("optgroup")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });
  });
});
