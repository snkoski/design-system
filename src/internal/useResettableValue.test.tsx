import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useResettableValue } from "@/internal/useResettableValue";

/** Three plain radios driven by the hook, with what it shows written out for the test to read */
function Probe({ value, defaultValue, form, pick }: { value?: string | null; defaultValue?: string; form?: string; pick?: string }) {
  const groupRef = useRef<HTMLDivElement | null>(null);
  const { shown, setOwnValue, controlled } = useResettableValue({ value, defaultValue, groupRef, form });
  return (
    <div ref={groupRef}>
      {["a", "b", "c"].map((option) => (
        <input key={option} type="radio" name="x" value={option} form={form} checked={shown === option} readOnly />
      ))}
      <output>{`${controlled ? "controlled" : "uncontrolled"} ${shown ?? "none"}`}</output>
      <button type="button" onClick={() => setOwnValue(pick ?? null)}>
        Pick
      </button>
    </div>
  );
}

const shownText = () => screen.getByRole("status").textContent;
const sent = (form: HTMLFormElement) => new FormData(form).get("x");
const reset = async (form: HTMLFormElement) => {
  await act(async () => {
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

describe("useResettableValue", () => {
  it("starts from defaultValue when uncontrolled, and from value when controlled", () => {
    const { rerender } = render(<Probe defaultValue="b" />);
    expect(shownText()).toBe("uncontrolled b");
    rerender(<Probe value="c" key="controlled" />);
    expect(shownText()).toBe("controlled c");
  });

  it("shows nothing for null and for no defaultValue", () => {
    const { rerender } = render(<Probe />);
    expect(shownText()).toBe("uncontrolled none");
    rerender(<Probe value={null} key="controlled" />);
    expect(shownText()).toBe("controlled none");
  });

  it("puts an uncontrolled value and the radios back to defaultValue after a form reset", async () => {
    render(
      <form data-testid="form">
        <Probe defaultValue="a" pick="c" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    act(() => screen.getByRole("button", { name: "Pick" }).click());
    expect(sent(form)).toBe("c");
    await reset(form);
    expect(shownText()).toBe("uncontrolled a");
    expect(sent(form)).toBe("a");
  });

  it("keeps a controlled value after a form reset, and sets the radios to match it", async () => {
    const { rerender } = render(
      <form data-testid="form">
        <Probe value="a" />
      </form>,
    );
    rerender(
      <form data-testid="form">
        <Probe value="b" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(sent(form)).toBe("b");
    await reset(form);
    expect(shownText()).toBe("controlled b");
    expect(sent(form)).toBe("b");
  });

  it("listens to the form named by form when the radios sit outside it", async () => {
    render(
      <>
        <form id="outside" data-testid="form" />
        <Probe defaultValue="a" pick="b" form="outside" />
      </>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    act(() => screen.getByRole("button", { name: "Pick" }).click());
    expect(sent(form)).toBe("b");
    await reset(form);
    expect(shownText()).toBe("uncontrolled a");
    expect(sent(form)).toBe("a");
  });

  it("does nothing outside a form", () => {
    render(<Probe defaultValue="a" />);
    expect(shownText()).toBe("uncontrolled a");
  });
});
