import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { usePortalScope } from "@/internal/usePortalScope";

/** Renders the hook's result as JSON, so a test can read it. */
function Probe({ open }: { open: boolean }) {
  const anchor = useRef<HTMLDivElement>(null);
  const scope = usePortalScope(anchor, open);
  return (
    <div ref={anchor}>
      <output>{JSON.stringify(scope)}</output>
    </div>
  );
}

const scope = () => JSON.parse(screen.getByRole("status").textContent ?? "null") as Record<string, string>;

describe("usePortalScope", () => {
  it("copies each attribute from the nearest ancestor that has it", () => {
    const { rerender } = render(
      <div data-theme="dark" lang="pl" data-density="compact">
        <div data-theme="hotdog" data-pointer="coarse" dir="rtl" data-motion="reduced">
          <Probe open={false} />
        </div>
      </div>,
    );
    rerender(
      <div data-theme="dark" lang="pl" data-density="compact">
        <div data-theme="hotdog" data-pointer="coarse" dir="rtl" data-motion="reduced">
          <Probe open />
        </div>
      </div>,
    );
    expect(scope()).toEqual({
      "data-theme": "hotdog",
      "data-pointer": "coarse",
      "data-density": "compact",
      "data-motion": "reduced",
      dir: "rtl",
      lang: "pl",
    });
  });

  it("copies nothing when no ancestor sets any of them", () => {
    const page = (open: boolean) => (
      <>
        <div data-theme="dark">
          <Probe open={open} />
        </div>
        <Probe open={open} />
      </>
    );
    const { rerender } = render(page(false));
    rerender(page(true));
    const [inside, outside] = screen.getAllByRole("status").map((el) => JSON.parse(el.textContent ?? "null"));
    // The probe inside a themed section copies its theme, so the empty result outside means "nothing set"
    expect(inside).toEqual({ "data-theme": "dark" });
    expect(outside).toEqual({});
  });

  it("reads the attributes on the render where the popup opens, not a frame later", () => {
    function Recorder() {
      const anchor = useRef<HTMLDivElement>(null);
      const result = usePortalScope(anchor, true);
      seen.push(result["data-theme"]);
      return <div ref={anchor} />;
    }
    const seen: (string | undefined)[] = [];
    // Mounted closed first, so the anchor exists when it opens
    function Host({ open }: { open: boolean }) {
      return <div data-theme="dark">{open ? <Recorder /> : <span />}</div>;
    }
    const { rerender } = render(<Host open={false} />);
    rerender(<Host open />);
    expect(seen.at(-1)).toBe("dark");
  });

  it("follows an attribute changed on an ancestor while open", async () => {
    const { container, rerender } = render(
      <section data-theme="light">
        <Probe open={false} />
      </section>,
    );
    rerender(
      <section data-theme="light">
        <Probe open />
      </section>,
    );
    expect(scope()["data-theme"]).toBe("light");
    await act(async () => {
      container.querySelector("section")!.setAttribute("data-pointer", "coarse");
      container.querySelector("section")!.setAttribute("data-theme", "hotdog");
    });
    expect(scope()).toEqual({ "data-theme": "hotdog", "data-pointer": "coarse" });
  });

  it("ignores changes inside a Base UI portal, such as the popup's own attributes", async () => {
    const portal = document.createElement("div");
    portal.setAttribute("data-base-ui-portal", "");
    document.body.append(portal);
    try {
      const { rerender } = render(
        <div data-theme="dark">
          <Probe open={false} />
        </div>,
      );
      rerender(
        <div data-theme="dark">
          <Probe open />
        </div>,
      );
      await act(async () => {
        portal.setAttribute("data-theme", "hotdog");
      });
      expect(scope()).toEqual({ "data-theme": "dark" });
    } finally {
      portal.remove();
    }
  });

  it("stops following once closed", async () => {
    const { container, rerender } = render(
      <section data-theme="light">
        <Probe open />
      </section>,
    );
    expect(scope()["data-theme"]).toBe("light");
    rerender(
      <section data-theme="light">
        <Probe open={false} />
      </section>,
    );
    await act(async () => {
      container.querySelector("section")!.setAttribute("data-theme", "dark");
    });
    expect(scope()["data-theme"]).not.toBe("dark");
  });
});
