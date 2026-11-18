import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { RatingSlider } from "@/components/RatingSlider/RatingSlider";
import type { RatingSliderProps } from "@/components/RatingSlider/RatingSlider";

const getSlider = () => screen.getByRole("slider");
const getGroup = () => screen.getByRole("group");
/** How much of each star is filled, from the --rating-slider-fill each one is drawn with */
const fills = (container: HTMLElement) => {
  const stars = [...container.querySelectorAll<HTMLElement>(".rating-slider__star")];
  expect(stars.length).toBeGreaterThan(0);
  return stars.map((star) => Number(star.style.getPropertyValue("--rating-slider-fill")));
};
const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const sent = (form: HTMLFormElement = getForm()) => new FormData(form).getAll("interest");
/** Server-rendered HTML, before any JavaScript runs, attached to the page until the test ends */
function serverHtml(element: ReactElement) {
  const host = document.createElement("div");
  host.innerHTML = renderToString(element);
  document.body.append(host);
  onTestFinished(() => host.remove());
  return host;
}
/** Waits for the reset's timer, which runs after the browser has reset the fields */
const reset = async (form: HTMLFormElement = getForm()) => {
  await act(async () => {
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

describe("RatingSlider", () => {
  describe("rendering", () => {
    it("renders one slider named by its label, inside a group named by the same label", () => {
      render(<RatingSlider label="Interest" />);
      expect(screen.getByRole("slider", { name: "Interest" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Interest" })).toContainElement(getSlider());
    });

    it("is a range input from 0 to max, moving in half stars by default", () => {
      render(<RatingSlider label="Interest" />);
      expect(getSlider()).toHaveAttribute("type", "range");
      expect(getSlider()).toHaveAttribute("min", "0");
      expect(getSlider()).toHaveAttribute("max", "5");
      expect(getSlider()).toHaveAttribute("step", "0.5");
    });

    it("draws max stars, hidden from screen readers", () => {
      const { container, rerender } = render(<RatingSlider label="Interest" />);
      expect(fills(container)).toHaveLength(5);
      rerender(<RatingSlider label="Interest" max={8} />);
      expect(fills(container)).toHaveLength(8);
      const stars = container.querySelector(".rating-slider__stars");
      expect(stars).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelector(".rating-slider__zero")).toHaveAttribute("aria-hidden", "true");
    });

    it("fills each star by how much of it the rating covers", () => {
      const { container, rerender } = render(<RatingSlider label="Interest" defaultValue={3.5} />);
      expect(fills(container)).toEqual([1, 1, 1, 0.5, 0]);
      rerender(<RatingSlider label="Interest" value={1.75} step={0.25} />);
      expect(fills(container)).toEqual([1, 0.75, 0, 0, 0]);
    });

    it("draws nothing filled with no rating", () => {
      const { container } = render(<RatingSlider label="Interest" />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      expect(getSlider()).toHaveAttribute("aria-valuenow", "0");
    });

    it("shows the rating in words beside the stars, hidden from screen readers", () => {
      const { container, rerender } = render(<RatingSlider label="Interest" defaultValue={3.5} />);
      const words = container.querySelector(".rating-slider__value");
      expect(container.querySelector(".rating-slider__value-text")).toHaveTextContent("3.5 of 5");
      expect(words).toHaveAttribute("aria-hidden", "true");
      rerender(<RatingSlider label="Interest" value={0} />);
      expect(container.querySelector(".rating-slider__value-text")).toHaveTextContent("No rating");
    });

    it("leaves the words out with showValue={false}", () => {
      const { container } = render(<RatingSlider label="Interest" defaultValue={2} showValue={false} />);
      expect(getSlider()).toBeInTheDocument();
      expect(container.querySelector(".rating-slider__value")).toBeNull();
    });

    it("puts the shared group classes next to its own", () => {
      const { container } = render(<RatingSlider label="Interest" description="How much you want this job." />);
      expect(container.firstElementChild).toHaveClass("choice-group", "rating-slider");
      expect(getGroup()).toHaveClass("choice-group__group", "rating-slider__root");
      expect(screen.getByText("Interest")).toHaveClass("field-label", "rating-slider__label");
      expect(screen.getByText("How much you want this job.")).toHaveClass("field-description", "rating-slider__description");
    });

    it("gives the wrapper its step and max for the CSS", () => {
      const { container } = render(<RatingSlider label="Interest" max={7} step={0.25} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.getPropertyValue("--rating-slider-step")).toBe("0.25");
      expect(wrapper.style.getPropertyValue("--rating-slider-max")).toBe("7");
    });

    it("draws the stars left to right in a right-to-left page", () => {
      const { container } = render(
        <div dir="rtl">
          <RatingSlider label="Interest" />
        </div>,
      );
      expect(container.querySelector(".rating-slider__frame")).toHaveAttribute("dir", "ltr");
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<RatingSlider aria-label="Interest" />);
      expect(screen.getByRole("slider", { name: "Interest" })).toBeInTheDocument();
      expect(container.querySelector(".rating-slider__label")).toBeNull();
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<RatingSlider label="Interest" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("rating-slider", "mt-4");
    });

    it("passes other props through to the group", () => {
      render(<RatingSlider label="Interest" data-testid="interest" />);
      expect(screen.getByTestId("interest")).toBe(getGroup());
    });

    it("never uses modifier classes", () => {
      const { container } = render(
        <RatingSlider label="Interest" invalid disabled readOnly description="More" error="Choose a rating." defaultValue={2} />,
      );
      expect(container.querySelector(".rating-slider__control")).toBeInTheDocument();
      expect(container.innerHTML).not.toMatch(/rating-slider--|rating-slider__[a-z]+--/);
    });
  });

  describe("what screen readers hear", () => {
    it.each([
      [0, "No rating"],
      [1, "1 star"],
      [3.5, "3.5 stars"],
      [5, "5 stars"],
    ])("says %s as %s", (value, words) => {
      render(<RatingSlider label="Interest" value={value} />);
      expect(getSlider()).toHaveAttribute("aria-valuetext", words);
    });
  });

  describe("keyboard", () => {
    it("is one Tab stop", async () => {
      const user = userEvent.setup();
      render(
        <>
          <RatingSlider label="Interest" defaultValue={2} />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(getSlider()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves one step with the arrow keys", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{ArrowRight}{ArrowUp}{ArrowLeft}{ArrowDown}{ArrowDown}");
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([2.5, 3, 2.5, 2, 1.5]);
      expect(getSlider()).toHaveAttribute("aria-valuenow", "1.5");
    });

    it("moves a whole star with Page Up and Page Down, and with Shift and an arrow", async () => {
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={2} />);
      await user.tab();
      await user.keyboard("{PageUp}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "3");
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "4");
      await user.keyboard("{PageDown}{PageDown}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2");
    });

    it("goes to no rating with Home and full with End, reporting null for none", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{End}");
      expect(getSlider()).toHaveAttribute("aria-valuetext", "5 stars");
      await user.keyboard("{Home}");
      expect(getSlider()).toHaveAttribute("aria-valuetext", "No rating");
      expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([5, null]);
    });

    it("stops at both ends rather than wrapping", async () => {
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={5} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "5");
      await user.keyboard("{Home}{ArrowLeft}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "0");
    });

    it("moves by whole stars with step 1, and by quarters with step 0.25", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RatingSlider label="Interest" step={1} defaultValue={2} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "3");
      rerender(<RatingSlider label="Interest" step={0.25} defaultValue={2} key="quarters" />);
      getSlider().focus();
      await user.keyboard("{ArrowRight}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2.25");
    });

    it("does nothing with Space or Enter", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard(" {Enter}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2");
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("changes", () => {
    it("reports a finished change once with onValueCommitted", async () => {
      const onValueCommitted = vi.fn();
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" defaultValue={2} onValueCommitted={onValueCommitted} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(onValueCommitted).toHaveBeenCalledWith(2.5, expect.anything());
      await user.keyboard("{Home}");
      expect(onValueCommitted).toHaveBeenLastCalledWith(null, expect.anything());
    });

    it("passes Base UI's change details, and keeps the rating when the page cancels", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn((_value: number | null, details: { cancel: () => void }) => details.cancel());
      render(<RatingSlider label="Interest" defaultValue={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(onValueChange).toHaveBeenCalledWith(2.5, expect.objectContaining({ cancel: expect.any(Function) }));
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2");
    });

    it("follows the value prop when controlled, and doesn't change by itself", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<RatingSlider label="Interest" value={2} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(onValueChange).toHaveBeenCalledWith(2.5, expect.anything());
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2");
      rerender(<RatingSlider label="Interest" value={4} onValueChange={onValueChange} />);
      expect(getSlider()).toHaveAttribute("aria-valuenow", "4");
    });

    it("shows no rating when controlled with null", () => {
      render(<RatingSlider label="Interest" value={null} />);
      expect(getSlider()).toHaveAttribute("aria-valuetext", "No rating");
    });

    it("works as a controlled slider driven by state", async () => {
      function Controlled() {
        const [value, setValue] = useState<number | null>(1);
        return (
          <>
            <RatingSlider label="Interest" value={value} onValueChange={setValue} />
            <output>{value ?? "none"}</output>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("status")).toHaveTextContent("1.5");
      await user.keyboard("{Home}");
      expect(screen.getByRole("status")).toHaveTextContent("none");
    });

    it("snaps a value between steps to the nearest one, everywhere it's used", () => {
      const { container } = render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" value={2.3} />
        </form>,
      );
      takeWarnings();
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2.5");
      expect(getSlider()).toHaveAttribute("aria-valuetext", "2.5 stars");
      expect(fills(container)).toEqual([1, 1, 0.5, 0, 0]);
      expect(sent()).toEqual(["2.5"]);
    });

    it("snaps a value past the last star to the last star", () => {
      render(<RatingSlider label="Interest" value={7} />);
      takeWarnings();
      expect(getSlider()).toHaveAttribute("aria-valuenow", "5");
    });
  });

  describe("in a form", () => {
    it("submits the rating under its name", () => {
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" defaultValue={3.5} />
        </form>,
      );
      expect(sent()).toEqual(["3.5"]);
    });

    it("submits 0 for no rating", () => {
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" />
        </form>,
      );
      expect(getSlider()).toBeInTheDocument();
      expect(sent()).toEqual(["0"]);
    });

    it("submits the rating the user chooses", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" defaultValue={1} />
        </form>,
      );
      await user.tab();
      await user.keyboard("{End}");
      expect(sent()).toEqual(["5"]);
    });

    it("submits with a form it sits outside of, through form", () => {
      render(
        <>
          <form id="job" data-testid="outside-form" />
          <RatingSlider label="Interest" name="interest" form="job" defaultValue={2} />
        </>,
      );
      expect(sent(screen.getByTestId("outside-form") as HTMLFormElement)).toEqual(["2"]);
    });
  });

  describe("form reset", () => {
    it("goes back to defaultValue, in the slider and in what the form submits, without reporting a change", async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" defaultValue={2} onValueChange={onValueChange} />
        </form>,
      );
      await user.tab();
      await user.keyboard("{End}");
      onValueChange.mockClear();
      await reset();
      await waitFor(() => expect(getSlider()).toHaveAttribute("aria-valuenow", "2"));
      expect(sent()).toEqual(["2"]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("leaves a controlled value alone, with the form submitting what's shown", async () => {
      const onValueChange = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<number | null>(2);
        return (
          <form data-testid="form">
            <RatingSlider
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
      await user.tab();
      await user.keyboard("{End}");
      onValueChange.mockClear();
      await reset();
      expect(getSlider()).toHaveAttribute("aria-valuenow", "5");
      expect(sent()).toEqual(["5"]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("resets with a form it sits outside of, through form", async () => {
      const user = userEvent.setup();
      render(
        <>
          <form id="job" data-testid="outside-form" />
          <RatingSlider label="Interest" name="interest" form="job" defaultValue={2} />
        </>,
      );
      const form = screen.getByTestId("outside-form") as HTMLFormElement;
      await user.tab();
      await user.keyboard("{End}");
      expect(sent(form)).toEqual(["5"]);
      await reset(form);
      await waitFor(() => expect(getSlider()).toHaveAttribute("aria-valuenow", "2"));
      expect(sent(form)).toEqual(["2"]);
    });
  });

  describe("description and error", () => {
    it("links the description to the slider", () => {
      render(<RatingSlider label="Interest" description="How much you want this job." />);
      expect(getSlider()).toHaveAccessibleDescription("How much you want this job.");
    });

    it("shows the error before the stars, linked to the slider, when invalid", () => {
      const { container } = render(<RatingSlider label="Interest" invalid error="Choose how interested you are." />);
      const error = screen.getByText("Choose how interested you are.");
      expect(getSlider()).toHaveAccessibleDescription("Error: Choose how interested you are.");
      expect(error.compareDocumentPosition(container.querySelector(".rating-slider__control")!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(error.closest(".rating-slider__error")?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("reads the description and the error together", () => {
      render(<RatingSlider label="Interest" invalid description="How much you want this job." error="Choose how interested you are." />);
      expect(getSlider()).toHaveAccessibleDescription("How much you want this job. Error: Choose how interested you are.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="hint">You can change it later.</p>
          <RatingSlider label="Interest" description="How much you want this job." invalid error="Choose how interested you are." aria-describedby="hint" />
        </>,
      );
      expect(getSlider()).toHaveAccessibleDescription(expect.stringContaining("You can change it later."));
      expect(getSlider()).toHaveAccessibleDescription(expect.stringContaining("How much you want this job."));
      expect(getSlider()).toHaveAccessibleDescription(expect.stringContaining("Choose how interested you are."));
    });

    it("hides the error when the slider is valid", () => {
      render(<RatingSlider label="Interest" error="Choose how interested you are." />);
      expect(getSlider()).toBeInTheDocument();
      expect(screen.queryByText("Choose how interested you are.")).not.toBeInTheDocument();
    });

    it("marks the slider invalid when invalid, and not otherwise", () => {
      const { rerender } = render(<RatingSlider label="Interest" invalid />);
      expect(getSlider()).toHaveAttribute("aria-invalid", "true");
      rerender(<RatingSlider label="Interest" />);
      expect(getSlider()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("disabled", () => {
    it("disables the input and marks the wrapper", () => {
      const { container } = render(<RatingSlider label="Interest" disabled />);
      expect(getSlider()).toBeDisabled();
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
    });

    it("can't be reached with Tab, and isn't submitted", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" disabled defaultValue={3} />
          <button type="button">After</button>
        </form>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      expect(getSlider()).toBeInTheDocument();
      expect(sent()).toEqual([]);
    });
  });

  describe("read only", () => {
    it("marks the input read-only, and says \"Read only\" beside the label, hidden from screen readers", () => {
      render(<RatingSlider label="Interest" readOnly />);
      expect(getSlider()).toHaveAttribute("aria-readonly", "true");
      const note = screen.getByText("Read only");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(getSlider()).toHaveAccessibleName("Interest");
    });

    it("drops aria-readonly when read-only turns off", () => {
      const { rerender } = render(<RatingSlider label="Interest" readOnly />);
      expect(getSlider()).toHaveAttribute("aria-readonly", "true");
      rerender(<RatingSlider label="Interest" />);
      expect(getSlider()).not.toHaveAttribute("aria-readonly");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("has no note when it's disabled as well", () => {
      render(<RatingSlider label="Interest" readOnly disabled />);
      expect(getSlider()).toBeDisabled();
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("stays focusable, but the keys change nothing and nothing is reported", async () => {
      const onValueChange = vi.fn();
      const onValueCommitted = vi.fn();
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" readOnly defaultValue={2} onValueChange={onValueChange} onValueCommitted={onValueCommitted} />);
      await user.tab();
      expect(getSlider()).toHaveFocus();
      await user.keyboard("{ArrowRight}{End}{Home}{PageUp}");
      expect(getSlider()).toHaveAttribute("aria-valuenow", "2");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onValueCommitted).not.toHaveBeenCalled();
    });

    it("is still submitted", () => {
      render(
        <form data-testid="form">
          <RatingSlider label="Interest" name="interest" readOnly defaultValue={4} />
        </form>,
      );
      expect(sent()).toEqual(["4"]);
    });
  });

  describe("id, label, and ref", () => {
    it("puts id on the range input, which the label still names", () => {
      render(<RatingSlider label="Interest" id="interest" />);
      expect(document.getElementById("interest")).toBe(getSlider());
      expect(getSlider()).toHaveAccessibleName("Interest");
    });

    it.each([
      ["without an id", undefined],
      ["with an id", "interest"],
    ])("focuses the slider when the label is clicked, %s", async (_case, id) => {
      const user = userEvent.setup();
      render(<RatingSlider label="Interest" id={id} />);
      expect(getSlider()).not.toHaveFocus();
      await user.click(screen.getByText("Interest"));
      expect(getSlider()).toHaveFocus();
    });

    it("forwards ref to the range input", () => {
      const ref = createRef<HTMLInputElement>();
      render(<RatingSlider label="Interest" ref={ref} />);
      expect(ref.current).toBe(getSlider());
    });
  });

  describe("server rendering", () => {
    // Base UI passes only a few props to the slider's input, so the page's id and aria-readonly are set on it once
    // JavaScript runs (docs/revisit.md, "A RatingSlider's id and read-only state arrive with JavaScript")
    it("renders the slider and its value in the server HTML, before JavaScript runs", () => {
      const host = serverHtml(<RatingSlider label="Interest" name="interest" defaultValue={3.5} id="interest" readOnly />);
      const input = host.querySelector<HTMLInputElement>('input[type="range"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-valuetext", "3.5 stars");
      expect(input).toHaveAttribute("name", "interest");
      expect(input).not.toHaveAttribute("aria-readonly");
      expect(host.querySelector("#interest")).toBeNull();
    });

    it("hydrates the server HTML without a mismatch, then puts the id and aria-readonly on the input", () => {
      const element = <RatingSlider label="Interest" name="interest" defaultValue={3.5} id="interest" readOnly />;
      const host = serverHtml(element);
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      act(() => {
        root = hydrateRoot(host, element);
      });
      onTestFinished(() => act(() => root?.unmount()));
      expect(errors).not.toHaveBeenCalled();
      const input = host.querySelector('input[type="range"]');
      expect(host.querySelector("#interest")).toBe(input);
      expect(input).toHaveAttribute("aria-readonly", "true");
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no aria-label", () => {
      render(<RatingSlider label="" />);
      expect(getSlider()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RatingSlider: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });

    it.each([3.5, 0, -2, Number.NaN])("warns about max %s and draws five stars", (max) => {
      const { container } = render(<RatingSlider label="Interest" max={max} />);
      expect(fills(container)).toHaveLength(5);
      expect(takeWarnings()).toEqual([`[design-system] RatingSlider: max must be a whole number of 1 or more, like 5. Got ${max}.`]);
    });

    it("warns when value isn't one of the steps", () => {
      render(<RatingSlider label="Interest" value={2.3} />);
      expect(getSlider()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RatingSlider: The value 2.3 isn't one of the steps. Use a multiple of 0.5 from 0 to 5, or null for none.",
      ]);
    });

    it("says a whole number in the message when the step is 1", () => {
      render(<RatingSlider label="Interest" step={1} value={7} />);
      expect(getSlider()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RatingSlider: The value 7 isn't one of the steps. Use a whole number from 0 to 5, or null for none.",
      ]);
    });

    it("warns when defaultValue isn't one of the steps", () => {
      render(<RatingSlider label="Interest" step={0.25} defaultValue={1.1} />);
      expect(getSlider()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RatingSlider: The defaultValue 1.1 isn't one of the steps. Use a multiple of 0.25 from 0 to 5, or leave it out for none.",
      ]);
    });

    it("warns when a smaller max leaves the rating off the stars", () => {
      const { rerender } = render(<RatingSlider label="Interest" defaultValue={5} />);
      expect(takeWarnings()).toEqual([]);
      rerender(<RatingSlider label="Interest" defaultValue={5} max={4} />);
      expect(getSlider()).toHaveAttribute("aria-valuenow", "4");
      expect(takeWarnings()).toEqual([
        "[design-system] RatingSlider: The value 5 isn't one of the steps. Use a multiple of 0.5 from 0 to 4, or clear it.",
      ]);
    });

    it("stays quiet for null, 0, and every step", () => {
      const { rerender } = render(<RatingSlider label="Interest" value={null} />);
      for (const value of [0, 0.5, 1, 2.5, 5]) rerender(<RatingSlider label="Interest" value={value} />);
      expect(getSlider()).toHaveAttribute("aria-valuenow", "5");
      expect(takeWarnings()).toEqual([]);
    });
  });

  describe("types", () => {
    it("requires a visible label or an aria-label", () => {
      expectTypeOf<{ label: string }>().toExtend<RatingSliderProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<RatingSliderProps>();
      expectTypeOf<object>().not.toExtend<RatingSliderProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<RatingSliderProps>();
      expectTypeOf<{ label: null }>().not.toExtend<RatingSliderProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<RatingSliderProps>();
    });

    it("takes only whole, half, or quarter steps", () => {
      expectTypeOf<RatingSliderProps["step"]>().toEqualTypeOf<1 | 0.5 | 0.25 | undefined>();
    });

    it("leaves out what a rating slider doesn't have", () => {
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("required");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("min");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("largeStep");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("format");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("orientation");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("render");
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("children");
      // It would land on the group, not the input, and add a second Tab stop
      expectTypeOf<RatingSliderProps>().not.toHaveProperty("tabIndex");
    });

    it("takes a number value, with null for none, and reports null for none", () => {
      expectTypeOf<RatingSliderProps["value"]>().toEqualTypeOf<number | null | undefined>();
      expectTypeOf<RatingSliderProps["defaultValue"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<NonNullable<RatingSliderProps["onValueChange"]>>().parameter(0).toEqualTypeOf<number | null>();
    });

    it("forwards ref to an input", () => {
      expectTypeOf<RatingSliderProps["ref"]>().toEqualTypeOf<React.Ref<HTMLInputElement> | undefined>();
    });
  });
});
