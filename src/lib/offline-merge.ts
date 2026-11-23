// Pure helpers for merging offline-download indexes (e.g. adopting files a
// guest saved before signing in). Kept separate so unit tests can transpile
// this file without pulling in expo-file-system or react-query.
export type OfflineRecord = { id: string };

/**
 * Merge incoming offline records into the existing index. Records are keyed
 * by file id: an incoming record whose id already exists locally is dropped
 * (the local copy wins), the rest move. Merged order keeps newest first:
 * moved incoming records, then existing records.
 */
export function mergeOfflineRecords<T extends OfflineRecord>(
  existing: T[],
  incoming: T[]
): { merged: T[]; move: T[]; drop: T[] } {
  const seen = new Set(existing.map((item) => item.id));
  const move = incoming.filter((item) => !seen.has(item.id));
  const drop = incoming.filter((item) => seen.has(item.id));
  return { merged: [...move, ...existing], move, drop };
}
