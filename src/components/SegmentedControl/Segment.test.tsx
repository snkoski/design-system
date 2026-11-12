import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ReactElement } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Segment } from "@/components/SegmentedControl/Segment";
import type { SegmentProps } from "@/components/SegmentedControl/Segment";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";

const getOption = (name: string) => screen.getByRole("radio", { name });
const getInput = (container: HTMLElement, value: string) =>
  container.querySelector<HTMLInputElement>(`input[type=radio][value=${value}]`)!;

function ListIcon() {
  return (
    <svg data-testid="list-icon" viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg data-testid="grid-icon" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" />
    </svg>
  );
}

describe("Segment", () => {
  describe("rendering", () => {
    it("renders a focusable span with the radio role, named by its label", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list">List</Segment>
        </SegmentedControl>,
      );
      const option = getOption("List");
      expect(option.tagName).toBe("SPAN");
      expect(option).toHaveAttribute("tabindex", "0");
      expect(option).toHaveClass("segment__button");
    });

    it("puts the label text in its label part", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list">List</Segment>
        </SegmentedControl>,
      );
      const label = getOption("List").querySelector(".segment__label");
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent("List");
    });

    // The chosen option doesn't turn bold, so there's no hidden copy of the label to keep its width
    it("renders its label once, with nothing hidden from screen readers, so the name isn't doubled", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list">List</Segment>
        </SegmentedControl>,
      );
      expect(getOption("List")).toHaveTextContent(/^List$/);
      expect(getOption("List").querySelector('[aria-hidden="true"]')).toBeNull();
      expect(getOption("List")).toHaveAccessibleName("List");
    });

    it("applies className to its wrapper, next to its own class", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" className="mt-4">
            List
          </Segment>
        </SegmentedControl>,
      );
      const wrapper = getOption("List").closest(".segment");
      expect(wrapper).toHaveClass("segment", "mt-4");
      expect(wrapper).not.toBe(getOption("List"));
    });

    it("passes other props through to the button", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" data-testid="list-option">
            List
          </Segment>
        </SegmentedControl>,
      );
      expect(screen.getByTestId("list-option")).toBe(getOption("List"));
    });

    it("tells the control which value it stands for", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <SegmentedControl label="View" name="view">
          <Segment value="list">List</Segment>
        </SegmentedControl>,
      );
      expect(getInput(container, "list")).toHaveAttribute("name", "view");
      await user.click(getOption("List"));
      expect(getInput(container, "list")).toBeChecked();
    });

    it("is marked chosen or not with aria-checked", () => {
      render(
        <SegmentedControl label="View" defaultValue="grid">
          <Segment value="list">List</Segment>
          <Segment value="grid">Grid</Segment>
        </SegmentedControl>,
      );
      expect(getOption("List")).toHaveAttribute("aria-checked", "false");
      expect(getOption("Grid")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("icons", () => {
    it("shows an icon before the label, hidden from screen readers", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" iconStart={<ListIcon />}>
            List
          </Segment>
        </SegmentedControl>,
      );
      const icon = screen.getByTestId("list-icon").parentElement!;
      expect(icon).toHaveClass("segment__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon.compareDocumentPosition(getOption("List").querySelector(".segment__label")!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(getOption("List")).toHaveAccessibleName("List");
    });

    it("shows an icon after the label, hidden from screen readers", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" iconEnd={<ListIcon />}>
            List
          </Segment>
        </SegmentedControl>,
      );
      const icon = screen.getByTestId("list-icon").parentElement!;
      expect(icon).toHaveClass("segment__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(getOption("List").querySelector(".segment__label")!.compareDocumentPosition(icon)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it("shows icons on both sides", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" iconStart={<ListIcon />} iconEnd={<GridIcon />}>
            List
          </Segment>
        </SegmentedControl>,
      );
      const icons = getOption("List").querySelectorAll(".segment__icon");
      expect(icons).toHaveLength(2);
      expect(icons[0]).toContainElement(screen.getByTestId("list-icon"));
      expect(icons[1]).toContainElement(screen.getByTestId("grid-icon"));
      expect(getOption("List")).toHaveAccessibleName("List");
    });

    it("shows only the icon when icon-only, named by its aria-label", () => {
      render(
        <SegmentedControl aria-label="View">
          <Segment value="list" iconOnly aria-label="List view">
            <ListIcon />
          </Segment>
        </SegmentedControl>,
      );
      const option = getOption("List view");
      expect(option).toContainElement(screen.getByTestId("list-icon"));
      expect(screen.getByTestId("list-icon").parentElement).toHaveClass("segment__icon");
      expect(screen.getByTestId("list-icon").parentElement).toHaveAttribute("aria-hidden", "true");
      expect(option.querySelector(".segment__label")).toBeNull();
      expect(option).toHaveAttribute("data-icon-only");
    });

    it("isn't marked icon-only when it has label text", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" iconStart={<ListIcon />}>
            List
          </Segment>
        </SegmentedControl>,
      );
      expect(getOption("List").querySelector(".segment__label")).toBeInTheDocument();
      expect(getOption("List")).not.toHaveAttribute("data-icon-only");
    });
  });

  describe("disabled on its own", () => {
    const views = (
      <>
        <Segment value="list">List</Segment>
        <Segment value="grid" disabled>
          Grid
        </Segment>
        <Segment value="board">Board</Segment>
      </>
    );

    it("is disabled, but not the others", () => {
      render(<SegmentedControl label="View">{views}</SegmentedControl>);
      expect(getOption("Grid")).toHaveAttribute("aria-disabled", "true");
      expect(getOption("Grid")).toHaveAttribute("data-disabled");
      expect(getOption("List")).not.toHaveAttribute("aria-disabled", "true");
      expect(getOption("List")).not.toHaveAttribute("data-disabled");
      expect(getOption("Board")).not.toHaveAttribute("aria-disabled", "true");
    });

    it("can't be chosen by clicking it, while the others can", async () => {
      const user = userEvent.setup();
      render(<SegmentedControl label="View">{views}</SegmentedControl>);
      await user.click(getOption("Grid"));
      expect(getOption("Grid")).toHaveAttribute("aria-checked", "false");
      await user.click(getOption("Board"));
      expect(getOption("Board")).toHaveAttribute("aria-checked", "true");
    });

    it("is skipped by the arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <SegmentedControl label="View" defaultValue="list">
          {views}
        </SegmentedControl>,
      );
      await user.tab();
      expect(getOption("List")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(getOption("Board")).toHaveFocus();
      expect(getOption("Board")).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{ArrowLeft}");
      expect(getOption("List")).toHaveFocus();
    });
  });

  describe("disabled with the tab stop", () => {
    it("lets Tab land on the first option that isn't disabled when nothing is chosen", async () => {
      const user = userEvent.setup();
      render(
        <SegmentedControl label="View">
          <Segment value="list" disabled>
            List
          </Segment>
          <Segment value="grid">Grid</Segment>
        </SegmentedControl>,
      );
      expect(getOption("List")).toHaveAttribute("aria-checked", "false");
      await user.tab();
      expect(getOption("Grid")).toHaveFocus();
    });

    it("lets Tab reach the control when the chosen option is disabled", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <SegmentedControl label="View" defaultValue="grid">
            <Segment value="list">List</Segment>
            <Segment value="grid" disabled>
              Grid
            </Segment>
            <Segment value="board">Board</Segment>
          </SegmentedControl>
        </>,
      );
      expect(getOption("Grid")).toHaveAttribute("aria-checked", "true");
      await user.tab();
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("radiogroup")).toContainElement(document.activeElement as HTMLElement);
    });
  });

  describe("refs", () => {
    it("forwards ref to the option element", () => {
      const ref = createRef<HTMLElement>();
      render(
        <SegmentedControl label="View">
          <Segment value="list" ref={ref}>
            List
          </Segment>
        </SegmentedControl>,
      );
      expect(ref.current).toBe(getOption("List"));
    });
  });

  describe("dev warnings", () => {
    it("warns when the label text is empty and there's no aria-label", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list">{""}</Segment>
        </SegmentedControl>,
      );
      expect(screen.getByRole("radio")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Segment: has no accessible name, so screen readers announce it without one. Give it label text (children) or an aria-label.",
      ]);
    });

    it("warns when an icon-only option has an empty aria-label", () => {
      render(
        <SegmentedControl label="View">
          <Segment value="list" iconOnly aria-label="">
            <ListIcon />
          </Segment>
        </SegmentedControl>,
      );
      expect(screen.getByRole("radio")).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Segment: has no accessible name, so screen readers announce it without one. Give an icon-only option an aria-label that says what it shows.",
      ]);
    });
  });

  describe("types", () => {
    it("requires a value", () => {
      expectTypeOf<{ value: string; children: string }>().toExtend<SegmentProps>();
      expectTypeOf<{ children: string }>().not.toExtend<SegmentProps>();
      expectTypeOf<SegmentProps["value"]>().toEqualTypeOf<string>();
    });

    it("requires label text", () => {
      expectTypeOf<{ value: string }>().not.toExtend<SegmentProps>();
      expectTypeOf<{ value: string; children: undefined }>().not.toExtend<SegmentProps>();
      expectTypeOf<{ value: string; children: null }>().not.toExtend<SegmentProps>();
      expectTypeOf<{ value: string; children: false }>().not.toExtend<SegmentProps>();
      expectTypeOf<{ value: string; children: string | undefined }>().not.toExtend<SegmentProps>();
      // An aria-label alone would leave an empty button on screen: show an icon with iconOnly instead
      expectTypeOf<{ value: string; "aria-label": string }>().not.toExtend<SegmentProps>();
    });

    it("requires an aria-label and an icon when icon-only", () => {
      expectTypeOf<{ value: string; iconOnly: true; children: ReactElement; "aria-label": string }>().toExtend<SegmentProps>();
      expectTypeOf<{ value: string; iconOnly: true; children: ReactElement }>().not.toExtend<SegmentProps>();
      expectTypeOf<{ value: string; iconOnly: true; "aria-label": string }>().not.toExtend<SegmentProps>();
    });

    it("takes icons on either side", () => {
      expectTypeOf<{ value: string; children: string; iconStart: ReactElement; iconEnd: ReactElement }>().toExtend<SegmentProps>();
    });

    it("leaves out what the control owns, and Base UI's render, nativeButton, id, and inputRef", () => {
      expectTypeOf<SegmentProps>().not.toHaveProperty("name");
      expectTypeOf<SegmentProps>().not.toHaveProperty("required");
      expectTypeOf<SegmentProps>().not.toHaveProperty("readOnly");
      expectTypeOf<SegmentProps>().not.toHaveProperty("invalid");
      expectTypeOf<SegmentProps>().not.toHaveProperty("error");
      expectTypeOf<SegmentProps>().not.toHaveProperty("size");
      expectTypeOf<SegmentProps>().not.toHaveProperty("checked");
      expectTypeOf<SegmentProps>().not.toHaveProperty("defaultChecked");
      expectTypeOf<SegmentProps>().not.toHaveProperty("render");
      expectTypeOf<SegmentProps>().not.toHaveProperty("nativeButton");
      expectTypeOf<SegmentProps>().not.toHaveProperty("id");
      expectTypeOf<SegmentProps>().not.toHaveProperty("inputRef");
      expectTypeOf<SegmentProps["className"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
