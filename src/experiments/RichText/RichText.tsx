import { Field } from "@base-ui/react/field";
import { Popover } from "@base-ui/react/popover";
import { Toggle } from "@base-ui/react/toggle";
import { Toolbar } from "@base-ui/react/toolbar";
import { Tooltip } from "@base-ui/react/tooltip";
import { Selection } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import type { ChainedCommands, Editor } from "@tiptap/react";
import { Bold, Code, Italic, Link, List, ListOrdered, SquareCode, Strikethrough, TextQuote, Underline } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, HTMLAttributes, ReactNode, Ref } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { cx } from "../../internal/cx";
import { FieldError } from "../../internal/FieldError";
import { warnIfUnnamed } from "../../internal/warn";
import { markSelection, normalizeHref, richTextExtensions, toMarkdown, unmarkSelection } from "./markdown";
import "./rich-text.css";

export type RichTextSize = "md" | "lg";

/**
 * A rich text field needs a name a screen reader can announce: a visible label, an `aria-label`, or the id of
 * an element that names it (`aria-labelledby`).
 */
type Labelled =
  | {
      /** The visible label above the field. Required unless `aria-label` or `aria-labelledby` is set. */
      label: Exclude<ReactNode, undefined | null | boolean>;
      /** Names the field for screen readers. Usually not needed when there is a `label`, which names it already. */
      "aria-label"?: string;
      /** The id of an element that names the field. Replaces the `label` as its name. */
      "aria-labelledby"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` or `aria-labelledby` is set. */
      label?: undefined;
      /** Names the field for screen readers when there's no visible label. Required without `label` or `aria-labelledby`. */
      "aria-label": string;
      /** The id of an element that names the field. */
      "aria-labelledby"?: string;
    }
  | {
      /** The visible label above the field. Required unless `aria-label` or `aria-labelledby` is set. */
      label?: undefined;
      /** Names the field for screen readers. */
      "aria-label"?: string;
      /** The id of an element that names the field, when there's no visible label. Required without `label` or `aria-label`. */
      "aria-labelledby": string;
    };

interface OwnProps {
  /** Type size and inner padding, matching Input's sizes so the two line up in a form. Default: `md`. */
  size?: RichTextSize;
  /** How many lines tall it starts. Default: 1. */
  rows?: number;
  /** How many lines it grows to as you type before it scrolls. Never less than `rows`. Default: 4. */
  maxRows?: number;
  /**
   * The content, as markdown. Use with `onValueChange` to control it. When it changes, it replaces what's in the
   * field (not as an undo step, and the caret moves to the end). The field keeps what people type even if you
   * don't pass the new value back.
   */
  value?: string;
  /** The markdown the field starts with, when you don't control it. */
  defaultValue?: string;
  /**
   * Called after every edit with the new markdown. The field writes markdown its own way: `__bold__` comes back
   * as `**bold**`, headings as plain paragraphs, and links other than web and email addresses as their text. Not
   * called when the field first loads or when `value` replaces the content.
   */
  onValueChange?: (markdown: string) => void;
  /** Help text between the label and the field, read before typing. Linked to the field for screen readers. */
  description?: ReactNode;
  /** The message shown under the field when `invalid` is true, with an icon. Linked to the field. */
  error?: ReactNode;
  /** Marks the field as failing validation. Pair it with `error` so the problem is in words, not just color. */
  invalid?: boolean;
  /** Blocks typing and formatting, and removes the field and its toolbar from the tab order. Not submitted. */
  disabled?: boolean;
  /** Keeps the field focusable, readable, and submitted, but blocks changes and hides the toolbar. Its links can be followed. */
  readOnly?: boolean;
  /**
   * Tells assistive technology that the field must be filled in. The browser doesn't check it, so check the value
   * yourself and set `invalid` and `error`. Say it's required in the label too, in words.
   */
  required?: boolean;
  /** Identifies the field when the form is submitted. The form gets the markdown. */
  name?: string;
  /** The id of a `<form>` to submit with, when the field sits outside that form. */
  form?: string;
  /** The id of the editable element. */
  id?: string;
  /** Example text shown while the field is empty. Never a substitute for the label: it disappears as you type. */
  placeholder?: string;
  /** Called when the editable area gets focus. Not called when the toolbar does. */
  onFocus?: (event: FocusEvent) => void;
  /** Called when the editable area loses focus. Not called when the toolbar does. */
  onBlur?: (event: FocusEvent) => void;
  /** Help text linked to the field, added to its description and error rather than replacing them. */
  "aria-describedby"?: string;
  /** Applied to the outer wrapper, so it's the place for layout classes such as margin or width. */
  className?: string;
  /** Reaches the editable element (the one with `role="textbox"`), for focusing it. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * What else reaches the outer wrapper: plain attributes such as `title` or `data-*`. No event handlers: the link
 * editor's inputs sit inside the wrapper in React's tree, so a wrapper's onKeyDown would also see Enter pressed
 * in "Link address". And no attributes that belong on an editable element, which do nothing on the wrapper.
 */
type WrapperAttributes = {
  [Key in keyof HTMLAttributes<HTMLDivElement> as Key extends `on${string}` ? never : Key]: HTMLAttributes<HTMLDivElement>[Key];
};
type NotOnTheWrapper =
  | "children"
  | "defaultValue"
  | "aria-label"
  | "aria-labelledby"
  | "tabIndex"
  | "inputMode"
  | "enterKeyHint"
  | "autoFocus"
  | "autoCapitalize"
  | "autoCorrect"
  | "contentEditable"
  | "spellCheck";

export type RichTextProps = Labelled & OwnProps & Omit<WrapperAttributes, NotOnTheWrapper | keyof OwnProps>;

type Modifier = "Shift" | "Alt";

/** A toolbar button: what it's called, its icon, its shortcut (always with Mod), and what it does. */
interface Tool {
  label: string;
  icon: LucideIcon;
  keys: [...Modifier[], string];
  isActive: (editor: Editor) => boolean;
  run: (chain: ChainedCommands) => ChainedCommands;
}

const TEXT_STYLE: Tool[] = [
  { label: "Bold", icon: Bold, keys: ["B"], isActive: (e) => e.isActive("bold"), run: (c) => c.toggleBold() },
  { label: "Italic", icon: Italic, keys: ["I"], isActive: (e) => e.isActive("italic"), run: (c) => c.toggleItalic() },
  { label: "Underline", icon: Underline, keys: ["U"], isActive: (e) => e.isActive("underline"), run: (c) => c.toggleUnderline() },
  { label: "Strikethrough", icon: Strikethrough, keys: ["Shift", "S"], isActive: (e) => e.isActive("strike"), run: (c) => c.toggleStrike() },
];

const INLINE_CODE: Tool = { label: "Inline code", icon: Code, keys: ["E"], isActive: (e) => e.isActive("code"), run: (c) => c.toggleCode() };

/**
 * Whether every line in the selection sits inside a block of this type. Tiptap's isActive misses this when the
 * whole field is selected (Mod-A), so a Quote button would show off right after quoting everything.
 */
function inBlock(editor: Editor, type: string) {
  const { doc, selection } = editor.state;
  let lines = 0;
  let inside = 0;
  doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (!node.isTextblock) return true;
    lines += 1;
    const $line = doc.resolve(pos + 1);
    for (let depth = $line.depth; depth > 0; depth -= 1) {
      if ($line.node(depth).type.name === type) {
        inside += 1;
        break;
      }
    }
    return false;
  });
  return lines > 0 && inside === lines;
}

const BLOCKS: Tool[] = [
  { label: "Quote", icon: TextQuote, keys: ["Shift", "B"], isActive: (e) => inBlock(e, "blockquote"), run: (c) => c.toggleBlockquote() },
  { label: "Bulleted list", icon: List, keys: ["Shift", "8"], isActive: (e) => inBlock(e, "bulletList"), run: (c) => c.toggleBulletList() },
  { label: "Numbered list", icon: ListOrdered, keys: ["Shift", "7"], isActive: (e) => inBlock(e, "orderedList"), run: (c) => c.toggleOrderedList() },
  { label: "Code block", icon: SquareCode, keys: ["Alt", "C"], isActive: (e) => inBlock(e, "codeBlock"), run: (c) => c.toggleCodeBlock() },
];

const TOOLS = [...TEXT_STYLE, INLINE_CODE, ...BLOCKS];
const LINK_KEYS: Tool["keys"] = ["K"];

/** Mod is Cmd on a Mac and Ctrl elsewhere. Read after mounting, so the server and the first render agree. */
function useIsMac() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setIsMac(/mac/i.test(nav.userAgentData?.platform ?? nav.platform ?? ""));
  }, []);
  return isMac;
}

/** The shortcut as `aria-keyshortcuts` wants it (`Control+Shift+S`) and as people read it (`Ctrl+Shift+S`, `⌘⇧S`). */
function shortcut(keys: Tool["keys"], isMac: boolean) {
  const aria = [isMac ? "Meta" : "Control", ...keys].join("+");
  const symbols: Record<string, string> = { Shift: "⇧", Alt: "⌥" };
  const label = isMac ? `⌘${keys.map((key) => symbols[key] ?? key).join("")}` : ["Ctrl", ...keys].join("+");
  return { aria, label };
}

interface ActiveFormats {
  tools: boolean[];
  link: boolean;
}

const NOTHING_ACTIVE: ActiveFormats = { tools: TOOLS.map(() => false), link: false };

/**
 * Which formats are on where the caret is, for the toolbar's pressed states. Read when the editor starts and
 * after every change or caret move. (Tiptap's useEditorState only updates after the first change, so the
 * buttons were wrong until something was typed or clicked.)
 */
function useActiveFormats(editor: Editor | null) {
  const [active, setActive] = useState(NOTHING_ACTIVE);
  useEffect(() => {
    if (!editor) return;
    const update = () =>
      setActive((previous) => {
        const next = { tools: TOOLS.map((tool) => tool.isActive(editor)), link: editor.isActive("link") };
        const same = next.link === previous.link && next.tools.every((on, index) => on === previous.tools[index]);
        return same ? previous : next;
      });
    update();
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);
  return active;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** A rem-sized token in pixels, for the popup offsets Base UI takes as numbers. */
function tokenPx(name: string) {
  const root = document.documentElement;
  const rem = parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  return rem * (parseFloat(getComputedStyle(root).fontSize) || 16);
}

const sideOffset = () => tokenPx("--space-2");

/** One toolbar button, with a tooltip that shows its name and shortcut on hover and on keyboard focus. */
function ToolButton({
  label,
  icon: Icon,
  keys,
  isMac,
  disabled,
  pressed,
  onPress,
  trigger,
}: {
  label: string;
  icon: LucideIcon;
  keys: Tool["keys"];
  isMac: boolean;
  disabled: boolean;
  /** Toggles have a pressed state; the link button opens its popover instead. */
  pressed?: boolean;
  onPress?: () => void;
  /** Replaces the toggle, for the link button's popover trigger. */
  trigger?: React.ReactElement;
}) {
  const keyshortcut = shortcut(keys, isMac);
  const element = trigger ?? <Toggle pressed={pressed} onPressedChange={() => onPress?.()} />;
  return (
    <Tooltip.Root disabled={disabled}>
      <Tooltip.Trigger
        render={<Toolbar.Button render={element} disabled={disabled} focusableWhenDisabled={false} />}
        className="rich-text__tool"
        type="button"
        aria-label={label}
        aria-keyshortcuts={keyshortcut.aria}
        // The field keeps focus and its selection when a button is clicked, so typing carries on
        onMouseDown={(event) => event.preventDefault()}
      >
        <Icon aria-hidden="true" focusable="false" className="rich-text__icon" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={sideOffset}>
          <Tooltip.Popup className="rich-text__tooltip">
            {label} <kbd className="rich-text__shortcut">{keyshortcut.label}</kbd>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** The link editor inside the popover: an address, the text when nothing is selected, and save and remove. */
function LinkForm({
  editor,
  editing,
  needsText,
  initialHref,
  addressRef,
  textRef,
  onDone,
}: {
  editor: Editor;
  editing: boolean;
  needsText: boolean;
  initialHref: string;
  addressRef: React.RefObject<HTMLInputElement | null>;
  textRef: React.RefObject<HTMLInputElement | null>;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [href, setHref] = useState(initialHref);
  const [error, setError] = useState<string | null>(null);

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onDone();
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    // React sends a portal's events up its own tree, so this would also submit a form the field sits in
    event.stopPropagation();
    if (href.trim() === "" && editing) return remove();
    const url = normalizeHref(href);
    if (url === null) {
      setError(href.trim() === "" ? "Enter a link address." : "Use a web or email address, such as https://example.com.");
      addressRef.current?.focus();
      return;
    }
    const chain = editor.chain().focus();
    if (needsText) {
      chain
        .insertContent({ type: "text", text: text.trim() || url, marks: [{ type: "link", attrs: { href: url } }] })
        .unsetMark("link"); // so what's typed next isn't part of the link
    } else {
      chain.extendMarkRange("link").setLink({ href: url });
    }
    chain.run();
    onDone();
  };

  return (
    <form className="rich-text__link-form" noValidate onSubmit={save}>
      {needsText && <Input ref={textRef} label="Text" value={text} onValueChange={setText} autoComplete="off" />}
      <Input
        ref={addressRef}
        label="Link address"
        type="url"
        inputMode="url"
        autoComplete="off"
        value={href}
        onValueChange={(value) => {
          setHref(value);
          setError(null);
        }}
        invalid={error !== null}
        error={error}
      />
      <div className="rich-text__link-actions">
        <Button type="submit" size="sm">
          Save link
        </Button>
        {editing && (
          <Button type="button" variant="secondary" size="sm" onClick={remove}>
            Remove link
          </Button>
        )}
      </div>
    </form>
  );
}

/** Puts Base UI's field links (id, name, description, invalid) and the field's state on Tiptap's editable element. */
function EditorSurface({
  editor,
  attributes,
  attributesRef,
}: {
  editor: Editor | null;
  attributes: Record<string, string>;
  attributesRef: React.RefObject<Record<string, string>>;
}) {
  const key = JSON.stringify(attributes);
  useLayoutEffect(() => {
    attributesRef.current = attributes;
    // ProseMirror reads the attributes on every update; this makes it read them now
    if (editor && !editor.isDestroyed) editor.view.updateState(editor.view.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the attributes are compared by value
  }, [editor, key]);
  return <EditorContent editor={editor} className="rich-text__content" />;
}

/**
 * A text field where formatting shows as you type: bold, italic, underline, strikethrough, inline code, links,
 * quotes, lists, and code blocks. Its value is markdown. It starts one line tall and grows as you type, up to
 * `maxRows`, then scrolls. Built on Tiptap for the editing, and Base UI's Field, Toolbar, Toggle, Tooltip, and
 * Popover for everything around it. The toolbar is one Tab stop before the field; the shortcuts work in the field.
 */
export function RichText({
  label,
  description,
  error,
  invalid,
  className,
  style,
  disabled = false,
  readOnly = false,
  required,
  name,
  form,
  id,
  size = "md",
  rows = 1,
  maxRows = 4,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  onFocus,
  onBlur,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  ...rest
}: RichTextProps) {
  warnIfUnnamed("RichText", label, { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby }, "Give it a label or an aria-label.");

  const generatedId = useId();
  const editorId = id ?? `rich-text-${generatedId}`;
  const isMac = useIsMac();
  const editable = !disabled && !readOnly;
  const [markdown, setMarkdown] = useState(value ?? defaultValue ?? "");
  const [linkOpen, setLinkOpen] = useState(false);

  // Callbacks and values the editor reads later, kept current without recreating it
  const latest = useRef({ onValueChange, onFocus, onBlur, placeholder: placeholder ?? "" });
  latest.current = { onValueChange, onFocus, onBlur, placeholder: placeholder ?? "" };
  const lastReported = useRef<string | undefined>(value);
  const attributesRef = useRef<Record<string, string>>({});
  const editorDom = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo(
    () =>
      richTextExtensions({
        placeholder: () => latest.current.placeholder,
        onLinkShortcut: () => setLinkOpen(true), // only called while editable
      }),
    [],
  );
  const editorProps = useMemo(() => ({ attributes: () => attributesRef.current }), []);

  const editor = useEditor({
    extensions,
    content: value ?? defaultValue ?? "",
    contentType: "markdown",
    editable,
    immediatelyRender: false,
    editorProps,
    onUpdate: ({ editor }) => {
      const next = toMarkdown(editor);
      setMarkdown(next);
      if (next === lastReported.current) return;
      lastReported.current = next;
      latest.current.onValueChange?.(next);
    },
    onFocus: ({ event }) => latest.current.onFocus?.(event),
    onBlur: ({ event }) => latest.current.onBlur?.(event),
  });

  const active = useActiveFormats(editor);

  // The field's own markdown from the start, so the form gets what onValueChange would report
  useLayoutEffect(() => {
    if (!editor) return;
    const initial = toMarkdown(editor);
    setMarkdown(initial);
    lastReported.current ??= initial;
  }, [editor]);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, editable]);

  // A new value replaces the content, unless it's the one the field just reported
  useEffect(() => {
    if (!editor || value === undefined || value === lastReported.current) return;
    lastReported.current = value;
    editor
      .chain()
      .setContent(value, { contentType: "markdown", emitUpdate: false })
      .command(({ tr }) => {
        tr.setSelection(Selection.atEnd(tr.doc));
        tr.setMeta("addToHistory", false);
        return true;
      })
      .run();
    setMarkdown(toMarkdown(editor));
  }, [editor, value]);

  // A form reset puts an uncontrolled field back to its defaultValue, as it does a native field. (The hidden
  // input can't do it: a reset leaves a hidden input's value alone.)
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const controlled = value !== undefined;
  useEffect(() => {
    const owner = form ? document.getElementById(form) : rootRef.current?.closest("form");
    if (!editor || controlled || !(owner instanceof HTMLFormElement)) return;
    const reset = () => {
      editor.commands.setContent(defaultRef.current ?? "", { contentType: "markdown", emitUpdate: false });
      const initial = toMarkdown(editor);
      lastReported.current = initial;
      setMarkdown(initial);
    };
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [editor, controlled, form]);

  useLayoutEffect(() => {
    if (!editor) return;
    editorDom.current = editor.view.dom;
    setRef(ref, editor.view.dom as HTMLDivElement);
    return () => setRef(ref, null);
  }, [editor, ref]);

  // While the link editor is open, the field has no focus and the browser hides its selection: mark the text the
  // link will go on, so people can see it
  useEffect(() => {
    if (!editor) return;
    if (linkOpen) markSelection(editor);
    else unmarkSelection(editor);
  }, [editor, linkOpen]);

  const run = (tool: Tool) => {
    if (editor) tool.run(editor.chain().focus()).run();
  };

  const toolbarDisabled = !editable || !editor;
  const linkActive = active.link;
  const linkLabel = linkActive ? "Edit link" : "Add link";

  const fieldAttributes = (fieldProps: Record<string, unknown>) => {
    const attributes: Record<string, string> = {
      role: "textbox",
      "aria-multiline": "true",
      id: editorId,
      class: "rich-text__editor",
    };
    const labelledBy = ariaLabelledby ?? (ariaLabel === undefined ? (fieldProps["aria-labelledby"] as string | undefined) : undefined);
    if (labelledBy) attributes["aria-labelledby"] = labelledBy;
    if (ariaLabel) attributes["aria-label"] = ariaLabel;
    const describedBy = fieldProps["aria-describedby"] as string | undefined;
    if (describedBy) attributes["aria-describedby"] = describedBy;
    if (invalid) attributes["aria-invalid"] = "true";
    if (required) attributes["aria-required"] = "true";
    if (readOnly) {
      attributes["aria-readonly"] = "true";
      attributes.tabindex = "0"; // still reachable, so its text can be read and copied
    }
    if (disabled) attributes["aria-disabled"] = "true";
    if (placeholder) attributes["aria-placeholder"] = placeholder;
    return attributes;
  };

  const rootStyle = {
    ...style,
    "--rich-text-rows": rows,
    "--rich-text-max-rows": Math.max(rows, maxRows),
  } as CSSProperties;

  return (
    <Field.Root
      {...rest}
      ref={rootRef}
      className={cx("rich-text", className)}
      style={rootStyle}
      data-size={size}
      disabled={disabled}
      invalid={invalid}
    >
      {label !== undefined && (
        <Field.Label
          className="rich-text__label"
          nativeLabel={false}
          render={<span />}
          // Base UI's label focuses the field by its id; a disabled field shouldn't take focus
          onClick={(event) => {
            if (disabled) event.preventBaseUIHandler();
          }}
        >
          {label}
        </Field.Label>
      )}
      {description && <Field.Description className="rich-text__description">{description}</Field.Description>}
      <div className="rich-text__box">
        {/* Read-only has no toolbar: none of it could be used, and its absence shows the field can't be changed */}
        {!readOnly && (
          <Tooltip.Provider>
            <Toolbar.Root className="rich-text__toolbar" aria-label="Formatting" aria-controls={editorId}>
              <Toolbar.Group className="rich-text__group" aria-label="Text style" role="group">
                {TEXT_STYLE.map((tool) => (
                  <ToolButton
                    key={tool.label}
                    {...tool}
                    isMac={isMac}
                    disabled={toolbarDisabled}
                    pressed={active.tools[TOOLS.indexOf(tool)] ?? false}
                    onPress={() => run(tool)}
                  />
                ))}
              </Toolbar.Group>
              <Toolbar.Separator className="rich-text__separator" />
              <Toolbar.Group className="rich-text__group" aria-label="Insert" role="group">
                <ToolButton
                  {...INLINE_CODE}
                  isMac={isMac}
                  disabled={toolbarDisabled}
                  pressed={active.tools[TOOLS.indexOf(INLINE_CODE)] ?? false}
                  onPress={() => run(INLINE_CODE)}
                />
                <Popover.Root open={linkOpen} onOpenChange={setLinkOpen}>
                  <ToolButton label={linkLabel} icon={Link} keys={LINK_KEYS} isMac={isMac} disabled={toolbarDisabled} trigger={<Popover.Trigger />} />
                  <Popover.Portal>
                    <Popover.Positioner sideOffset={sideOffset} align="start">
                      <Popover.Popup
                        className="rich-text__link-popup"
                        aria-label="Link"
                        initialFocus={editor?.state.selection.empty && !linkActive ? textRef : addressRef}
                        finalFocus={editorDom}
                      >
                        {editor && (
                          <LinkForm
                            editor={editor}
                            editing={linkActive}
                            needsText={editor.state.selection.empty && !linkActive}
                            initialHref={linkActive ? String(editor.getAttributes("link").href ?? "") : ""}
                            addressRef={addressRef}
                            textRef={textRef}
                            onDone={() => setLinkOpen(false)}
                          />
                      )}
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </Toolbar.Group>
            <Toolbar.Separator className="rich-text__separator" />
            <Toolbar.Group className="rich-text__group" aria-label="Blocks" role="group">
              {BLOCKS.map((tool) => (
                <ToolButton
                  key={tool.label}
                  {...tool}
                  isMac={isMac}
                  disabled={toolbarDisabled}
                  pressed={active.tools[TOOLS.indexOf(tool)] ?? false}
                  onPress={() => run(tool)}
                />
              ))}
            </Toolbar.Group>
          </Toolbar.Root>
        </Tooltip.Provider>
        )}
        {/* Base UI's field control links the label, description, and error, but renders an input. Its render
            function hands over those links, which go on Tiptap's editable element instead. */}
        <Field.Control
          id={editorId}
          aria-describedby={ariaDescribedby}
          render={(fieldProps) => (
            <EditorSurface editor={editor} attributes={fieldAttributes(fieldProps as Record<string, unknown>)} attributesRef={attributesRef} />
          )}
        />
      </div>
      {error && (
        <FieldError className="rich-text__error" match={invalid}>
          {error}
        </FieldError>
      )}
      {name !== undefined && <input type="hidden" name={name} form={form} value={markdown} disabled={disabled} />}
    </Field.Root>
  );
}
