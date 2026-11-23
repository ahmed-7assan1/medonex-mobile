import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, AppState, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { downloadUrl } from "@/lib/offline-downloads";
import {
  readListeningHistory,
  writeListeningHistory,
  MIN_RESUME_SECONDS,
  isListeningComplete,
  type ListeningHistory,
  type ListeningBookmark,
} from "@/lib/listening-history";
import { LectureAudioEngine, type AudioStatus } from "./LectureAudioEngine";
import { LectureAudioControls } from "./LectureAudioControls";
export type LectureAudioRecord = {
  id: string;
  title: string;
  url: string;
  moduleId: string;
  lectureId: string;
  lectureTitle?: string;
};
type AudioState = {
  current: LectureAudioRecord | null;
  status: AudioStatus;
  playing: boolean;
  sheetOpen: boolean;
  miniVisible: boolean;
  rate: number;
  volume: number;
  loop: boolean;
  history: ListeningHistory;
  loadHistory: () => Promise<ListeningHistory>;
  saveProgress: (id: string, state: AudioStatus) => void;
  play: (record: LectureAudioRecord) => void;
  toggle: () => void;
  seek: (time: number) => void;
  setRate: (n: number) => void;
  setVolume: (n: number) => void;
  setLoop: (v: boolean) => void;
  openSheet: () => void;
  closeSheet: () => void;
  closeMini: () => void;
  addBookmark: () => void;
  editBookmark: (index: number, note: string) => void;
  deleteBookmark: (index: number) => void;
};
const Context = createContext<AudioState | null>(null);
export const useLectureAudio = () => {
  const value = useContext(Context);
  if (!value) throw Error("Lecture audio provider is missing");
  return value;
};
const empty: AudioStatus = {
  playing: false,
  time: 0,
  duration: 0,
  failed: false,
};
/** Root-owned decoder survives page/tab navigation; identity changes destroy it. */
export function LectureAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isGuest } = useAuth(),
    scope = !isGuest && token && user?.id ? user.id : "";
  return (
    <AccountAudio key={scope || "guest"} scope={scope}>
      {children}
    </AccountAudio>
  );
}
function AccountAudio({
  scope,
  children,
}: {
  scope: string;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<LectureAudioRecord | null>(null),
    [status, setStatus] = useState<AudioStatus>(empty),
    [wanted, setWanted] = useState(false),
    [sheetOpen, setSheetOpen] = useState(false),
    [dismissed, setDismissed] = useState(false),
    [rate, setRate] = useState(1),
    [volume, setVolume] = useState(1),
    [loop, setLoop] = useState(false),
    [seekCommand, setSeekCommand] = useState<{ time: number; nonce: number }>(),
    [history, setHistory] = useState<ListeningHistory>({});
  const live = useRef(true),
    currentRef = useRef(current),
    statusRef = useRef(status),
    historyRef = useRef(history),
    resume = useRef(0),
    lastSave = useRef(0),
    request = useRef(0),
    nonce = useRef(0),
    warned = useRef(false),
    readable = useRef(true),
    wasPlaying = useRef(false);
  currentRef.current = current;
  historyRef.current = history;
  statusRef.current = status;
  const hydration = useRef<Promise<ListeningHistory> | null>(null);
  if (!hydration.current)
    hydration.current = scope
      ? readListeningHistory(scope).catch(() => {
          readable.current = false;
          if (live.current) {
            warned.current = true;
            Alert.alert(
              "On-device history unavailable",
              "Your saved listening history could not load. Existing history will not be changed. Playback and session bookmarks still work."
            );
          }
          return {};
        })
      : Promise.resolve({});
  useEffect(() => {
    live.current = true;
    void hydration.current!.then((data) => {
      if (live.current) {
        historyRef.current = data;
        setHistory(data);
      }
    });
    return () => {
      live.current = false;
      request.current++;
    };
  }, []);
  const persist = (next: ListeningHistory) => {
    historyRef.current = next;
    if (live.current) setHistory(next);
    if (scope && readable.current)
      void writeListeningHistory(scope, next).catch(() => {
        if (live.current && !warned.current) {
          warned.current = true;
          Alert.alert(
            "On-device history unavailable",
            "This listening position or bookmark could not be saved on this device. Playback still works."
          );
        }
      });
  };
  const flush = (record = currentRef.current, state = statusRef.current) => {
    if (!record || !scope || state.time < MIN_RESUME_SECONDS) return;
    persist({
      ...historyRef.current,
      [record.id]: {
        ...historyRef.current[record.id],
        progress: {
          time: state.time,
          duration: state.duration,
          at: Date.now(),
        },
      },
    });
    lastSave.current = Date.now();
  };
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    const save = () => flush();
    // NOTE: React Native defines a `window` global but without DOM
    // addEventListener; `typeof window !== "undefined"` is not a web guard
    // on native and crashes release builds on startup.
    if (Platform.OS === "web") window.addEventListener("pagehide", save);
    return () => {
      sub.remove();
      if (Platform.OS === "web") window.removeEventListener("pagehide", save);
      flush();
    };
  }, [scope]);
  const play = (record: LectureAudioRecord) => {
    if (!scope) {
      Alert.alert("Guest preview", "Sample recordings stay on this device.");
      return;
    }
    let url: string;
    try {
      if (
        !record.id ||
        record.id.length > 512 ||
        ["__proto__", "prototype", "constructor"].includes(record.id)
      )
        throw Error();
      url = downloadUrl(record.url);
    } catch {
      Alert.alert(
        "Recording unavailable",
        "This recording has no supported secure audio link."
      );
      return;
    }
    const mine = ++request.current;
    void hydration.current!.then(() => {
      if (!live.current || request.current !== mine) return;
      const old = currentRef.current;
      if (old?.id === record.id && old.url === url) {
        setWanted(true);
        setSheetOpen(true);
        setDismissed(false);
        return;
      }
      flush();
      const saved = historyRef.current[record.id]?.progress;
      resume.current =
        saved && !isListeningComplete(saved) && saved.time >= MIN_RESUME_SECONDS
          ? saved.time
          : 0;
      lastSave.current = 0;
      wasPlaying.current = false;
      statusRef.current = empty;
      setStatus(empty);
      setSeekCommand(undefined);
      currentRef.current = { ...record, url };
      setCurrent(currentRef.current);
      setWanted(true);
      setSheetOpen(true);
      setDismissed(false);
    });
  };
  const seek = (time: number) => {
    const d = statusRef.current.duration;
    if (!Number.isFinite(time) || d <= 0) return;
    const target = Math.max(0, Math.min(d, time));
    setSeekCommand({ time: target, nonce: ++nonce.current });
    statusRef.current = { ...statusRef.current, time: target };
    setStatus(statusRef.current);
  };
  const toggle = () => {
    setWanted((value) => !value);
    if (wanted) flush();
  };
  const changeBookmarks = (
    change: (items: ListeningBookmark[]) => ListeningBookmark[]
  ) => {
    const record = currentRef.current;
    if (!record || !scope) return;
    const entry = historyRef.current[record.id] ?? {};
    persist({
      ...historyRef.current,
      [record.id]: { ...entry, bookmarks: change(entry.bookmarks ?? []) },
    });
  };
  const value: AudioState = {
    current,
    status,
    playing: status.playing && !status.failed,
    sheetOpen,
    miniVisible: !!current && !sheetOpen && !dismissed,
    rate,
    volume,
    loop,
    history,
    loadHistory: () => hydration.current!.then(() => historyRef.current),
    saveProgress: (id, state) => {
      if (
        scope &&
        state.time >= MIN_RESUME_SECONDS &&
        Number.isFinite(state.time) &&
        Number.isFinite(state.duration) &&
        state.duration >= 0
      )
        persist({
          ...historyRef.current,
          [id]: {
            ...historyRef.current[id],
            progress: {
              time: state.time,
              duration: state.duration,
              at: Date.now(),
            },
          },
        });
    },
    play,
    toggle,
    seek,
    setRate: (n) => setRate(Math.max(0.5, Math.min(2, n))),
    setVolume: (n) => setVolume(Math.max(0, Math.min(1, n))),
    setLoop,
    openSheet: () => {
      setSheetOpen(true);
      setDismissed(false);
    },
    closeSheet: () => {
      flush();
      setSheetOpen(false);
    },
    closeMini: () => {
      flush();
      setWanted(false);
      setDismissed(true);
      setSheetOpen(false);
    },
    addBookmark: () =>
      changeBookmarks((items) =>
        items.length >= 500
          ? items
          : [
              ...items,
              { time: Math.floor(statusRef.current.time), note: "" },
            ].sort((a, b) => a.time - b.time)
      ),
    editBookmark: (index, note) =>
      changeBookmarks((items) =>
        items.map((b, i) =>
          i === index ? { ...b, note: note.slice(0, 500) } : b
        )
      ),
    deleteBookmark: (index) =>
      changeBookmarks((items) => items.filter((_, i) => i !== index)),
  };
  const command = useMemo(
    () => ({ playing: wanted, rate, volume, loop, seek: seekCommand }),
    [wanted, rate, volume, loop, seekCommand]
  );
  return (
    <Context.Provider value={value}>
      {children}
      {current && scope && (
        <LectureAudioEngine
          key={current.id + "|" + current.url}
          url={current.url}
          command={command}
          onInterrupt={() => setWanted(false)}
          onStatus={(next) => {
            if (!live.current) return;
            statusRef.current = next;
            setStatus(next);
            if (
              next.failed ||
              next.ended ||
              (wasPlaying.current && !next.playing)
            )
              setWanted(false);
            wasPlaying.current = next.playing;
            if (resume.current && next.duration > 0) {
              const target = resume.current;
              resume.current = 0;
              if (target < next.duration - 2) seek(target);
            }
            if (
              next.time >= MIN_RESUME_SECONDS &&
              (next.ended ||
                !next.playing ||
                Date.now() - lastSave.current >= 4000)
            )
              flush(currentRef.current, next);
          }}
        />
      )}
      <LectureAudioControls />
    </Context.Provider>
  );
}
