import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { afterAll, beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { takeWarnings } from "@tests/warnings";
import { RichText } from "@/experiments/RichText/RichText";
import type { RichTextProps, RichTextSize } from "@/experiments/RichText/RichText";

// ProseMirror measures the page to place the caret and scroll to it. jsdom has no layout, so these return empty
// boxes. Stubbed here rather than in tests/setup.ts, so the experiment changes nothing outside its folder.
const rect = { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
const rects = Object.assign([], { item: () => null }) as unknown as DOMRectList;
const stubbed: [object, string, unknown][] = [];
function stub(target: object, key: string, value: unknown) {
  stubbed.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
}
beforeAll(() => {
  stub(Range.prototype, "getClientRects", () => rects);
  stub(Range.prototype, "getBoundingClientRect", () => rect);
  stub(Element.prototype, "getClientRects", () => rects);
  stub(document, "elementFromPoint", () => null);
});
afterAll(() => {
  for (const [target, key, descriptor] of stubbed.reverse()) {
    if (descriptor) Object.defineProperty(target, key, descriptor as PropertyDescriptor);
    else delete (target as Record<string, unknown>)[key];
  }
});

const getEditor = () => screen.getByRole("textbox");
const button = (name: string) => screen.getByRole("button", { name });
const hiddenInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="hidden"]');

/** Focuses the editable area the way a click would, then selects everything in it. */
async function selectAll(user: ReturnType<typeof userEvent.setup>) {
  act(() => getEditor().focus());
  await user.keyboard("{Control>}a{/Control}");
}

/** Renders a field that reports its value, so tests can read the markdown. */
function renderReporting(props: Partial<RichTextProps> = {}) {
  const onValueChange = vi.fn();
  const result = render(<RichText label="Message" name="message" onValueChange={onValueChange} {...(props as object)} />);
  const value = () => hiddenInput(result.container)!.value;
  return { ...result, onValueChange, value };
}

describe("RichText", () => {
  describe("rendering", () => {
    it("renders a multi-line text field named by its label", () => {
      render(<RichText label="Message" />);
      const editor = screen.getByRole("textbox", { name: "Message" });
      expect(editor).toHaveAttribute("aria-multiline", "true");
      expect(editor).toHaveAttribute("contenteditable", "true");
      expect(editor).toHaveClass("rich-text__editor");
    });

    it("renders the label as text that names the field, not as a <label> pointing at it", () => {
      render(<RichText label="Message" />);
      const label = screen.getByText("Message");
      expect(label.tagName).toBe("SPAN");
      expect(label).toHaveClass("rich-text__label");
      expect(label).not.toHaveAttribute("for");
      expect(getEditor()).toHaveAttribute("aria-labelledby", label.id);
    });

    it("focuses the field when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" />);
      expect(getEditor()).not.toHaveFocus();
      await user.click(screen.getByText("Message"));
      expect(getEditor()).toHaveFocus();
    });

    it("defaults to the md size, one row, and growing to four", () => {
      const { container } = render(<RichText label="Message" />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass("rich-text");
      expect(root).toHaveAttribute("data-size", "md");
      expect(root.style.getPropertyValue("--rich-text-rows")).toBe("1");
      expect(root.style.getPropertyValue("--rich-text-max-rows")).toBe("4");
    });

    it.each(["md", "lg"] as const)("maps size=%s to data-size on the outer element", (size) => {
      const { container } = render(<RichText label="Message" size={size} />);
      expect(container.firstElementChild).toHaveAttribute("data-size", size);
    });

    it("passes rows and maxRows on as the field's height", () => {
      const { container } = render(<RichText label="Message" rows={2} maxRows={6} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.getPropertyValue("--rich-text-rows")).toBe("2");
      expect(root.style.getPropertyValue("--rich-text-max-rows")).toBe("6");
    });

    it("never grows to fewer rows than it starts with", () => {
      const { container } = render(<RichText label="Message" rows={5} maxRows={2} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.getPropertyValue("--rich-text-max-rows")).toBe("5");
    });

    it("keeps a consumer's style next to its own", () => {
      const { container } = render(<RichText label="Message" style={{ marginTop: "1rem" }} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.marginTop).toBe("1rem");
      expect(root.style.getPropertyValue("--rich-text-rows")).toBe("1");
    });

    it("can be named by aria-label alone, with no visible label", () => {
      const { container } = render(<RichText aria-label="Message" />);
      expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
      expect(container.querySelector(".rich-text__label")).toBeNull();
    });

    it("can be named by another element through aria-labelledby", () => {
      render(
        <>
          <h2 id="heading">Reply</h2>
          <RichText aria-labelledby="heading" />
        </>,
      );
      expect(screen.getByRole("textbox", { name: "Reply" })).toBeInTheDocument();
    });

    it("lets aria-labelledby replace the visible label as the name", () => {
      render(
        <>
          <h2 id="heading">Reply</h2>
          <RichText label="Message" aria-labelledby="heading" />
        </>,
      );
      expect(screen.getByRole("textbox", { name: "Reply" })).toBeInTheDocument();
    });

    it("puts the description and then the error between the label and the box", () => {
      const { container } = render(<RichText label="Message" description="Help" error="Wrong" invalid />);
      const classes = [...container.firstElementChild!.children].map((child) => child.className);
      expect(classes.slice(0, 4)).toEqual([
        "rich-text__label",
        "rich-text__description",
        expect.stringContaining("rich-text__error"),
        "rich-text__box",
      ]);
    });

    it("puts the toolbar above the editable area, inside the box", () => {
      const { container } = render(<RichText label="Message" />);
      const box = container.querySelector(".rich-text__box")!;
      expect(box.firstElementChild).toBe(screen.getByRole("toolbar"));
      expect(box.contains(getEditor())).toBe(true);
    });

    it("applies className to the outer wrapper, next to its own class", () => {
      const { container } = render(<RichText label="Message" className="mt-4" />);
      expect(container.firstElementChild).toHaveClass("rich-text", "mt-4");
    });

    it("passes other props through to the outer wrapper", () => {
      const { container } = render(<RichText label="Message" data-testid="field" title="Reply" />);
      expect(container.firstElementChild).toHaveAttribute("data-testid", "field");
      expect(container.firstElementChild).toHaveAttribute("title", "Reply");
      expect(getEditor()).not.toHaveAttribute("data-testid");
    });

    it("puts id on the editable area", () => {
      render(<RichText label="Message" id="reply" />);
      expect(getEditor()).toHaveAttribute("id", "reply");
    });

    it("shows a placeholder and tells assistive technology about it", () => {
      render(<RichText label="Message" placeholder="Write a message" />);
      expect(getEditor()).toHaveAttribute("aria-placeholder", "Write a message");
      expect(getEditor().querySelector("[data-placeholder]")).toHaveAttribute("data-placeholder", "Write a message");
    });

    it("drops the placeholder once there's text", () => {
      render(<RichText label="Message" placeholder="Write a message" defaultValue="Hi" />);
      expect(getEditor()).toHaveTextContent("Hi");
      expect(getEditor().querySelector(".is-editor-empty")).toBeNull();
    });

    it("never uses modifier classes", () => {
      const { container } = render(<RichText label="Message" description="Help" error="Wrong" invalid size="lg" />);
      const all = [container.firstElementChild!, ...container.querySelectorAll("*")];
      expect(all.length).toBeGreaterThan(10);
      for (const element of all) {
        for (const name of element.classList) expect(name).not.toMatch(/--/);
      }
    });
  });

  describe("toolbar", () => {
    const tools = [
      ["Bold", "Control+B"],
      ["Italic", "Control+I"],
      ["Underline", "Control+U"],
      ["Strikethrough", "Control+Shift+S"],
      ["Inline code", "Control+E"],
      ["Quote", "Control+Shift+B"],
      ["Bulleted list", "Control+Shift+8"],
      ["Numbered list", "Control+Shift+7"],
      ["Code block", "Control+Alt+C"],
    ] as const;

    it("is a toolbar named Formatting that controls the field", () => {
      render(<RichText label="Message" id="reply" />);
      const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
      expect(toolbar).toHaveClass("rich-text__toolbar");
      expect(toolbar).toHaveAttribute("aria-controls", "reply");
    });

    it("has three named groups of buttons, in order", () => {
      render(<RichText label="Message" />);
      const groups = screen.getAllByRole("group");
      expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual(["Text style", "Insert", "Blocks"]);
      const names = (group: HTMLElement) => within(group).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
      expect(names(groups[0]!)).toEqual(["Bold", "Italic", "Underline", "Strikethrough"]);
      expect(names(groups[1]!)).toEqual(["Inline code", "Add link"]);
      expect(names(groups[2]!)).toEqual(["Quote", "Bulleted list", "Numbered list", "Code block"]);
    });

    it.each(tools)("makes %s a toggle button that's off by default, with its shortcut", (name, shortcut) => {
      render(<RichText label="Message" />);
      expect(button(name)).toHaveAttribute("aria-pressed", "false");
      expect(button(name)).toHaveAttribute("aria-keyshortcuts", shortcut);
      expect(button(name)).toHaveClass("rich-text__tool");
      expect(button(name)).toHaveAttribute("type", "button");
    });

    it("names the shortcuts with Cmd on a Mac", async () => {
      const platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
      try {
        const user = userEvent.setup();
        render(<RichText label="Message" />);
        expect(button("Bold")).toHaveAttribute("aria-keyshortcuts", "Meta+B");
        expect(button("Strikethrough")).toHaveAttribute("aria-keyshortcuts", "Meta+Shift+S");
        expect(button("Code block")).toHaveAttribute("aria-keyshortcuts", "Meta+Alt+C");
        await user.tab();
        expect(await screen.findByText("⌘B")).toBeInTheDocument();
      } finally {
        platform.mockRestore();
      }
    });

    it("makes the link button open a dialog rather than toggle", () => {
      render(<RichText label="Message" />);
      expect(button("Add link")).not.toHaveAttribute("aria-pressed");
      expect(button("Add link")).toHaveAttribute("aria-haspopup", "dialog");
      expect(button("Add link")).toHaveAttribute("aria-expanded", "false");
      expect(button("Add link")).toHaveAttribute("aria-keyshortcuts", "Control+K");
    });

    it("hides every icon from screen readers", () => {
      render(<RichText label="Message" />);
      const icons = screen.getByRole("toolbar").querySelectorAll("svg");
      expect(icons).toHaveLength(10);
      for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("separates the groups", () => {
      render(<RichText label="Message" />);
      expect(within(screen.getByRole("toolbar")).getAllByRole("separator")).toHaveLength(2);
    });

    it("shows a button's name and shortcut when it gets focus", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" />);
      await user.tab();
      expect(button("Bold")).toHaveFocus();
      const tooltip = await screen.findByText("Ctrl+B");
      expect(tooltip.closest(".rich-text__tooltip")).toHaveTextContent("Bold");
    });

    it.each([
      ["Bold", "**word**"],
      ["Italic", "*word*"],
      ["Underline", "<u>word</u>"],
      ["Strikethrough", "~~word~~"],
      ["Inline code", "`word`"],
      ["Quote", "> word"],
      ["Bulleted list", "- word"],
      ["Numbered list", "1. word"],
      ["Code block", "```\nword\n```"],
    ])("applies %s to the selection when clicked", async (name, expected) => {
      const user = userEvent.setup();
      const { value, onValueChange } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button(name));
      expect(value()).toBe(expected);
      expect(onValueChange).toHaveBeenLastCalledWith(expected);
      expect(button(name)).toHaveAttribute("aria-pressed", "true");
    });

    it("turns a format off when clicked again", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "**word**" });
      await selectAll(user);
      expect(button("Bold")).toHaveAttribute("aria-pressed", "true");
      await user.click(button("Bold"));
      expect(value()).toBe("word");
      expect(button("Bold")).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps focus in the field when a button is clicked, so typing carries on in the new style", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.keyboard("plain ");
      await user.click(button("Bold"));
      expect(getEditor()).toHaveFocus();
      await user.keyboard("strong");
      expect(value()).toBe("plain **strong**");
    });

    it("doesn't take focus when pressed with the mouse", () => {
      render(<RichText label="Message" />);
      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      button("Bold").dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it("shows which formats are on where the caret is", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" defaultValue="> ***both***" />);
      act(() => getEditor().focus());
      await user.keyboard("{Control>}a{/Control}");
      expect(button("Bold")).toHaveAttribute("aria-pressed", "true");
      expect(button("Italic")).toHaveAttribute("aria-pressed", "true");
      expect(button("Quote")).toHaveAttribute("aria-pressed", "true");
      expect(button("Underline")).toHaveAttribute("aria-pressed", "false");
      expect(button("Code block")).toHaveAttribute("aria-pressed", "false");
    });

    it("shows which formats are on as soon as it loads, before anything is typed or clicked", () => {
      render(<RichText label="Message" defaultValue="> **Bold** in a quote" />);
      expect(button("Bold")).toHaveAttribute("aria-pressed", "true");
      expect(button("Quote")).toHaveAttribute("aria-pressed", "true");
      expect(button("Italic")).toHaveAttribute("aria-pressed", "false");
    });

    it("updates the buttons when value replaces the content", () => {
      const { rerender } = render(<RichText label="Message" value="plain" />);
      expect(button("Bold")).toHaveAttribute("aria-pressed", "false");
      rerender(<RichText label="Message" value="**bold**" />);
      expect(button("Bold")).toHaveAttribute("aria-pressed", "true");
    });

    it("renames the link button when the caret is in a link", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" defaultValue="[word](https://example.com)" />);
      await selectAll(user);
      expect(button("Edit link")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add link" })).toBeNull();
    });
  });

  describe("keyboard", () => {
    it("reaches the toolbar first with Tab, as one stop, then the field", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <RichText label="Message" />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(button("Before")).toHaveFocus();
      await user.tab();
      expect(button("Bold")).toHaveFocus();
      await user.tab();
      expect(getEditor()).toHaveFocus();
      await user.tab();
      expect(button("After")).toHaveFocus();
    });

    it("moves between toolbar buttons with the arrow keys, wrapping at the ends", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" />);
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(button("Italic")).toHaveFocus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(button("Code block")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(button("Numbered list")).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(button("Bold")).toHaveFocus();
    });

    it.each(["{Enter}", " "])("toggles with %j and goes back to the field, so typing carries on in the new style", async (key) => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      await user.tab();
      expect(button("Bold")).toHaveFocus();
      await user.keyboard(key);
      await waitFor(() => expect(getEditor()).toHaveFocus());
      await user.keyboard("strong");
      expect(value()).toBe("**strong**");
    });

    it.each([
      ["{Control>}b{/Control}", "**word**"],
      ["{Control>}i{/Control}", "*word*"],
      ["{Control>}u{/Control}", "<u>word</u>"],
      ["{Control>}{Shift>}s{/Shift}{/Control}", "~~word~~"],
      ["{Control>}e{/Control}", "`word`"],
      ["{Control>}{Shift>}b{/Shift}{/Control}", "> word"],
      ["{Control>}{Shift>}8{/Shift}{/Control}", "- word"],
      ["{Control>}{Shift>}7{/Shift}{/Control}", "1. word"],
      ["{Control>}{Alt>}c{/Alt}{/Control}", "```\nword\n```"],
    ])("formats the selection with %s", async (keys, expected) => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.keyboard(keys);
      expect(value()).toBe(expected);
    });

    it("turns typed markdown into formatting", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.keyboard("a **bold** move");
      expect(getEditor().querySelector("strong")).toHaveTextContent("bold");
      expect(value()).toBe("a **bold** move");
    });

    it("starts a list from typed markdown, and Enter adds an item", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.keyboard("- one{Enter}two");
      expect(getEditor().querySelectorAll("li")).toHaveLength(2);
      expect(value()).toBe("- one\n- two");
    });

    it("leaves the field with Tab inside a list, rather than indenting the item", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <RichText label="Message" name="message" />
          <button type="button">After</button>
        </>,
      );
      act(() => getEditor().focus());
      await user.keyboard("- one{Enter}two");
      expect(hiddenInput(container)).toHaveValue("- one\n- two");
      await user.tab();
      expect(button("After")).toHaveFocus();
      expect(hiddenInput(container)).toHaveValue("- one\n- two");
    });

    it("adds a new paragraph with Enter instead of submitting the form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
          <RichText label="Message" name="message" />
        </form>,
      );
      act(() => getEditor().focus());
      await user.keyboard("one{Enter}two");
      expect(onSubmit).not.toHaveBeenCalled();
      expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe("one\n\ntwo");
    });

    it("undoes and redoes", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.keyboard("{Control>}b{/Control}");
      expect(value()).toBe("**word**");
      await user.keyboard("{Control>}z{/Control}");
      expect(value()).toBe("word");
      await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
      expect(value()).toBe("**word**");
    });
  });

  describe("paste", () => {
    it("reads pasted plain text as markdown", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.paste("**hi** there");
      expect(getEditor().querySelector("strong")).toHaveTextContent("hi");
      expect(value()).toBe("**hi** there");
    });

    it("reads pasted lines as paragraphs and lists", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.paste("Intro\n\n- one\n- two");
      expect(getEditor().querySelectorAll("li")).toHaveLength(2);
      expect(value()).toBe("Intro\n\n- one\n- two");
    });

    it("pastes into a code block as it is", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "```\n\n```" });
      act(() => getEditor().focus());
      await user.paste("**not bold**");
      expect(getEditor().querySelector("strong")).toBeNull();
      expect(value()).toBe("```\n**not bold**\n```");
    });

    it("keeps only the formats it has from pasted rich text", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      const html = '<h1>Title</h1><p><b>bold</b> <span style="color: red">red</span> <a href="javascript:alert(1)">bad</a></p>';
      const data = {
        types: ["text/html", "text/plain"],
        getData: (type: string) => ({ "text/html": html, "text/plain": "Title\n\nbold red bad" })[type] ?? "",
        files: [],
        items: [],
      } as unknown as DataTransfer;
      await user.paste(data);
      expect(getEditor().querySelector("h1")).toBeNull();
      expect(getEditor().querySelector("a")).toBeNull();
      expect(getEditor().querySelector("[style]")).toBeNull();
      expect(value()).toBe("Title\n\n**bold** red bad");
    });
  });

  describe("links", () => {
    const dialog = () => screen.getByRole("dialog", { name: "Link" });
    const address = () => within(dialog()).getByRole("textbox", { name: "Link address" });

    /** Clicks the link button and waits for focus to move into the link editor (Base UI moves it a frame later). */
    async function openLinkEditor(user: ReturnType<typeof userEvent.setup>, name = "Add link") {
      await user.click(button(name));
      await waitFor(() => expect(dialog().contains(document.activeElement)).toBe(true));
    }

    it("adds a link to the selected text", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      await waitFor(() => expect(address()).toHaveFocus());
      expect(within(dialog()).queryByRole("textbox", { name: "Text" })).toBeNull();
      await user.type(address(), "https://example.com");
      await user.click(within(dialog()).getByRole("button", { name: "Save link" }));
      expect(value()).toBe("[word](https://example.com)");
      expect(screen.queryByRole("dialog")).toBeNull();
      await waitFor(() => expect(getEditor()).toHaveFocus());
    });

    it("saves with Enter in the address field", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      await user.type(address(), "https://example.com{Enter}");
      expect(value()).toBe("[word](https://example.com)");
    });

    it("adds https:// to an address typed without it", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      await user.type(address(), "example.com{Enter}");
      expect(value()).toBe("[word](https://example.com)");
    });

    it("refuses an address that isn't a web or email address, and says why", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      await user.type(address(), "javascript:alert(1){Enter}");
      expect(dialog()).toBeInTheDocument();
      expect(address()).toHaveAttribute("aria-invalid", "true");
      expect(address()).toHaveAccessibleDescription(expect.stringContaining("Use a web or email address, such as https://example.com."));
      expect(address()).toHaveFocus();
      expect(value()).toBe("word");
    });

    it("asks for an address when it's left empty", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await openLinkEditor(user);
      await user.keyboard("{Enter}");
      expect(address()).toHaveAttribute("aria-invalid", "true");
      expect(address()).toHaveAccessibleDescription(expect.stringContaining("Enter a link address."));
      expect(value()).toBe("word");
    });

    it("clears the error once the address is changed", async () => {
      const user = userEvent.setup();
      renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await openLinkEditor(user);
      await user.keyboard("{Enter}");
      expect(address()).toHaveAttribute("aria-invalid", "true");
      await user.type(address(), "e");
      expect(address()).not.toHaveAttribute("aria-invalid", "true");
    });

    it("asks for the text too when nothing is selected, and inserts the link", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.click(button("Add link"));
      const text = within(dialog()).getByRole("textbox", { name: "Text" });
      await waitFor(() => expect(text).toHaveFocus());
      await user.type(text, "the docs");
      await user.type(address(), "example.com{Enter}");
      expect(value()).toBe("[the docs](https://example.com)");
    });

    it("uses the address as the text when the text is left empty", async () => {
      const user = userEvent.setup();
      renderReporting();
      act(() => getEditor().focus());
      await user.click(button("Add link"));
      await user.type(address(), "example.com{Enter}");
      const link = getEditor().querySelector("a");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveTextContent("https://example.com");
    });

    it("doesn't carry the link on into what's typed next", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.click(button("Add link"));
      await user.type(within(dialog()).getByRole("textbox", { name: "Text" }), "docs");
      await user.type(address(), "example.com{Enter}");
      await user.keyboard(" after");
      expect(value()).toBe("[docs](https://example.com) after");
    });

    it("edits a link: the address is filled in, and it can be changed or removed", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "[word](https://example.com)" });
      await selectAll(user);
      await user.click(button("Edit link"));
      expect(address()).toHaveValue("https://example.com");
      await user.clear(address());
      await user.type(address(), "https://example.org{Enter}");
      expect(value()).toBe("[word](https://example.org)");
      await selectAll(user);
      await user.click(button("Edit link"));
      await user.click(within(dialog()).getByRole("button", { name: "Remove link" }));
      expect(value()).toBe("word");
      await waitFor(() => expect(getEditor()).toHaveFocus());
    });

    it("removes the link when an existing link's address is emptied", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "[word](https://example.com)" });
      await selectAll(user);
      await user.click(button("Edit link"));
      await user.clear(address());
      await user.keyboard("{Enter}");
      expect(value()).toBe("word");
    });

    it("offers Remove link only for an existing link", async () => {
      const user = userEvent.setup();
      renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      expect(within(dialog()).getByRole("button", { name: "Save link" })).toBeInTheDocument();
      expect(within(dialog()).queryByRole("button", { name: "Remove link" })).toBeNull();
    });

    it("closes with Escape without saving, back in the field", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.click(button("Add link"));
      await user.type(address(), "https://example.com");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(getEditor()).toHaveFocus());
      expect(value()).toBe("word");
    });

    it("keeps the text being linked highlighted while the link editor is open", async () => {
      const user = userEvent.setup();
      const field = () => screen.getByRole("textbox", { name: "Message" });
      renderReporting({ defaultValue: "a word here" });
      act(() => field().focus());
      await user.keyboard("{Control>}a{/Control}");
      expect(field().querySelector(".rich-text__selection")).toBeNull();
      await openLinkEditor(user);
      expect(field()).not.toHaveFocus();
      const marked = field().querySelectorAll(".rich-text__selection");
      expect([...marked].map((element) => element.textContent).join("")).toBe("a word here");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(field().querySelector(".rich-text__selection")).toBeNull();
    });

    it("drops the highlight once the link is saved", async () => {
      const user = userEvent.setup();
      const field = () => screen.getByRole("textbox", { name: "Message" });
      const { value } = renderReporting({ defaultValue: "word" });
      act(() => field().focus());
      await user.keyboard("{Control>}a{/Control}");
      await openLinkEditor(user);
      expect(field().querySelector(".rich-text__selection")).not.toBeNull();
      await user.type(address(), "example.com{Enter}");
      expect(value()).toBe("[word](https://example.com)");
      expect(field().querySelector(".rich-text__selection")).toBeNull();
    });

    it("highlights nothing when nothing is selected", async () => {
      const user = userEvent.setup();
      const field = () => screen.getByRole("textbox", { name: "Message" });
      renderReporting({ defaultValue: "word" });
      act(() => field().focus());
      await openLinkEditor(user);
      expect(within(dialog()).getByRole("textbox", { name: "Text" })).toBeInTheDocument();
      expect(field().querySelector(".rich-text__selection")).toBeNull();
    });

    it("opens with Control+K", async () => {
      const user = userEvent.setup();
      renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.keyboard("{Control>}k{/Control}");
      await waitFor(() => expect(address()).toHaveFocus());
      expect(button("Add link")).toHaveAttribute("aria-expanded", "true");
    });

    it("doesn't submit the form the field is in when a link is saved", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      render(
        <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
          <RichText label="Message" name="message" defaultValue="word" />
        </form>,
      );
      await selectAll(user);
      await user.click(button("Add link"));
      await user.type(address(), "https://example.com{Enter}");
      expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe("[word](https://example.com)");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("drops a javascript: link given as the value, keeping its text", () => {
      const { value } = renderReporting({ defaultValue: "[click](javascript:alert(1))" });
      expect(getEditor()).toHaveTextContent("click");
      expect(getEditor().querySelector("a")).toBeNull();
      expect(value()).toBe("click");
    });
  });

  describe("value", () => {
    it("starts with defaultValue, drawn as formatting", () => {
      render(<RichText label="Message" defaultValue={"**b** *i* <u>u</u> ~~s~~ `c` [l](https://example.com)\n\n> q\n\n- one\n\n1. two\n\n```\ncode\n```"} />);
      const editor = getEditor();
      for (const tag of ["strong", "em", "u", "s", "code", "a", "blockquote", "ul", "ol", "pre"]) {
        expect(editor.querySelector(tag), tag).not.toBeNull();
      }
      expect(editor).not.toHaveTextContent("**");
    });

    it("takes typed text when uncontrolled", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting();
      act(() => getEditor().focus());
      await user.keyboard("hello");
      expect(getEditor()).toHaveTextContent("hello");
      expect(value()).toBe("hello");
    });

    it("calls onValueChange with the markdown after each edit", async () => {
      const user = userEvent.setup();
      const { onValueChange } = renderReporting();
      act(() => getEditor().focus());
      await user.keyboard("ab");
      expect(onValueChange.mock.calls).toEqual([["a"], ["ab"]]);
    });

    it("doesn't call onValueChange when it first loads, even when it rewrites the markdown", () => {
      const { onValueChange, value } = renderReporting({ defaultValue: "__b__" });
      expect(value()).toBe("**b**");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("doesn't call onValueChange when only the selection moves", async () => {
      const user = userEvent.setup();
      const { onValueChange } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      expect(getEditor()).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("replaces its content when value changes, without calling onValueChange", () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<RichText label="Message" value="one" onValueChange={onValueChange} />);
      expect(getEditor()).toHaveTextContent("one");
      rerender(<RichText label="Message" value="**two**" onValueChange={onValueChange} />);
      expect(getEditor()).toHaveTextContent("two");
      expect(getEditor().querySelector("strong")).toHaveTextContent("two");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("can be cleared by its value, as after sending a message", () => {
      const { rerender, container } = render(<RichText label="Message" name="message" value="sent" />);
      rerender(<RichText label="Message" name="message" value="" />);
      expect(getEditor()).toHaveTextContent("");
      expect(hiddenInput(container)).toHaveValue("");
    });

    it("keeps what's typed when the parent doesn't pass the new value back", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(<RichText label="Message" value="a" onValueChange={onValueChange} />);
      act(() => getEditor().focus());
      await user.keyboard("b");
      expect(onValueChange).toHaveBeenLastCalledWith("ba");
      rerender(<RichText label="Message" value="a" onValueChange={onValueChange} />);
      expect(getEditor()).toHaveTextContent("ba");
    });

    it("works as a controlled field driven by state, keeping the caret where it was", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [value, setValue] = useState("ab");
        return (
          <>
            <RichText label="Message" value={value} onValueChange={setValue} />
            <output>{value}</output>
          </>
        );
      }
      render(<Controlled />);
      act(() => getEditor().focus());
      await user.keyboard("12");
      expect(screen.getByRole("status")).toHaveTextContent("12ab");
      expect(getEditor()).toHaveTextContent("12ab");
    });

    it("doesn't put a replaced value into the undo history", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RichText label="Message" value="one" />);
      rerender(<RichText label="Message" value="two" />);
      act(() => getEditor().focus());
      await user.keyboard("{Control>}z{/Control}");
      expect(getEditor()).toHaveTextContent("two");
    });

    it("is an empty string when everything is deleted", async () => {
      const user = userEvent.setup();
      const { value, onValueChange } = renderReporting({ defaultValue: "word" });
      await selectAll(user);
      await user.keyboard("{Backspace}");
      expect(value()).toBe("");
      expect(onValueChange).toHaveBeenLastCalledWith("");
    });
  });

  describe("disabled", () => {
    it("blocks typing and formatting, and is marked disabled", async () => {
      const user = userEvent.setup();
      const { container, value } = renderReporting({ defaultValue: "word", disabled: true });
      expect(container.firstElementChild).toHaveAttribute("data-disabled");
      expect(getEditor()).toHaveAttribute("contenteditable", "false");
      expect(getEditor()).toHaveAttribute("aria-disabled", "true");
      for (const name of ["Bold", "Add link", "Code block"]) expect(button(name)).toBeDisabled();
      await user.click(getEditor());
      await user.keyboard("x");
      expect(value()).toBe("word");
    });

    it("is skipped by Tab, toolbar and field alike", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <RichText label="Message" disabled />
          <button type="button">After</button>
        </>,
      );
      expect(getEditor()).toBeInTheDocument();
      expect(button("Bold")).toBeInTheDocument();
      await user.tab();
      expect(button("Before")).toHaveFocus();
      await user.tab();
      expect(button("After")).toHaveFocus();
    });

    it("doesn't focus the field when the label is clicked", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" disabled />);
      await user.click(screen.getByText("Message"));
      expect(getEditor()).not.toHaveFocus();
    });

    it("can be turned on and off", () => {
      const { rerender } = render(<RichText label="Message" disabled />);
      expect(getEditor()).toHaveAttribute("contenteditable", "false");
      rerender(<RichText label="Message" />);
      expect(getEditor()).toHaveAttribute("contenteditable", "true");
      expect(getEditor()).not.toHaveAttribute("aria-disabled");
      expect(button("Bold")).toBeEnabled();
    });
  });

  describe("read only", () => {
    it("says \"Read only\" beside the label, hidden from screen readers and left out of the name", () => {
      render(<RichText label="Message" readOnly defaultValue="word" />);
      const note = screen.getByText("Read only");
      expect(note).toHaveClass("read-only-note");
      expect(note).toHaveAttribute("aria-hidden", "true");
      expect(note.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(note.closest(".rich-text__label")).toHaveTextContent("Message");
      expect(getEditor()).toHaveAccessibleName("Message");
    });

    it("has no note when it isn't read-only, or when it's disabled as well", () => {
      const { rerender } = render(<RichText label="Message" defaultValue="word" />);
      expect(getEditor()).toBeInTheDocument();
      expect(screen.queryByText("Read only")).toBeNull();
      rerender(<RichText label="Message" readOnly disabled defaultValue="word" />);
      expect(getEditor()).toHaveAttribute("aria-readonly", "true");
      expect(screen.queryByText("Read only")).toBeNull();
    });

    it("blocks typing and formatting but keeps its value", async () => {
      const user = userEvent.setup();
      const { value } = renderReporting({ defaultValue: "word", readOnly: true });
      expect(getEditor()).toHaveAttribute("contenteditable", "false");
      expect(getEditor()).toHaveAttribute("aria-readonly", "true");
      act(() => getEditor().focus());
      await user.keyboard("x{Control>}b{/Control}");
      expect(value()).toBe("word");
    });

    it("doesn't open the link editor with Control+K", async () => {
      const user = userEvent.setup();
      render(<RichText label="Message" readOnly defaultValue="[word](https://example.com)" />);
      act(() => getEditor().focus());
      expect(getEditor()).toHaveFocus();
      await user.keyboard("{Control>}a{/Control}{Control>}k{/Control}");
      expect(getEditor()).toHaveFocus();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("hides the toolbar, since none of it can be used, and shows it again when editable", () => {
      const { rerender } = render(<RichText label="Message" readOnly defaultValue="word" />);
      expect(getEditor()).toHaveTextContent("word");
      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
      rerender(<RichText label="Message" defaultValue="word" />);
      expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
      expect(button("Bold")).toBeEnabled();
    });

    it("stays in the tab order, so its text can be read and copied, with no toolbar stop before it", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <RichText label="Message" readOnly />
        </>,
      );
      await user.tab();
      expect(button("Before")).toHaveFocus();
      await user.tab();
      expect(getEditor()).toHaveFocus();
    });
  });

  describe("required and invalid", () => {
    it("is announced as required", () => {
      render(<RichText label="Message" required />);
      expect(getEditor()).toHaveAttribute("aria-required", "true");
    });

    it("is not required by default", () => {
      render(<RichText label="Message" />);
      expect(getEditor()).toHaveAttribute("role", "textbox");
      expect(getEditor()).not.toHaveAttribute("aria-required");
    });

    it("is announced as invalid", () => {
      render(<RichText label="Message" invalid />);
      expect(getEditor()).toHaveAttribute("aria-invalid", "true");
    });

    it("is valid by default", () => {
      render(<RichText label="Message" />);
      expect(getEditor()).toHaveAttribute("role", "textbox");
      expect(getEditor()).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("description and error", () => {
    it("links the description to the field", () => {
      render(<RichText label="Message" description="Markdown works too." />);
      expect(getEditor()).toHaveAccessibleDescription("Markdown works too.");
      expect(getEditor()).toHaveAccessibleName("Message");
    });

    it("keeps the description out of the accessible name", () => {
      render(<RichText label="Message" description="Markdown works too." />);
      expect(getEditor()).toHaveAccessibleName("Message");
    });

    it("renders a description for a field named by aria-label", () => {
      render(<RichText aria-label="Reply" description="Markdown works too." />);
      expect(getEditor()).toHaveAccessibleName("Reply");
      expect(getEditor()).toHaveAccessibleDescription("Markdown works too.");
    });

    it("shows the error, linked to the field, when invalid", () => {
      render(<RichText label="Message" invalid error="Write something first." />);
      expect(screen.getByText("Write something first.")).toBeInTheDocument();
      expect(getEditor()).toHaveAccessibleDescription("Error: Write something first.");
    });

    it("gives the error an icon that is hidden from screen readers", () => {
      const { container } = render(<RichText label="Message" invalid error="Write something first." />);
      const icon = container.querySelector(".rich-text__error svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("hides the error when the field is valid", () => {
      render(<RichText label="Message" error="Write something first." />);
      expect(getEditor()).toBeInTheDocument();
      expect(screen.queryByText("Write something first.")).toBeNull();
    });

    it("shows the error again when invalid turns on later", () => {
      const { rerender } = render(<RichText label="Message" error="Write something first." />);
      expect(getEditor()).toBeInTheDocument();
      expect(screen.queryByText("Write something first.")).toBeNull();
      rerender(<RichText label="Message" error="Write something first." invalid />);
      expect(screen.getByText("Write something first.")).toBeInTheDocument();
      expect(getEditor()).toHaveAccessibleDescription("Error: Write something first.");
    });

    it("is invalid with no error text without breaking", () => {
      const { container } = render(<RichText label="Message" invalid />);
      expect(getEditor()).toHaveAttribute("aria-invalid", "true");
      expect(container.querySelector(".rich-text__error")).toBeNull();
    });

    it("reads the description and the error together", () => {
      render(<RichText label="Message" description="Markdown works too." invalid error="Write something first." />);
      expect(getEditor()).toHaveAccessibleDescription("Markdown works too. Error: Write something first.");
    });

    it("keeps its own description and error linked when given an aria-describedby", () => {
      render(
        <>
          <p id="extra">Be kind.</p>
          <RichText label="Message" aria-describedby="extra" description="Markdown works too." invalid error="Write something first." />
        </>,
      );
      expect(getEditor()).toHaveAccessibleDescription(expect.stringContaining("Be kind."));
      expect(getEditor()).toHaveAccessibleDescription(expect.stringContaining("Markdown works too."));
      expect(getEditor()).toHaveAccessibleDescription(expect.stringContaining("Write something first."));
    });
  });

  describe("in a form", () => {
    const submitted = (form: HTMLFormElement) => [...new FormData(form).entries()];

    it("submits its markdown under its name", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RichText label="Message" name="message" />
        </form>,
      );
      act(() => getEditor().focus());
      await user.keyboard("hi ");
      await user.click(button("Bold"));
      await user.keyboard("there");
      expect(submitted(container.querySelector("form")!)).toEqual([["message", "hi **there**"]]);
    });

    it("submits its defaultValue in its own markdown", () => {
      const { container } = render(
        <form>
          <RichText label="Message" name="message" defaultValue="__b__ and _i_" />
        </form>,
      );
      expect(submitted(container.querySelector("form")!)).toEqual([["message", "**b** and *i*"]]);
    });

    it("submits nothing without a name", () => {
      const { container } = render(
        <form>
          <RichText label="Message" defaultValue="hi" />
        </form>,
      );
      expect(getEditor()).toHaveTextContent("hi");
      expect(hiddenInput(container)).toBeNull();
      expect(submitted(container.querySelector("form")!)).toEqual([]);
    });

    it("submits a read-only value", () => {
      const { container } = render(
        <form>
          <RichText label="Message" name="message" defaultValue="hi" readOnly />
        </form>,
      );
      expect(submitted(container.querySelector("form")!)).toEqual([["message", "hi"]]);
    });

    it("does not submit when disabled", () => {
      const { container } = render(
        <form>
          <RichText label="Message" name="message" defaultValue="hi" disabled />
        </form>,
      );
      expect(hiddenInput(container)).toHaveValue("hi");
      expect(submitted(container.querySelector("form")!)).toEqual([]);
    });

    it("goes back to its defaultValue when the form is reset", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RichText label="Message" name="message" defaultValue="start" />
        </form>,
      );
      act(() => getEditor().focus());
      await user.keyboard("new ");
      expect(hiddenInput(container)).toHaveValue("new start");
      act(() => container.querySelector("form")!.reset());
      expect(getEditor()).toHaveTextContent(/^start$/);
      expect(submitted(container.querySelector("form")!)).toEqual([["message", "start"]]);
    });

    it("is reset by a form it sits outside of, through form", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <form id="reply" />
          <RichText label="Message" name="message" form="reply" />
        </>,
      );
      act(() => getEditor().focus());
      await user.keyboard("typed");
      expect(hiddenInput(container)).toHaveValue("typed");
      act(() => container.querySelector("form")!.reset());
      expect(hiddenInput(container)).toHaveValue("");
    });

    it("submits with a form it sits outside of, through form", () => {
      const { container } = render(
        <>
          <form id="reply" />
          <RichText label="Message" name="message" defaultValue="hi" form="reply" />
        </>,
      );
      expect(submitted(container.querySelector("form")!)).toEqual([["message", "hi"]]);
    });
  });

  describe("focus events and refs", () => {
    it("calls onFocus and onBlur for the field, not for the toolbar", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <>
          <RichText label="Message" onFocus={onFocus} onBlur={onBlur} />
          <button type="button">After</button>
        </>,
      );
      await user.tab();
      expect(button("Bold")).toHaveFocus();
      expect(onFocus).not.toHaveBeenCalled();
      await user.tab();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();
      await user.tab();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("forwards ref to the editable element", () => {
      const ref = createRef<HTMLDivElement>();
      render(<RichText label="Message" ref={ref} />);
      expect(ref.current).toBe(getEditor());
    });

    it("lets the ref focus the field", () => {
      const ref = createRef<HTMLDivElement>();
      render(<RichText label="Message" ref={ref} />);
      act(() => ref.current!.focus());
      expect(getEditor()).toHaveFocus();
    });
  });

  describe("types", () => {
    it("requires a visible label, an aria-label, or an aria-labelledby", () => {
      expectTypeOf<{ label: string }>().toExtend<RichTextProps>();
      expectTypeOf<{ "aria-label": string }>().toExtend<RichTextProps>();
      expectTypeOf<{ "aria-labelledby": string }>().toExtend<RichTextProps>();
      expectTypeOf<object>().not.toExtend<RichTextProps>();
      expectTypeOf<{ description: string }>().not.toExtend<RichTextProps>();
      expectTypeOf<{ label: undefined }>().not.toExtend<RichTextProps>();
      expectTypeOf<{ label: null }>().not.toExtend<RichTextProps>();
      expectTypeOf<{ label: string | undefined }>().not.toExtend<RichTextProps>();
    });

    it("takes no children, since its content is its value", () => {
      expectTypeOf<RichTextProps>().not.toHaveProperty("children");
    });

    it("has no resize handle and no input-only attributes", () => {
      expectTypeOf<RichTextProps>().not.toHaveProperty("resize");
      expectTypeOf<RichTextProps>().not.toHaveProperty("type");
      expectTypeOf<RichTextProps>().not.toHaveProperty("maxLength");
    });

    it("takes no event handlers or input attributes it couldn't honor, other than its own", () => {
      expectTypeOf<RichTextProps>().not.toHaveProperty("onKeyDown");
      expectTypeOf<RichTextProps>().not.toHaveProperty("onChange");
      expectTypeOf<RichTextProps>().not.toHaveProperty("onInput");
      expectTypeOf<RichTextProps>().not.toHaveProperty("tabIndex");
      expectTypeOf<RichTextProps>().not.toHaveProperty("inputMode");
      expectTypeOf<RichTextProps>().not.toHaveProperty("enterKeyHint");
      expectTypeOf<RichTextProps>().not.toHaveProperty("autoFocus");
      expectTypeOf<RichTextProps>().not.toHaveProperty("contentEditable");
      expectTypeOf<{ label: string; title: string; "data-testid": string }>().toExtend<RichTextProps>();
      expectTypeOf<RichTextProps>().toHaveProperty("onFocus");
      expectTypeOf<RichTextProps>().toHaveProperty("onBlur");
      expectTypeOf<RichTextProps>().toHaveProperty("onValueChange");
    });

    it("only accepts the two sizes, and counts rows in numbers", () => {
      expectTypeOf<RichTextProps["size"]>().toEqualTypeOf<RichTextSize | undefined>();
      expectTypeOf<RichTextSize>().toEqualTypeOf<"md" | "lg">();
      expectTypeOf<RichTextProps["rows"]>().toEqualTypeOf<number | undefined>();
      expectTypeOf<RichTextProps["maxRows"]>().toEqualTypeOf<number | undefined>();
    });

    it("takes markdown strings and reports only the markdown", () => {
      expectTypeOf<RichTextProps["value"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<RichTextProps["defaultValue"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<NonNullable<RichTextProps["onValueChange"]>>().parameters.toEqualTypeOf<[markdown: string]>();
    });

    it("types the ref as the editable div, and focus events as native ones", () => {
      expectTypeOf<RichTextProps["ref"]>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>();
      expectTypeOf<NonNullable<RichTextProps["onFocus"]>>().parameter(0).toEqualTypeOf<FocusEvent>();
      expectTypeOf<RichTextProps["className"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<RichTextProps["description"]>().toEqualTypeOf<ReactNode>();
    });
  });

  describe("dev warnings", () => {
    it("warns when the label is empty and there's no other name", () => {
      render(<RichText label="" />);
      expect(getEditor()).toBeInTheDocument();
      expect(takeWarnings()).toEqual([
        "[design-system] RichText: has no accessible name, so screen readers announce it without one. Give it a label or an aria-label.",
      ]);
    });
  });
});
