import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { Rating } from "@/components/Rating/Rating";
import type { RatingProps } from "@/components/Rating/Rating";

const getGroup = () => screen.getByRole("radiogroup");
const getStar = (count: number) => screen.getByRole("radio", { name: count === 1 ? "1 star" : `${count} stars` });
const getStars = () => {
  const stars = screen.getAllByRole("radio");
  expect(stars.length).toBeGreaterThan(0);
  return stars;
};
/** The numbers of the chosen stars (aria-checked), in order */
const chosen = () =>
  getStars()
    .map((star, index) => (star.getAttribute("aria-checked") === "true" ? index + 1 : null))
    .filter((value) => value !== null);
const getClear = () => screen.getByRole("button", { name: /^Clear rating/ });
const queryClear = () => screen.queryByRole("button", { name: /^Clear rating/ });
const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const submitted = (form: HTMLFormElement = getForm()) => new FormData(form).getAll("interest");
/** Waits for the reset's timer, which runs after the browser has reset the fields */
const reset = async (form: HTMLFormElement = getForm()) => {
  await act(async () => {
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

describe("Rating", () => {
  describe("rendering", () => {
    it("renders a radio group named by its label, holding five stars", () => {
      render(<Rating label="Interest" />);
      const group = screen.getByRole("radiogroup", { name: "Interest" });
      expect(getStars()).toHaveLength(5);
      for (const star of getStars()) expect(group).toContainElement(star);
    });

    it("names the stars 1 star, 2 stars, and so on, in order", () => {
      render(<Rating label="Interest" />);
      expect(getStars().map((star) => star.getAttribute("aria-label"))).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]);
      expect(getStar(1)).toHaveAccessibleName("1 star");
      expect(getStar(1).compareDocumentPosition(getStar(5))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("renders max stars", () => {
      const { rerender } = render(<Rating label="Interest" max={3} />);
      expect(getStars()).toHaveLength(3);
      rerender(<Rating label="Interest" max={10} />);
      expect(getStars()).toHaveLength(10);
      expect(getStar(10)).toBeInTheDocument();
    });

    it("renders each star as a span with the radio role, so a disabled one stays focusable", () => {
      render(<Rating label="Interest" />);
      for (const star of getStars()) {
        expect(star.tagName).toBe("SPAN");
        expect(star).toHaveClass("rating__star");
      }
    });

    it("draws each star with an outline and a fill, hidden from screen readers", () => {
      render(<Rating label="Interest" />);
      for (const star of getStars()) {
        const icon = star.querySelector("svg");
        expect(icon).toHaveClass("rating__icon");
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon?.querySelector(".rating__outline")).toBeInTheDocument();
        expect(icon?.querySelector(".rating__fill")).toBeInTheDocument();
        expect(star).toHaveAccessibleName(/^\d+ stars?$/);
      }
    });

    it("gives each star its own id", () => {
      render(<Rating label="Interest" />);
      const ids = getStars().map((star) => star.id);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(5);
    });

    it("puts the radio group inside a fieldset named by the same label, next to the Clear button's place", () => {
      const { container } = render(<Rating label="Interest" defaultValue={3} />);
      const fieldset = container.querySelector("fieldset");
      expect(fieldset).toHaveClass("choice-group__group", "rating__group");
      expect(screen.getByRole("group", { name: "Interest" })).toBe(fieldset);
      expect(fieldset).toContainElement(getGroup());
      expect(getGroup()).toHaveClass("rating__stars");
      const row = container.querySelector(".rating__row");
      expect(row).toContainElement(getGroup());
      expect(row).toContainElement(getClear());
      expect(getGroup()).not.toContainElement(getClear());
    });

    it("puts the shared group classes next to its own, so choice-group.css and field.css draw what the groups share", () => {
      const { container } = render(<Rating label="Interest" description="How much you want this job." />);
      expect(container.firstElementChild).toHaveClass("choice-group", "rating");
      expect(screen.getByText("Interest").closest(".rating__label")).toHaveClass("field-label");
      expect(screen.getByText("Interest")).toHaveClass("rating__label-text");
      expect(screen.getByText("How much you want this job.")).toHaveClass("field-description", "rating__description");
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<Rating aria-label="Interest" />);
      expect(screen.getByRole("radiogroup", { name: "Interest" })).toBeInTheDocument();
      expect(container.querySelector(".rating__label")).toBeNull();
    });

    it("chooses nothing by default", () => {
      render(<Rating label="Interest" />);
      for (const star of getStars()) expect(star).toHaveAttribute("aria-checked", "false");
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<Rating label="Interest" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("rating", "mt-4");
    });

    it("passes other props through to the radio group", () => {
      render(<Rating label="Interest" data-testid="interest" />);
      expect(screen.getByTestId("interest")).toBe(getGroup());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <Rating label="Interest" invalid disabled readOnly required description="More" error="Choose a rating." defaultValue={2} />,
      );
      expect(container.querySelector(".rating__stars")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/rating--|rating__star--/);
    });
  });

  describe("choosing", () => {
    it("starts with the defaultValue star chosen", () => {
      render(<Rating label="Interest" defaultValue={4} />);
      expect(chosen()).toEqual([4]);
    });

    it("chooses one star at a time, reporting its number", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" onValueChange={onValueChange} />);
      await user.click(getStar(2));
      expect(chosen()).toEqual([2]);
      await user.click(getStar(5));
      expect(chosen()).toEqual([5]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([2, 5]);
    });

    it("passes Base UI's change details when a star is chosen", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" onValueChange={onValueChange} />);
      await user.click(getStar(3));
      expect(onValueChange).toHaveBeenCalledWith(3, expect.objectContaining({ cancel: expect.any(Function) }));
    });

    it("keeps a star chosen when it's clicked again", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={3} onValueChange={onValueChange} />);
      await user.click(getStar(3));
      expect(chosen()).toEqual([3]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps the rating as it was when the page cancels the change", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={2} onValueChange={(_value, details) => details?.cancel()} />);
      await user.click(getStar(4));
      expect(chosen()).toEqual([2]);
    });

    it("does nothing when its own label is clicked", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" onValueChange={onValueChange} />);
      await user.click(screen.getByText("Interest"));
      expect(getStars()).toHaveLength(5);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Rating label="Interest" value={2} onValueChange={onValueChange} />);
      await user.click(getStar(4));
      expect(onValueChange).toHaveBeenCalledWith(4, expect.anything());
      expect(chosen()).toEqual([2]);
      rerender(<Rating label="Interest" value={5} onValueChange={onValueChange} />);
      expect(chosen()).toEqual([5]);
    });

    it("chooses nothing when controlled with null", () => {
      render(<Rating label="Interest" value={null} />);
      expect(getStars()).toHaveLength(5);
      expect(chosen()).toEqual([]);
    });

    it("works as a controlled rating driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<number | null>(1);
        return (
          <>
            <Rating label="Interest" value={value} onValueChange={setValue} />
            <output>{value ?? "none"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      expect(screen.getByRole("status")).toHaveTextContent("1");
      await user.click(getStar(4));
      expect(screen.getByRole("status")).toHaveTextContent("4");
      expect(chosen()).toEqual([4]);
    });
  });

  describe("keyboard", () => {
    it("is one Tab stop for the stars: Tab lands on the first star when nothing is chosen, and the next Tab leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Rating label="Interest" />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getStar(1)).toHaveFocus();
      expect(chosen()).toEqual([]);
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("lands on the chosen star with Tab, then moves to Clear, then leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Rating label="Interest" defaultValue={3} />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getStar(3)).toHaveFocus();
      await user.tab();
      expect(getClear()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      await user.tab({ shift: true });
      expect(getStar(3)).toHaveFocus();
    });

    it("moves and chooses with Right and Down, and Left and Up", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getStar(3)).toHaveFocus();
      expect(chosen()).toEqual([3]);
      await user.keyboard("{ArrowDown}");
      expect(chosen()).toEqual([4]);
      await user.keyboard("{ArrowLeft}");
      expect(chosen()).toEqual([3]);
      await user.keyboard("{ArrowUp}");
      expect(getStar(2)).toHaveFocus();
      expect(chosen()).toEqual([2]);
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([3, 4, 3, 2]);
    });

    it("wraps around at both ends", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={5} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getStar(1)).toHaveFocus();
      expect(chosen()).toEqual([1]);
      await user.keyboard("{ArrowLeft}");
      expect(chosen()).toEqual([5]);
    });

    it("chooses the focused star with Space", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" />);
      await user.tab();
      expect(getStar(1)).toHaveFocus();
      expect(chosen()).toEqual([]);
      await user.keyboard(" ");
      expect(chosen()).toEqual([1]);
    });

    it("doesn't choose or submit the form with Enter", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
          <Rating label="Interest" name="interest" />
          <button type="submit">Save</button>
        </form>,
      );
      await user.tab();
      expect(getStar(1)).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(chosen()).toEqual([]);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does nothing with Home or End", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={3} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{Home}{End}");
      expect(getStar(3)).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("clearing", () => {
    it("has no Clear button until a star is chosen", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" />);
      expect(getStars()).toHaveLength(5);
      expect(queryClear()).toBeNull();
      await user.click(getStar(2));
      expect(getClear()).toBeInTheDocument();
    });

    it("names Clear with its words, then the rating's label", () => {
      render(<Rating label="Interest" defaultValue={2} />);
      expect(getClear()).toHaveAccessibleName("Clear rating, Interest");
    });

    it("points Clear's name at the label text, not the whole legend", () => {
      render(<Rating label="Interest" defaultValue={2} />);
      const labelText = screen.getByText("Interest");
      expect(labelText.id).not.toBe("");
      expect(getClear().getAttribute("aria-labelledby")?.split(" ")).toEqual([expect.any(String), labelText.id]);
    });

    it("names Clear from the aria-label when there's one", () => {
      render(<Rating aria-label="Interest" defaultValue={2} />);
      expect(getClear()).toHaveAccessibleName("Clear rating, Interest");
      expect(getClear()).toHaveAttribute("aria-label", "Clear rating, Interest");
      expect(getClear().querySelector(".visually-hidden")).toBeNull();
    });

    it("names Clear from aria-labelledby when that's what names the rating", () => {
      render(
        <>
          <h2 id="interest-heading">Interest</h2>
          <Rating aria-label="" aria-labelledby="interest-heading" defaultValue={2} />
        </>,
      );
      expect(getClear()).toHaveAccessibleName("Clear rating, Interest");
    });

    it("uses the aria-label for Clear's name even when there's also a label", () => {
      render(<Rating label="Interest" aria-label="Interest in this job" defaultValue={2} />);
      expect(getClear()).toHaveAccessibleName("Clear rating, Interest in this job");
    });

    it("gives two ratings' Clear buttons different names", () => {
      render(
        <>
          <Rating label="Interest" defaultValue={2} />
          <Rating label="Salary" defaultValue={4} />
        </>,
      );
      expect(screen.getByRole("button", { name: "Clear rating, Interest" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear rating, Salary" })).toBeInTheDocument();
    });

    it("draws Clear as a shared inset button with an icon hidden from screen readers", () => {
      render(<Rating label="Interest" defaultValue={2} />);
      expect(getClear().tagName).toBe("BUTTON");
      expect(getClear()).toHaveAttribute("type", "button");
      expect(getClear()).toHaveClass("inset-button", "rating__clear");
      expect(getClear().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("empties the rating and reports null, with no change details", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={3} onValueChange={onValueChange} />);
      await user.click(getClear());
      expect(chosen()).toEqual([]);
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange.mock.calls[0]).toEqual([null]);
      expect(queryClear()).toBeNull();
    });

    it("empties what the form submits", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={3} />
        </form>,
      );
      expect(submitted()).toEqual(["3"]);
      await user.click(getClear());
      expect(getForm().querySelectorAll("input[name=interest]")).toHaveLength(5);
      expect(submitted()).toEqual([]);
    });

    it("works with Enter and Space", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Rating label="Interest" defaultValue={3} />);
      getClear().focus();
      await user.keyboard("{Enter}");
      expect(chosen()).toEqual([]);
      rerender(<Rating label="Interest" defaultValue={3} key="again" />);
      getClear().focus();
      await user.keyboard(" ");
      expect(chosen()).toEqual([]);
    });

    it("moves focus to the stars' Tab stop after clearing, without choosing that star again", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" defaultValue={3} />);
      await user.tab();
      await user.tab();
      expect(getClear()).toHaveFocus();
      await user.keyboard("{Enter}");
      const tabStop = getStars().find((star) => star.tabIndex === 0);
      expect(tabStop).toBeDefined();
      expect(tabStop).toHaveFocus();
      expect(chosen()).toEqual([]);
    });

    it("keeps focus on Clear when a controlled page ignores the null", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" value={3} onValueChange={onValueChange} />);
      getClear().focus();
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(chosen()).toEqual([3]);
      expect(getClear()).toHaveFocus();
    });

    it("moves focus to the stars when Clear disappears while it has focus", () => {
      const { rerender } = render(<Rating label="Interest" value={3} />);
      getClear().focus();
      expect(getClear()).toHaveFocus();
      rerender(<Rating label="Interest" value={null} />);
      expect(queryClear()).toBeNull();
      expect(getStars().find((star) => star.tabIndex === 0)).toHaveFocus();
    });

    it("moves focus to the chosen star when Clear disappears because the rating turns read-only", () => {
      const { rerender } = render(<Rating label="Interest" value={3} />);
      getClear().focus();
      rerender(<Rating label="Interest" value={3} readOnly />);
      expect(queryClear()).toBeNull();
      expect(getStar(3)).toHaveFocus();
    });

    it("leaves focus alone when Clear disappears without having it", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <>
          <Rating label="Interest" value={3} />
          <button type="button">Elsewhere</button>
        </>,
      );
      expect(getClear()).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      rerender(
        <>
          <Rating label="Interest" value={null} />
          <button type="button">Elsewhere</button>
        </>,
      );
      expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
    });

    it.each([
      ["required", { required: true }],
      ["read-only", { readOnly: true }],
      ["disabled", { disabled: true }],
    ] as const)("has no Clear button when %s", (_state, props) => {
      render(<Rating label="Interest" defaultValue={3} {...props} />);
      expect(chosen()).toEqual([3]);
      expect(queryClear()).toBeNull();
    });

    it("shows Clear for a value that matches no star, so it can still be cleared", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" value={7} onValueChange={onValueChange} />);
      takeWarnings();
      expect(chosen()).toEqual([]);
      await user.click(getClear());
      expect(onValueChange).toHaveBeenCalledWith(null);
    });
  });

  describe("description and error", () => {
    it("links the description to the radio group", () => {
      render(<Rating label="Interest" description="How much you want this job." />);
      expect(getGroup()).toHaveAccessibleDescription("How much you want this job.");
      expect(getGroup()).toHaveAccessibleName("Interest");
    });

    it("puts the description between the label and the stars", () => {
      render(<Rating label="Interest" description="How much you want this job." />);
      const description = screen.getByText("How much you want this job.");
      expect(screen.getByText("Interest").compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(getStar(1))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("also describes each star with the rating's description", () => {
      render(<Rating label="Interest" description="How much you want this job." />);
      for (const star of getStars()) expect(star).toHaveAccessibleDescription("How much you want this job.");
    });

    it("shows the error before the stars, linked to the radio group, when invalid", () => {
      render(<Rating label="Interest" invalid error="Choose how interested you are." />);
      const error = screen.getByText("Choose how interested you are.");
      expect(getGroup()).toHaveAccessibleDescription("Error: Choose how interested you are.");
      expect(error.compareDocumentPosition(getStar(1))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      render(<Rating label="Interest" invalid error="Choose how interested you are." />);
      const error = screen.getByText("Choose how interested you are.").closest(".rating__error");
      expect(error).toBeInTheDocument();
      expect(error?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("reads the description and the error together", () => {
      render(<Rating label="Interest" invalid description="How much you want this job." error="Choose how interested you are." />);
      expect(getGroup()).toHaveAccessibleDescription("How much you want this job. Error: Choose how interested you are.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">You can change it later.</p>
          <Rating
            label="Interest"
            description="How much you want this job."
            invalid
            error="Choose how interested you are."
            aria-describedby="hint"
          />
        </>,
      );
      const description = getGroup().getAttribute("aria-describedby") ?? "";
      expect(description.split(" ")).toContain("hint");
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("You can change it later."));
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("How much you want this job."));
      expect(getGroup()).toHaveAccessibleDescription(expect.stringContaining("Choose how interested you are."));
    });

    it("hides the error when the rating is valid", () => {
      render(<Rating label="Interest" error="Choose how interested you are." />);
      expect(getStars()).toHaveLength(5);
      expect(screen.queryByText("Choose how interested you are.")).not.toBeInTheDocument();
      expect(getGroup()).toHaveAccessibleDescription("");
    });

    it("marks the radio group and every star invalid when the rating is", () => {
      render(<Rating label="Interest" invalid />);
      expect(getGroup()).toHaveAttribute("aria-invalid", "true");
      for (const star of getStars()) expect(star).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<Rating label="Interest" />);
      expect(getGroup()).not.toHaveAttribute("aria-invalid", "true");
      for (const star of getStars()) expect(star).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("required", () => {
    it("is announced as required", () => {
      render(<Rating label="Interest" required />);
      expect(getGroup()).toHaveAttribute("aria-required", "true");
    });

    it("is not required by default", () => {
      render(<Rating label="Interest" />);
      expect(getStars()).toHaveLength(5);
      expect(getGroup()).not.toHaveAttribute("aria-required", "true");
    });

    it("fails the form's own validation until a star is chosen", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" required />
        </form>,
      );
      expect(getForm().querySelectorAll("input[name=interest]")).toHaveLength(5);
      expect(getForm().checkValidity()).toBe(false);
      await user.click(getStar(4));
      expect(getForm().checkValidity()).toBe(true);
    });
  });

  describe("disabled", () => {
    it("disables every star, and marks the wrapper and the radio group", () => {
      const { container } = render(<Rating label="Interest" disabled />);
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(getGroup()).toHaveAttribute("aria-disabled", "true");
      for (const star of getStars()) {
        expect(star).toHaveAttribute("aria-disabled", "true");
        expect(star).toHaveAttribute("data-disabled");
      }
    });

    it("blocks clicks on the stars", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" disabled defaultValue={2} onValueChange={onValueChange} />);
      await user.click(getStar(4));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual([2]);
    });

    // Base UI keeps the chosen star of a disabled group in the tab order, announced as disabled, as RadioGroup does.
    // docs/revisit.md records the question.
    it("still lets Tab reach the chosen star, announced as disabled", async () => {
      const user = userEvent.setup();
      render(<Rating label="Interest" disabled defaultValue={4} />);
      await user.tab();
      expect(getStar(4)).toHaveFocus();
      expect(getStar(4)).toHaveAttribute("aria-disabled", "true");
    });

    it("blocks the arrow keys and Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" disabled defaultValue={2} onValueChange={onValueChange} />);
      getStar(2).focus();
      await user.keyboard("{ArrowRight} ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual([2]);
    });

    it("keeps the chosen star chosen, and isn't submitted", () => {
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" disabled defaultValue={4} />
        </form>,
      );
      const input = getForm().querySelector<HTMLInputElement>("input[name=interest][value='4']");
      expect(chosen()).toEqual([4]);
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
      expect(submitted()).toEqual([]);
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<Rating label="Interest" readOnly />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.closest(".rating__label")).toHaveTextContent("Interest");
      expect(getGroup()).toHaveAccessibleName("Interest");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<Rating label="Interest" />);
      expect(getGroup()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<Rating label="Interest" readOnly disabled />);
      expect(getGroup()).toHaveAttribute("aria-readonly", "true");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("marks the radio group read-only, and each star for styling", () => {
      render(<Rating label="Interest" readOnly />);
      expect(getGroup()).toHaveAttribute("aria-readonly", "true");
      for (const star of getStars()) expect(star).toHaveAttribute("data-readonly");
    });

    it("blocks changes from clicks", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" readOnly defaultValue={2} onValueChange={onValueChange} />);
      await user.click(getStar(5));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual([2]);
    });

    it("lets the arrow keys move focus without choosing, and ignores Space", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Rating label="Interest" readOnly defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      expect(getStar(2)).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(getStar(3)).toHaveFocus();
      await user.keyboard(" ");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(chosen()).toEqual([2]);
    });

    it("is still submitted", () => {
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" readOnly defaultValue={4} />
        </form>,
      );
      expect(submitted()).toEqual(["4"]);
    });
  });

  describe("in a form", () => {
    it("submits the chosen number as text under the rating's name", () => {
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={3} />
        </form>,
      );
      expect(submitted()).toEqual(["3"]);
    });

    it("submits nothing when nothing is chosen", () => {
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" />
        </form>,
      );
      expect(getForm().querySelectorAll("input[name=interest]")).toHaveLength(5);
      expect(submitted()).toEqual([]);
    });

    it("submits the star the user chooses", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={1} />
        </form>,
      );
      await user.click(getStar(5));
      expect(submitted()).toEqual(["5"]);
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="job" data-testid="outside-form" />
          <Rating label="Interest" name="interest" form="job" defaultValue={2} />
        </>,
      );
      expect(submitted(screen.getByTestId("outside-form") as HTMLFormElement)).toEqual(["2"]);
    });

    it("submits nothing for a value that matches no star", () => {
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" value={7} />
        </form>,
      );
      takeWarnings();
      expect(getForm().querySelectorAll("input[name=interest]")).toHaveLength(5);
      expect(submitted()).toEqual([]);
    });
  });

  describe("form reset", () => {
    it("goes back to defaultValue, in the stars and in what the form submits, without reporting a change", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={2} onValueChange={onValueChange} />
        </form>,
      );
      await user.click(getStar(4));
      onValueChange.mockClear();
      await reset();
      await waitFor(() => expect(chosen()).toEqual([2]));
      expect(submitted()).toEqual(["2"]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("goes back to nothing chosen when there's no defaultValue", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" />
        </form>,
      );
      await user.click(getStar(4));
      await reset();
      await waitFor(() => expect(chosen()).toEqual([]));
      expect(submitted()).toEqual([]);
    });

    it("goes back to defaultValue after a clear", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={3} />
        </form>,
      );
      await user.click(getClear());
      await reset();
      await waitFor(() => expect(chosen()).toEqual([3]));
      expect(submitted()).toEqual(["3"]);
    });

    it("leaves a controlled value alone, with the form submitting what the stars show, and doesn't report a change", async () => {
      const onValueChange = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<number | null>(2);
        return (
          <form data-testid="form">
            <Rating
              label="Interest"
              name="interest"
              value={value}
              onValueChange={(next) => {
                onValueChange(next);
                setValue(next);
              }}
            />
          </form>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.click(getStar(5));
      onValueChange.mockClear();
      await reset();
      expect(chosen()).toEqual([5]);
      expect(submitted()).toEqual(["5"]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("resets with a form it sits outside of, through form", async () => {
      const user = userEvent.setup();
      render(
        <>
          <form id="job" data-testid="outside-form" />
          <Rating label="Interest" name="interest" form="job" defaultValue={2} />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      await user.click(getStar(5));
      expect(submitted(form)).toEqual(["5"]);
      await reset(form);
      await waitFor(() => expect(chosen()).toEqual([2]));
      expect(submitted(form)).toEqual(["2"]);
    });
  });

  describe("color", () => {
    const wrapper = (container: HTMLElement) => {
      const element = container.querySelector<HTMLElement>(".rating");
      expect(element).toBeInTheDocument();
      return element!;
    };

    it("is gold with no color prop, set by the CSS rather than inline", () => {
      const { container } = render(<Rating label="Interest" />);
      expect(wrapper(container)).toHaveAttribute("data-color", "gold");
      expect(wrapper(container).style.getPropertyValue("--rating-color")).toBe("");
    });

    it("marks the brand color with data-color, not inline", () => {
      const { container } = render(<Rating label="Interest" color="brand" />);
      expect(wrapper(container)).toHaveAttribute("data-color", "brand");
      expect(wrapper(container).style.getPropertyValue("--rating-color")).toBe("");
    });

    it("sets any other color inline on the wrapper, as data-color custom", () => {
      const { container } = render(<Rating label="Interest" color="hsl(210 80% 46%)" />);
      expect(wrapper(container)).toHaveAttribute("data-color", "custom");
      expect(wrapper(container).style.getPropertyValue("--rating-color")).toBe("hsl(210 80% 46%)");
    });

    it("never puts a color attribute on any element", () => {
      const { container } = render(<Rating label="Interest" color="hsl(210 80% 46%)" />);
      expect(wrapper(container)).toHaveAttribute("data-color", "custom");
      expect(container.querySelector("[color]")).toBeNull();
    });

    it("warns, naming Rating, when the browser can't read the color", () => {
      vi.stubGlobal("CSS", { supports: () => false });
      onTestFinished(() => {
        vi.unstubAllGlobals();
      });
      render(<Rating label="Interest" color="sparkly" />);
      expect(takeWarnings()).toEqual([
        '[design-system] Rating: color must be "gold", "brand", or a CSS color, like "hsl(210 80% 46%)". Got "sparkly".',
      ]);
    });
  });

  describe("refs", () => {
    it("forwards ref to the radio group element", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Rating label="Interest" ref={ref} />);
      expect(ref.current).toBe(getGroup());
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<Rating label="" />);
      expect(getGroup()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it("stays quiet when aria-labelledby names it", () => {
      render(
        <>
          <h2 id="interest-heading">Interest</h2>
          <Rating aria-label="" aria-labelledby="interest-heading" />
        </>,
      );
      expect(screen.getByRole("radiogroup", { name: "Interest" })).toBeInTheDocument();
      expect(takeWarnings()).toEqual([]);
    });

    it.each([3.5, 0, -2, Number.NaN])("warns about max %s and renders five stars", (max) => {
      render(<Rating label="Interest" max={max} />);
      expect(getStars()).toHaveLength(5);
      expect(takeWarnings()).toEqual([`[design-system] Rating: max must be a whole number of 1 or more, like 5. Got ${max}.`]);
    });

    it("warns when value isn't one of the stars", () => {
      render(<Rating label="Interest" value={7} />);
      expect(getStars()).toHaveLength(5);
      expect(chosen()).toEqual([]);
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: The value 7 isn't one of the stars. Use a whole number from 1 to 5, or null for none.",
      ]);
    });

    it("warns when value is between two stars", () => {
      render(<Rating label="Interest" value={2.5} />);
      expect(getStars()).toHaveLength(5);
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: The value 2.5 isn't one of the stars. Use a whole number from 1 to 5, or null for none.",
      ]);
    });

    it("warns when defaultValue isn't one of the stars", () => {
      render(<Rating label="Interest" defaultValue={0} max={3} />);
      expect(getStars()).toHaveLength(3);
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: The defaultValue 0 isn't one of the stars. Use a whole number from 1 to 3, or leave it out for none.",
      ]);
    });

    it("warns when a smaller max leaves the chosen value without a star, and keeps the value", () => {
      const { rerender } = render(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={5} />
        </form>,
      );
      expect(takeWarnings()).toEqual([]);
      rerender(
        <form data-testid="form">
          <Rating label="Interest" name="interest" defaultValue={5} max={4} />
        </form>,
      );
      expect(getStars()).toHaveLength(4);
      expect(chosen()).toEqual([]);
      expect(getClear()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: The value 5 isn't one of the stars. Use a whole number from 1 to 4, or clear it.",
      ]);
    });

    it("uses five stars in the message when max is wrong too", () => {
      render(<Rating label="Interest" max={0} value={9} />);
      expect(takeWarnings()).toEqual([
        "[design-system] Rating: max must be a whole number of 1 or more, like 5. Got 0.",
        "[design-system] Rating: The value 9 isn't one of the stars. Use a whole number from 1 to 5, or null for none.",
      ]);
    });

    it("stays quiet for null and for every star's number", () => {
      const { rerender } = render(<Rating label="Interest" value={null} />);
      for (const value of [1, 2, 3, 4, 5]) rerender(<Rating label="Interest" value={value} />);
      expect(chosen()).toEqual([5]);
      expect(takeWarnings()).toEqual([]);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<RatingProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<RatingProps>();
      expectTypeOf<object>().not.toExtend<RatingProps>();
      expectTypeOf<{ description: string }>().not.toExtend<RatingProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<RatingProps>();
      expectTypeOf<{ label: null }>().not.toExtend<RatingProps>();
      expectTypeOf<{ label: false }>().not.toExtend<RatingProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<RatingProps>();
    });

    it("keeps Base UI's render, inputRef, and children out of the public props, and takes className as a string", () => {
      expectTypeOf<RatingProps>().not.toHaveProperty("render");
      expectTypeOf<RatingProps>().not.toHaveProperty("inputRef");
      expectTypeOf<RatingProps>().not.toHaveProperty("children");
      expectTypeOf<RatingProps["className"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes a number value, with null for none, and reports null when cleared", () => {
      expectTypeOf<RatingProps["value"]>().toEqualTypeOf<number | null | undefined>();
      expectTypeOf<RatingProps["defaultValue"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<RatingProps["max"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<NonNullable<RatingProps["onValueChange"]>>().parameter(0).toEqualTypeOf<number | null>();
    });

    it("has no size", () => {
      expectTypeOf<RatingProps>().not.toHaveProperty("size");
    });

    it("takes required, name, and form", () => {
      expectTypeOf<RatingProps["required"]>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<RatingProps["name"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<RatingProps["form"]>().toEqualTypeOf<string | undefined>();
    });

    it("takes gold, brand, or any CSS color as its color", () => {
      expectTypeOf<RatingProps["color"]>().toEqualTypeOf<"gold" | "brand" | (string & {}) | undefined>();
      expectTypeOf<{ label: string; color: "gold" }>().toExtend<RatingProps>();
      expectTypeOf<{ label: string; color: "hsl(210 80% 46%)" }>().toExtend<RatingProps>();
      expectTypeOf<{ label: string; color: 3 }>().not.toExtend<RatingProps>();
    });
  });
});
