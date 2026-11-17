import { render, screen } from "@testing-library/react";
import { createRef, useRef } from "react";
import type { Ref } from "react";
import { describe, expect, it, vi } from "vitest";
import { useMergedRef } from "@/internal/useMergedRef";

/** An input whose own ref and the given ref are merged, with its own ref's element shown for the test to read. */
function Probe({ inputRef, onOwn }: { inputRef?: Ref<HTMLInputElement>; onOwn?: (own: { current: HTMLInputElement | null }) => void }) {
  const own = useRef<HTMLInputElement | null>(null);
  onOwn?.(own);
  return <input aria-label="Probe" ref={useMergedRef(own, inputRef)} />;
}

const input = () => screen.getByRole("textbox", { name: "Probe" });

describe("useMergedRef", () => {
  it("fills the component's own ref and an object ref with the element, and empties both when it goes", () => {
    const ref = createRef<HTMLInputElement>();
    let own: { current: HTMLInputElement | null } = { current: null };
    const { unmount } = render(<Probe inputRef={ref} onOwn={(r) => (own = r)} />);
    expect(own.current).toBe(input());
    expect(ref.current).toBe(input());
    unmount();
    expect(own.current).toBeNull();
    expect(ref.current).toBeNull();
  });

  it("runs a callback ref's cleanup when the element goes, and never calls it with null", () => {
    const calls: (HTMLInputElement | null)[] = [];
    const cleanup = vi.fn();
    const { unmount } = render(
      <Probe
        inputRef={(element) => {
          calls.push(element);
          return cleanup;
        }}
      />,
    );
    expect(calls).toEqual([input()]);
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(1);
  });

  it("calls a callback ref with no cleanup with the element, then null when it goes", () => {
    const calls: (HTMLInputElement | null)[] = [];
    const { unmount } = render(<Probe inputRef={(element) => void calls.push(element)} />);
    expect(calls).toEqual([input()]);
    unmount();
    expect(calls).toEqual([expect.any(HTMLInputElement), null]);
  });

  it("cleans up the old ref and fills the new one when the ref changes, keeping its own ref filled", () => {
    const first = vi.fn();
    const second = createRef<HTMLInputElement>();
    let own: { current: HTMLInputElement | null } = { current: null };
    const { rerender } = render(<Probe inputRef={() => first} onOwn={(r) => (own = r)} />);
    rerender(<Probe inputRef={second} onOwn={(r) => (own = r)} />);
    expect(first).toHaveBeenCalledOnce();
    expect(second.current).toBe(input());
    expect(own.current).toBe(input());
  });

  it("fills only its own ref when there's no ref", () => {
    let own: { current: HTMLInputElement | null } = { current: null };
    render(<Probe onOwn={(r) => (own = r)} />);
    expect(own.current).toBe(input());
  });
});
