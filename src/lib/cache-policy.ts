// Pure cache-retention policy (no react-native imports) so unit tests can
// transpile and exercise it directly. Used by cache-janitor.ts.

// Exported lecture notes are also swept on every export (annotation-actions);
// the cold-start sweep covers users who never export again.
export const NOTE_NAME = /^lecture-notes-[a-f0-9]{8}\.(pdf|png)$/;
export const NOTE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Per-session cache entries (offline-file share copies, PDF viewer sessions)
// from a previous process are only safe to remove once any share sheet or
// receiving app is long done with them.
export const SESSION_MAX_AGE_MS = 60 * 60 * 1000;
export const SESSION_DIRS = ["offline-share", "pdf-viewer"];

export function isStaleLectureNote(
  name: string,
  modificationTimeSec: number | undefined,
  nowMs: number
): boolean {
  return (
    NOTE_NAME.test(name) &&
    typeof modificationTimeSec === "number" &&
    modificationTimeSec > 0 &&
    modificationTimeSec * 1000 < nowMs - NOTE_MAX_AGE_MS
  );
}

export function isStaleSessionEntry(
  modificationTimeSec: number | undefined,
  nowMs: number
): boolean {
  return (
    typeof modificationTimeSec === "number" &&
    modificationTimeSec > 0 &&
    modificationTimeSec * 1000 < nowMs - SESSION_MAX_AGE_MS
  );
}
