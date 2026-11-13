import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

/** The attributes the system scopes to a subtree, which a portal would otherwise leave behind. */
export interface PortalScope {
  "data-theme"?: string;
  "data-pointer"?: string;
  "data-density"?: string;
  "data-motion"?: string;
  dir?: string;
  lang?: string;
}

const names = ["data-theme", "data-pointer", "data-density", "data-motion", "dir", "lang"] as const;

/** Each scope attribute, from the nearest of the anchor and its ancestors that has it. */
function read(anchor: HTMLElement | null): PortalScope {
  const scope: PortalScope = {};
  if (!anchor) return scope;
  for (const name of names) {
    const value = anchor.closest(`[${name}]`)?.getAttribute(name);
    if (value != null) scope[name] = value;
  }
  return scope;
}

const same = (a: PortalScope, b: PortalScope) => names.every((name) => a[name] === b[name]);

/**
 * A popup portalled to the end of `<body>` leaves behind every attribute the system scopes to a subtree: the theme,
 * pointer mode, density, motion setting, direction, and language. This returns them, read from the anchor's nearest
 * ancestors, for the component to put on its portal element, so the tokens resolve inside the popup as they do around
 * the anchor. It reads them when `open` becomes true, in a layout effect, so the popup's first frame is right, and while
 * open it follows any change to them on the page. Internal: not exported.
 */
export function usePortalScope(anchorRef: RefObject<HTMLElement | null>, open: boolean): PortalScope {
  const [scope, setScope] = useState<PortalScope>({});

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const next = read(anchorRef.current);
      setScope((current) => (same(current, next) ? current : next));
    };
    update();
    const observer = new MutationObserver((mutations) => {
      // A popup's own attributes (React writing these back onto the portal) never change the anchor's scope
      const outside = mutations.some((m) => !(m.target instanceof Element && m.target.closest("[data-base-ui-portal]")));
      if (outside) update();
    });
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: [...names] });
    return () => observer.disconnect();
  }, [anchorRef, open]);

  return scope;
}
