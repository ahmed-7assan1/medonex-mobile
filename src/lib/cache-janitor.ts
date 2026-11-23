import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import {
  NOTE_NAME,
  SESSION_DIRS,
  isStaleLectureNote,
  isStaleSessionEntry,
} from "./cache-policy";

async function sweepSessionDir(
  path: string,
  nowMs: number,
  depth: number
): Promise<number> {
  if (depth > 4) return 0;
  const names = await FS.readDirectoryAsync(path).catch(() => null);
  if (!names) return 0;
  let removed = 0;
  for (const name of names) {
    const child = path + name;
    const info = await FS.getInfoAsync(child).catch(() => null);
    if (!info || !info.exists) continue;
    if (info.isDirectory) {
      removed += await sweepSessionDir(child + "/", nowMs, depth + 1);
      // Remove the directory itself once empty or fully stale.
      await FS.deleteAsync(child, { idempotent: true })
        .then(() => {})
        .catch(() => {});
      // empty-dir removal only; files keep their age check
    } else if (isStaleSessionEntry(info.modificationTime, nowMs)) {
      await FS.deleteAsync(child, { idempotent: true })
        .then(() => {
          removed += 1;
        })
        .catch(() => {});
    }
  }
  return removed;
}

/**
 * Cold-start cleanup of caches that grow without bound:
 * - cacheDirectory/offline-share: a full copy of an offline file made on
 *   every "open/share" and never deleted (one per share).
 * - cacheDirectory/pdf-viewer: one directory per in-app PDF view, deleted on
 *   close but leaked whenever the process dies mid-view.
 * - cacheDirectory/lecture-notes-*: exported notes older than 24h.
 * Offline downloads (user-chosen, under the documents folder) are NOT
 * touched here.
 */
export async function purgeStaleCaches(
  nowMs: number = Date.now()
): Promise<{ sessions: number; notes: number }> {
  const result = { sessions: 0, notes: 0 };
  if (Platform.OS === "web" || !FS.cacheDirectory) return result;
  const cache = FS.cacheDirectory;
  for (const dir of SESSION_DIRS) {
    result.sessions += await sweepSessionDir(cache + dir + "/", nowMs, 0);
  }
  const names = await FS.readDirectoryAsync(cache).catch(() => [] as string[]);
  for (const name of names) {
    if (!NOTE_NAME.test(name)) continue;
    const info = await FS.getInfoAsync(cache + name).catch(() => null);
    if (
      info &&
      info.exists &&
      !info.isDirectory &&
      isStaleLectureNote(name, info.modificationTime, nowMs)
    ) {
      await FS.deleteAsync(cache + name, { idempotent: true })
        .then(() => {
          result.notes += 1;
        })
        .catch(() => {});
    }
  }
  return result;
}
