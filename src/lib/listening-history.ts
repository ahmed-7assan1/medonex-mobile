import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import {readJsonFile,writeJsonFile} from "./atomic-json";
export type ListeningProgress = { time: number; duration: number; at: number };
export type ListeningBookmark = { time: number; note: string };
export type ListeningHistory = Record<string, { progress?: ListeningProgress; bookmarks?: ListeningBookmark[] }>;
export const MIN_RESUME_SECONDS = 5;
export const isListeningComplete = (p?: ListeningProgress) => !!p && p.duration > 0 && p.time / p.duration >= .95;
export const listeningRatio = (p?: ListeningProgress) => p && p.duration > 0 ? Math.min(1, Math.max(0, p.time / p.duration)) : 0;
export function listeningTime(t: number) { const s = Math.max(0, Math.floor(Number.isFinite(t) ? t : 0)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`; }
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
export function normalizeListeningHistory(raw: unknown): ListeningHistory {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: ListeningHistory = {};
  for (const [id, value] of Object.entries(raw).slice(-500)) {
    if (!id || id.length > 512 || ["__proto__", "constructor", "prototype"].includes(id) || !value || typeof value !== "object") continue;
    const record = value as any, entry: ListeningHistory[string] = {};
    if (finite(record.progress?.time) && finite(record.progress?.duration)) entry.progress = { time: record.progress.time, duration: record.progress.duration, at: finite(record.progress.at) ? record.progress.at : 0 };
    if (Array.isArray(record.bookmarks)) entry.bookmarks = record.bookmarks.slice(0, 500).filter((b: any) => finite(b?.time)).map((b: any) => ({ time: b.time, note: typeof b.note === "string" ? b.note.slice(0, 500) : "" })).sort((a: ListeningBookmark, b: ListeningBookmark) => a.time - b.time);
    result[id] = entry;
  }
  return result;
}
const key = (scope: string) => "listening-v1-" + encodeURIComponent(scope.slice(0, 256));
export async function readListeningHistory(scope: string): Promise<ListeningHistory> {
  const name = key(scope);
  const raw = Platform.OS === "web" ? localStorage.getItem(name) : JSON.stringify(await readJsonFile(FS.documentDirectory + name + ".json")); if(raw&&raw.length>2_000_000)throw Error("Saved listening history is too large.");return raw?normalizeListeningHistory(JSON.parse(raw)):{};
}
const queues = new Map<string, Promise<void>>();
export function writeListeningHistory(scope: string, history: ListeningHistory): Promise<void> {
  const name = key(scope), value = JSON.stringify(normalizeListeningHistory(history));
  const pending = (queues.get(name) ?? Promise.resolve()).catch(() => {}).then(async () => { if(value.length>2_000_000)throw Error("On-device listening history is full."); if (Platform.OS === "web") localStorage.setItem(name, value); else await writeJsonFile(FS.documentDirectory + name + ".json",JSON.parse(value)); });
  queues.set(name, pending); void pending.finally(() => { if (queues.get(name) === pending) queues.delete(name); }).catch(() => {}); return pending;
}
