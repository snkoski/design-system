import { useEffect, useState } from "react";

/**
 * How long a loading indicator's status region waits, empty, before its text goes in. Screen readers announce a
 * live region's text when it changes, but many miss text that arrives together with the region itself.
 */
export const ANNOUNCE_AFTER = 100;

/**
 * `"server"`: the HTML before JavaScript runs. `"waiting"`: running, the status region still empty. `"announced"`:
 * the status region has its words.
 */
export type AnnouncementPhase = "server" | "waiting" | "announced";

/**
 * When a loading indicator (Spinner, Skeleton) announces itself. It reads `delay` once, when the indicator appears,
 * so the CSS delay and the announcement's timer always agree, and a negative delay counts as none. The phase starts
 * at `"server"`, moves to `"waiting"` once JavaScript runs, and to `"announced"` after the delay or `ANNOUNCE_AFTER`,
 * whichever is longer. Not exported from the package.
 */
export function useLoadingAnnouncement(delay: number): { wait: number; phase: AnnouncementPhase } {
  // Read once, so the CSS delay and the announcement's timer always agree
  const [wait] = useState(() => Math.max(delay, 0));
  const [phase, setPhase] = useState<AnnouncementPhase>("server");

  useEffect(() => {
    setPhase("waiting");
    const timer = setTimeout(() => setPhase("announced"), Math.max(wait, ANNOUNCE_AFTER));
    return () => clearTimeout(timer);
    // Runs once, when the indicator appears, like the CSS animation that hides it until the delay is over
  }, []);

  return { wait, phase };
}
