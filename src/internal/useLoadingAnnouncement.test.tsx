import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANNOUNCE_AFTER, useLoadingAnnouncement } from "@/internal/useLoadingAnnouncement";

/** Shows the hook's result as attributes, so the tests can read it */
function Probe({ delay }: { delay: number }) {
  const { wait, phase } = useLoadingAnnouncement(delay);
  return <span data-testid="probe" data-wait={wait} data-phase={phase} />;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useLoadingAnnouncement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 100ms by default", () => {
    expect(ANNOUNCE_AFTER).toBe(100);
  });

  it('is "server" in server HTML, before JavaScript runs', () => {
    expect(renderToString(<Probe delay={0} />)).toContain('data-phase="server"');
  });

  it('moves to "waiting" once it runs, then "announced" after ANNOUNCE_AFTER', () => {
    const { getByTestId } = render(<Probe delay={0} />);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "waiting");
    advance(ANNOUNCE_AFTER - 1);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "waiting");
    advance(1);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "announced");
  });

  it("waits for a delay longer than ANNOUNCE_AFTER", () => {
    const { getByTestId } = render(<Probe delay={400} />);
    advance(399);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "waiting");
    advance(1);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "announced");
  });

  it("reads the delay once, and counts a negative one as none", () => {
    const { getByTestId, rerender } = render(<Probe delay={-50} />);
    expect(getByTestId("probe")).toHaveAttribute("data-wait", "0");
    rerender(<Probe delay={1000} />);
    expect(getByTestId("probe")).toHaveAttribute("data-wait", "0");
    advance(ANNOUNCE_AFTER);
    expect(getByTestId("probe")).toHaveAttribute("data-phase", "announced");
  });

  it("clears its timer when the indicator goes away", () => {
    const { unmount } = render(<Probe delay={0} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
