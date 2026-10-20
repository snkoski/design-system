import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "../../../tests/warnings";
import { ButtonLink } from "./ButtonLink";
import type { ButtonLinkProps } from "./ButtonLink";

describe("ButtonLink", () => {
  it("renders a real link, not a button", () => {
    render(<ButtonLink href="/work">See my work</ButtonLink>);
    const link = screen.getByRole("link", { name: "See my work" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/work");
    expect(link).toHaveClass("button");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the same variant and size attributes, with the same defaults", () => {
    render(
      <>
        <ButtonLink href="/a">Default</ButtonLink>
        <ButtonLink href="/b" variant="ghost" size="lg">Custom</ButtonLink>
      </>,
    );
    const [plain, custom] = screen.getAllByRole("link");
    expect(plain).toHaveAttribute("data-variant", "primary");
    expect(plain).toHaveAttribute("data-size", "md");
    expect(custom).toHaveAttribute("data-variant", "ghost");
    expect(custom).toHaveAttribute("data-size", "lg");
  });

  it("passes link attributes through", () => {
    render(<ButtonLink href="https://example.com" target="_blank" rel="noreferrer">Docs</ButtonLink>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders icons hidden from screen readers", () => {
    render(<ButtonLink href="/next" iconEnd={<svg data-testid="end" />}>Next</ButtonLink>);
    expect(screen.getByTestId("end").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link")).toHaveAccessibleName("Next");
  });

  it("renders an icon-only link named by aria-label", () => {
    render(
      <ButtonLink href="/favorites" iconOnly aria-label="Favorites">
        <svg />
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Favorites" });
    expect(link).toHaveAttribute("data-icon-only", "true");
  });

  it("is reachable with Tab and activates with Enter", async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const user = userEvent.setup();
    render(<ButtonLink href="/work" onClick={onClick}>Work</ButtonLink>);
    await user.tab();
    expect(screen.getByRole("link")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards its ref to the anchor element", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<ButtonLink href="/work" ref={ref}>Work</ButtonLink>);
    expect(ref.current).toBe(screen.getByRole("link"));
  });

  it("merges a consumer className with its own", () => {
    render(<ButtonLink href="/work" className="mt-4">Work</ButtonLink>);
    expect(screen.getByRole("link")).toHaveClass("button", "mt-4");
  });

  it("has no loading or disabled props", () => {
    expectTypeOf<ButtonLinkProps>().not.toHaveProperty("loading");
    expectTypeOf<ButtonLinkProps>().not.toHaveProperty("disabled");
    expectTypeOf<ButtonLinkProps>().toHaveProperty("href");
  });

  describe("dev warnings", () => {
    it("warns when an icon-only button's aria-label is empty", () => {
      render(
        <ButtonLink href="/close" iconOnly aria-label="">
          <svg />
        </ButtonLink>,
      );
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] ButtonLink: has no accessible name, so screen readers announce it without one. Give an icon-only button an aria-label that says what it does."]);
    });

    it("warns when the label text is empty and there's no aria-label", () => {
      render(<ButtonLink href="/close">{""}</ButtonLink>);
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(takeWarnings()).toEqual(["[design-system] ButtonLink: has no accessible name, so screen readers announce it without one. Give it label text (children) or an aria-label."]);
    });
  });
});
