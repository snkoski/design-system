import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomCursor } from "./CustomCursor";

// jsdom has no canvas: stand one in that records what's drawn. And say image-set isn't supported, unless a
// test says it is, so the expected cursor values don't depend on jsdom's version.
const fillText = vi.fn();
const supports = vi.fn(() => false);
beforeEach(() => {
  vi.stubGlobal("CSS", { supports });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    scale: vi.fn(),
    fillText,
    set textAlign(_: string) {},
    set textBaseline(_: string) {},
    set fillStyle(_: string) {},
    set font(_: string) {},
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(function (this: HTMLCanvasElement) {
    return `data:image/png;base64,${this.width}`;
  });
});
afterEach(() => {
  fillText.mockClear();
  supports.mockReset().mockReturnValue(false);
  vi.unstubAllGlobals();
});

const cursorOf = (element: Element) => (element as HTMLElement).style.getPropertyValue("--custom-cursor");

describe("CustomCursor", () => {
  it("makes an emoji into a cursor image, centered on the hotspot", () => {
    render(<CustomCursor cursor="🌭" data-testid="area" />);
    expect(fillText).toHaveBeenCalledWith("🌭", 16, expect.any(Number));
    expect(cursorOf(screen.getByTestId("area"))).toBe('url("data:image/png;base64,32") 16 16, auto');
  });

  it("draws a second image at twice the size, for sharp cursors on high-density screens", () => {
    supports.mockReturnValue(true);
    render(<CustomCursor cursor="🌭" data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toBe(
      'image-set(url("data:image/png;base64,32") 1x, url("data:image/png;base64,64") 2x) 16 16, auto',
    );
  });

  it("makes an SVG icon into a cursor image, sized and colored", () => {
    render(
      <CustomCursor cursor={<svg viewBox="0 0 24 24"><path d="M0 0h24v24z" fill="currentColor" /></svg>} color="hsl(0 0% 0%)" size={40} data-testid="area" />,
    );
    const value = cursorOf(screen.getByTestId("area"));
    expect(value).toMatch(/^url\("data:image\/svg\+xml;charset=utf-8,/);
    const svg = decodeURIComponent(value.slice(value.indexOf(",") + 1, value.indexOf('")')));
    expect(svg).toContain('width="40"');
    expect(svg).toContain('color="hsl(0 0% 0%)"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(value).toMatch(/ 20 20, auto$/);
  });

  it("renders the icon only to copy it, hidden from screen readers", () => {
    const { container } = render(<CustomCursor cursor={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon").closest(".custom-cursor__icon")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".custom-cursor__icon")).toBeInTheDocument();
  });

  it("uses an image address as it is, without drawing", () => {
    render(<CustomCursor cursor="https://example.com/cursor.png" data-testid="area" />);
    expect(fillText).not.toHaveBeenCalled();
    expect(cursorOf(screen.getByTestId("area"))).toBe('url("https://example.com/cursor.png") 16 16, auto');
  });

  it("puts the hotspot at the top-left corner, or at exact pixels inside the image", () => {
    const { rerender } = render(<CustomCursor cursor="👉" hotspot="top-left" data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toMatch(/ 0 0, auto$/);
    rerender(<CustomCursor cursor="👉" hotspot={{ x: 4, y: 2 }} data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toMatch(/ 4 2, auto$/);
    rerender(<CustomCursor cursor="👉" hotspot={{ x: 500, y: -3 }} data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toMatch(/ 31 0, auto$/);
  });

  it("keeps the size within what browsers allow", () => {
    render(<CustomCursor cursor="🌭" size={400} data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toBe('url("data:image/png;base64,128") 64 64, auto');
  });

  it("keeps controls' own cursors by default, and can replace them", () => {
    const { rerender } = render(<CustomCursor cursor="🌭" data-testid="area" />);
    expect(screen.getByTestId("area")).toHaveAttribute("data-custom-cursor", "keep");
    rerender(<CustomCursor cursor="🌭" overControls="replace" data-testid="area" />);
    expect(screen.getByTestId("area")).toHaveAttribute("data-custom-cursor", "replace");
  });

  it("leaves the normal cursor alone with no cursor chosen", () => {
    render(<CustomCursor data-testid="area" className="p-4" />);
    const area = screen.getByTestId("area");
    expect(area).toHaveClass("custom-cursor", "p-4");
    expect(area).not.toHaveAttribute("data-custom-cursor");
    expect(cursorOf(area)).toBe("");
  });

  it("puts the cursor on the whole page with scope page, and takes it off when it goes", () => {
    const html = document.documentElement;
    const { unmount } = render(<CustomCursor cursor="👀" scope="page" overControls="replace" data-testid="area" />);
    expect(cursorOf(html)).toMatch(/^url\("data:image\/png/);
    expect(html).toHaveAttribute("data-custom-cursor", "replace");
    expect(screen.getByTestId("area")).not.toHaveAttribute("data-custom-cursor");
    unmount();
    expect(cursorOf(html)).toBe("");
    expect(html).not.toHaveAttribute("data-custom-cursor");
  });

  describe("more than one page cursor", () => {
    const html = document.documentElement;
    const kinds = () => html.getAttribute("data-custom-cursor");

    it("shows the one set most recently, and brings the earlier one back when it goes", () => {
      const first = render(<CustomCursor cursor="🌭" scope="page" />);
      const firstValue = cursorOf(html);
      const second = render(<CustomCursor cursor="👀" scope="page" overControls="replace" size={40} />);
      expect(cursorOf(html)).not.toBe(firstValue);
      expect(kinds()).toBe("replace");
      second.unmount();
      expect(cursorOf(html)).toBe(firstValue);
      expect(kinds()).toBe("keep");
      first.unmount();
      expect(cursorOf(html)).toBe("");
      expect(kinds()).toBeNull();
    });

    it("lets a cursor take over again when its choice changes", () => {
      const first = render(<CustomCursor cursor="🌭" scope="page" size={32} />);
      render(<CustomCursor cursor="👀" scope="page" size={40} />);
      expect(cursorOf(html)).toMatch(/ 20 20, auto$/);
      // The stand-in canvas's image depends only on its size, so change the size too, to make a different image
      first.rerender(<CustomCursor cursor="🦄" scope="page" size={36} />);
      expect(fillText).toHaveBeenLastCalledWith("🦄", 18, expect.any(Number));
      expect(cursorOf(html)).toMatch(/ 18 18, auto$/);
    });

    it("keeps the other one when one goes back to the normal cursor", () => {
      render(<CustomCursor cursor="🌭" scope="page" size={32} />);
      const second = render(<CustomCursor cursor="👀" scope="page" size={40} />);
      second.rerender(<CustomCursor scope="page" size={40} />);
      expect(cursorOf(html)).toMatch(/ 16 16, auto$/);
    });
  });

  it("reports the cursor it made, and null when it goes back to normal", () => {
    const onCursorChange = vi.fn();
    const { rerender } = render(<CustomCursor cursor="🌭" onCursorChange={onCursorChange} />);
    expect(onCursorChange).toHaveBeenLastCalledWith('url("data:image/png;base64,32") 16 16, auto');
    rerender(<CustomCursor onCursorChange={onCursorChange} />);
    expect(onCursorChange).toHaveBeenLastCalledWith(null);
  });

  it("changes the cursor when the choice changes", () => {
    const { rerender } = render(<CustomCursor cursor="🌭" data-testid="area" />);
    rerender(<CustomCursor cursor="🦄" data-testid="area" />);
    expect(fillText).toHaveBeenLastCalledWith("🦄", 16, expect.any(Number));
    rerender(<CustomCursor data-testid="area" />);
    expect(cursorOf(screen.getByTestId("area"))).toBe("");
  });
});
