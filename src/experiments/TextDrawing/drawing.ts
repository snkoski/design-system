/**
 * Turns typed text into a picture: one cell per character, in the same row and column it was typed in. Which
 * character makes which kind of cell is the one table below, so a new kind is one more line.
 */

/** `glow` changes color as the mouse comes near, `still` never changes, and `gap` leaves its place empty */
export type CellKind = "glow" | "still" | "gap";

export const KINDS: Record<string, CellKind | undefined> = {
  "=": "glow",
  "-": "still",
  ".": "gap",
};

export interface Cell {
  /** The character as typed */
  character: string;
  /** What it draws, or `unknown` for a character not in KINDS (a space, say) */
  kind: CellKind | "unknown";
  /** Counted from 0 at the top */
  row: number;
  /** Counted from 0 at the left */
  column: number;
}

export interface Drawing {
  /** Every character, gaps included, in reading order */
  cells: Cell[];
  /** How many lines were typed */
  rows: number;
  /** The longest line's length, so a short line leaves the rest of its row empty */
  columns: number;
}

export function parseDrawing(text: string): Drawing {
  const lines = text.split(/\r?\n/);
  const cells = lines.flatMap((line, row) =>
    [...line].map((character, column): Cell => ({ character, kind: KINDS[character] ?? "unknown", row, column })),
  );
  return { cells, rows: lines.length, columns: Math.max(0, ...lines.map((line) => [...line].length)) };
}
