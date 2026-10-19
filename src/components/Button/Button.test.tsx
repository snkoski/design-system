import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders a native button with its label", () => {
      render(<Button>Send message</Button>);
      const button = screen.getByRole("button", { name: "Send message" });
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveClass("button");
    });

    it("defaults to the primary variant and the md size", () => {
      render(<Button>Save</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-variant", "primary");
      expect(button).toHaveAttribute("data-size", "md");
    });

    it.each(["primary", "secondary", "ghost"] as const)("maps variant=%s to data-variant", (variant) => {
      render(<Button variant={variant}>Save</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    });

    it.each(["sm", "md", "lg"] as const)("maps size=%s to data-size", (size) => {
      render(<Button size={size}>Save</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-size", size);
    });

    it("never uses modifier classes", () => {
      render(<Button variant="secondary" size="sm">Save</Button>);
      expect(screen.getByRole("button").className).toBe("button");
    });

    it("merges a consumer className with its own", () => {
      render(<Button className="mt-4">Save</Button>);
      expect(screen.getByRole("button")).toHaveClass("button", "mt-4");
    });

    it("passes other props through to the element", () => {
      render(<Button type="submit" name="intent" value="send" data-testid="send">Send</Button>);
      const button = screen.getByTestId("send");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("name", "intent");
      expect(button).toHaveAttribute("value", "send");
    });

    it("forwards its ref to the button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Save</Button>);
      expect(ref.current).toBe(screen.getByRole("button"));
    });

    it("wraps the label so CSS can target it", () => {
      render(<Button>Save</Button>);
      expect(screen.getByText("Save")).toHaveClass("button__label");
    });
  });

  describe("icons", () => {
    it("renders icons before and after the label, hidden from screen readers", () => {
      render(
        <Button iconStart={<svg data-testid="start" />} iconEnd={<svg data-testid="end" />}>
          Next
        </Button>,
      );
      const start = screen.getByTestId("start").parentElement;
      const end = screen.getByTestId("end").parentElement;
      expect(start).toHaveClass("button__icon");
      expect(start).toHaveAttribute("aria-hidden", "true");
      expect(end).toHaveClass("button__icon");
      expect(end).toHaveAttribute("aria-hidden", "true");
      // Document order: start icon, label, end icon
      const parts = [...screen.getByRole("button").children];
      expect(parts.map((part) => part.className)).toEqual(["button__icon", "button__label", "button__icon"]);
    });

    it("does not count icons toward the accessible name", () => {
      render(<Button iconStart={<svg><title>decorative</title></svg>}>Download</Button>);
      expect(screen.getByRole("button")).toHaveAccessibleName("Download");
    });

    it("renders an icon-only button named by aria-label, with no label element", () => {
      render(
        <Button iconOnly aria-label="Add to favorites">
          <svg data-testid="icon" />
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Add to favorites" });
      expect(button).toHaveAttribute("data-icon-only", "true");
      expect(button.querySelector(".button__label")).toBeNull();
      expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    });

    it("does not set data-icon-only on a regular button", () => {
      render(<Button>Save</Button>);
      expect(screen.getByRole("button")).not.toHaveAttribute("data-icon-only");
    });
  });

  describe("clicking and keyboard", () => {
    it("calls onClick once per click", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Send</Button>);
      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("activates with Enter", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Send</Button>);
      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("activates with Space", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Send</Button>);
      await user.tab();
      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("is reachable with Tab in source order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>One</Button>
          <Button>Two</Button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    });

    it("submits the surrounding form", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Send</Button>
        </form>,
      );
      await user.click(screen.getByRole("button"));
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("disabled", () => {
    it("is disabled and does not call onClick", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={onClick}>Send</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-disabled");
      await user.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("is skipped by Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button disabled>Off</Button>
          <Button>On</Button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "On" })).toHaveFocus();
    });

    it("does not submit a form", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" disabled>Send</Button>
        </form>,
      );
      await user.click(screen.getByRole("button"));
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("loading", () => {
    it("announces busy, shows a spinner, and keeps the label", () => {
      render(<Button loading>Sending message</Button>);
      const button = screen.getByRole("button", { name: "Sending message" });
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("data-loading", "true");
      expect(button.querySelector(".button__spinner")).toBeInTheDocument();
      expect(button.querySelector(".button__spinner")).toHaveAttribute("aria-hidden", "true");
    });

    it("replaces the start icon with the spinner", () => {
      render(<Button loading iconStart={<svg data-testid="start" />}>Saving</Button>);
      expect(screen.queryByTestId("start")).not.toBeInTheDocument();
      expect(screen.getByRole("button").querySelector(".button__spinner")).toBeInTheDocument();
    });

    it("keeps the end icon while loading", () => {
      render(<Button loading iconEnd={<svg data-testid="end" />}>Saving</Button>);
      expect(screen.getByTestId("end")).toBeInTheDocument();
    });

    it("swaps an icon-only button's icon for the spinner", () => {
      render(
        <Button iconOnly loading aria-label="Refresh">
          <svg data-testid="icon" />
        </Button>,
      );
      expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Refresh" }).querySelector(".button__spinner")).toBeInTheDocument();
    });

    it("blocks clicks", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button loading onClick={onClick}>Sending</Button>);
      await user.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("blocks Enter and Space", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<Button loading onClick={onClick}>Sending</Button>);
      await user.tab();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onClick).not.toHaveBeenCalled();
    });

    it("stays focusable so keyboard users don't lose their place", async () => {
      const user = userEvent.setup();
      render(<Button loading>Sending</Button>);
      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("does not submit a form", async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading>Send</Button>
        </form>,
      );
      await user.click(screen.getByRole("button"));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("returns to normal when loading ends", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Button loading onClick={onClick}>Send</Button>);
      rerender(<Button onClick={onClick}>Send</Button>);
      const button = screen.getByRole("button");
      expect(button).not.toHaveAttribute("aria-busy");
      expect(button).not.toHaveAttribute("data-loading");
      expect(button.querySelector(".button__spinner")).toBeNull();
      await user.click(button);
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe("types", () => {
    it("requires aria-label on an icon-only button", () => {
      expectTypeOf<{ iconOnly: true }>().not.toExtend<ButtonProps>();
      expectTypeOf<{ iconOnly: true; "aria-label": string }>().toExtend<ButtonProps>();
      expectTypeOf<{ children: string }>().toExtend<ButtonProps>();
    });

    it("only accepts known variants and sizes", () => {
      expectTypeOf<ButtonProps["variant"]>().toEqualTypeOf<"primary" | "secondary" | "ghost" | undefined>();
      expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<"sm" | "md" | "lg" | undefined>();
    });

    it("does not allow render or className-as-function overrides", () => {
      expectTypeOf<ButtonProps>().not.toHaveProperty("render");
      expectTypeOf<ButtonProps["className"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
