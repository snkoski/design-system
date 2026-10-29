import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useLayoutEffect, useState } from "react";
import type { FormEventHandler, HTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { cx } from "../../internal/cx";
import { hasContent } from "../../internal/warn";
import { DialogClose } from "./DialogClose";

/* Pieces Dialog and AlertDialog have in common. Not exported from the package. */

export type DialogSize = "sm" | "md" | "lg";

/** Why a dialog is opening or closing, passed to `onOpenChange`. Call `cancel()` on it to stop the change. */
export type DialogChangeDetails = BaseDialog.Root.ChangeEventDetails;

export interface SharedProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children" | "onSubmit"> {
  /** The heading at the top. It names the dialog for screen readers, so it's required. */
  title: Exclude<ReactNode, undefined | null | boolean>;
  /** A sentence under the title, read out with it when the dialog opens. Inline content only: it renders in a `<p>`. */
  description?: ReactNode;
  /** The body. It scrolls on its own when the dialog reaches the screen's height, while the title and actions stay. */
  children?: ReactNode;
  /**
   * The button that opens the dialog: a `Button`, never a `ButtonLink` or another link (opening a dialog is an action,
   * not a page to go to). Leave it out to open the dialog from elsewhere with `open`.
   */
  trigger?: ReactElement;
  /** Whether the dialog is open, for a controlled dialog. Use with `onOpenChange`. */
  open?: boolean;
  /** Whether the dialog starts open, for an uncontrolled dialog. Default: `false`. */
  defaultOpen?: boolean;
  /**
   * Called when the dialog asks to open or close. `details.reason` says why: `trigger-press`, `outside-press`,
   * `escape-key`, `close-press`, `focus-out`, `imperative-action`, or `none`. Call `details.cancel()` to keep it as it
   * is, such as while a save is running or when closing would lose unsaved changes.
   */
  onOpenChange?: (open: boolean, details: DialogChangeDetails) => void;
  /** Called once the open or close animation has finished. */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Makes the body and the actions one form, so pressing Enter in a field or a `type="submit"` button in `actions`
   * submits it. Called with the submit event. It doesn't close the dialog or prevent the default: the handler decides.
   */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** The dialog's width: `sm` (400px), `md` (600px), or `lg` (800px). On a narrow screen it fills the width, less a gutter. */
  size?: DialogSize;
  /**
   * Where the dialog is rendered. Default: the end of `<body>`. Pass an element for a dialog inside a themed part of the
   * page or a shadow root. A ref works only if it's set before the dialog opens, so for a dialog that starts open, pass
   * the element itself.
   */
  container?: BaseDialog.Portal.Props["container"];
  /** Where focus goes when the dialog opens. Default: the first field or button inside it, or the dialog itself when opened by touch. */
  initialFocus?: BaseDialog.Popup.Props["initialFocus"];
  /** Where focus goes when the dialog closes. Default: the trigger. Set it when the trigger is gone by then, such as a menu item. */
  finalFocus?: BaseDialog.Popup.Props["finalFocus"];
  /** Added to the window's own class. It reaches the window, not the backdrop or the viewport around it. */
  className?: string;
  /** The window's `<div role="dialog">`, not the backdrop or the viewport around it. */
  ref?: Ref<HTMLDivElement>;
}

/** Elements a keyboard can reach, to tell whether a scrolling body has anything inside it to Tab to */
const FOCUSABLE = "a[href], button:not(:disabled), input:not(:disabled):not([type='hidden']), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1']), [contenteditable='true']";

/**
 * Whether the body scrolls with nothing inside it to Tab to. Then the body itself has to take focus, or keyboard users
 * can't scroll it. With a field or a link inside, Tab reaches that and scrolls it into view, so the body stays out of
 * the tab order, and Base UI's first focus still lands on the first field or button.
 */
function useNeedsFocus(body: HTMLDivElement | null) {
  const [needsFocus, setNeedsFocus] = useState(false);
  // Runs after every render: the content may have changed, and a ResizeObserver only sees the elements it was given
  useLayoutEffect(() => {
    if (!body) return;
    const check = () => setNeedsFocus(body.scrollHeight > body.clientHeight && !body.querySelector(FOCUSABLE));
    const observer = new ResizeObserver(check);
    observer.observe(body);
    for (const child of body.children) observer.observe(child);
    check();
    return () => observer.disconnect();
  });
  return needsFocus;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * Everything inside Dialog's or AlertDialog's Root: the backdrop, the window, its title, description, body, and
 * actions, and the close button when there's a `closeLabel`. AlertDialog's parts are Dialog's, apart from Root and
 * Trigger, so both use these.
 */
export function Frame({
  title,
  description,
  children,
  actions,
  closeLabel,
  onSubmit,
  size,
  container,
  initialFocus,
  finalFocus,
  className,
  ref,
  ...rest
}: Omit<SharedProps, "trigger" | "open" | "defaultOpen" | "onOpenChange" | "onOpenChangeComplete"> & {
  actions?: ReactNode;
  closeLabel?: string;
}) {
  // State, not a ref: the portal mounts the body after this renders, and setting it renders again to check it
  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const needsFocus = useNeedsFocus(body);
  const content = (
    <>
      {children !== undefined && children !== null && (
        <div ref={setBody} className="dialog__body" tabIndex={needsFocus ? 0 : undefined}>
          {children}
        </div>
      )}
      {actions && <div className="dialog__actions">{actions}</div>}
    </>
  );
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop className="dialog__backdrop" />
      <BaseDialog.Viewport className="dialog__viewport">
        <BaseDialog.Popup
          {...rest}
          ref={ref}
          className={cx("dialog", className)}
          data-size={size}
          // Base UI hides the rest of the page itself; this says so too. Without it, axe doesn't count an alert dialog
          // as modal, and flags Base UI's hidden focus guards around it.
          aria-modal="true"
          initialFocus={initialFocus}
          finalFocus={finalFocus}
        >
          <div className="dialog__header">
            {/* An empty title would still be what names the dialog, over any aria-label, so it's left out */}
            {hasContent(title) && <BaseDialog.Title className="dialog__title">{title}</BaseDialog.Title>}
            {description && <BaseDialog.Description className="dialog__description">{description}</BaseDialog.Description>}
          </div>
          {onSubmit ? (
            <form className="dialog__form" onSubmit={onSubmit}>
              {content}
            </form>
          ) : (
            content
          )}
          {/* Last in the HTML, so the first focus lands on a field or "Cancel"; CSS puts it in the top corner */}
          {closeLabel !== undefined && (
            <DialogClose className="dialog__close" variant="ghost" size="sm" iconOnly aria-label={closeLabel}>
              <CloseIcon />
            </DialogClose>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}
