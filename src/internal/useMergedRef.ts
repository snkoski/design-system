import { useCallback } from "react";
import type { MutableRefObject, Ref, RefCallback } from "react";

/**
 * One callback ref that fills a component's own ref and the consumer's `ref` with the same element, for a component
 * that needs the element itself and also hands it on.
 *
 * It returns a cleanup, so React 19 never calls it with `null`, and the cleanup undoes each ref the way React would
 * have: a consumer's callback ref that returned a cleanup has that run, and is never called with `null`; one that
 * returned nothing is called with `null`; an object ref is emptied. When the consumer passes a new `ref`, React runs
 * the cleanup for the old one and calls the new one.
 */
export function useMergedRef<T>(own: MutableRefObject<T | null>, ref: Ref<T> | undefined): RefCallback<T> {
  return useCallback(
    (element: T | null) => {
      own.current = element;
      const cleanup = typeof ref === "function" ? ref(element) : undefined;
      if (ref && typeof ref === "object") ref.current = element;
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}
