import { usePdfPopoverGeometry } from "./usePdfPopoverGeometry";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react-native";
import {
  PdfPanelLeft as PanelLeft,
  PdfRotateCcw as RotateCcw,
  PdfRotateCw as RotateCw,
  PdfMinusCircle as MinusCircle,
  PdfPlusCircle as PlusCircle,
  PdfSearch as Search,
  PdfPrevious as ChevronLeft,
  PdfNext as ChevronRight,
} from "./LecturePdfIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import {
  getOfflinePdfSource,
  useOfflineDownloads,
  matchesOfflineFile,
  downloadUrl,
} from "@/lib/offline-downloads";
import { loadPdfSource, type PdfSource } from "@/lib/pdf-source";
import {
  LecturePdfEngine,
  type PdfControl,
  type PdfMessage,
} from "./LecturePdfEngine";
const ZOOMS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
export function LecturePdfSheet({
  file,
  downloading,
  progress,
  onDownload,
  onClose,
}: {
  file: { id: string; name: string; url?: string | null };
  downloading: boolean;
  progress: number;
  onDownload: () => void;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme(),
    { viewportWidth, viewportHeight } = useStudentDimensions(),
    insets = useSafeAreaInsets(),
    offline = useOfflineDownloads(),
    desktop = viewportWidth >= 768;
  const popover = usePdfPopoverGeometry();
  const engine = useRef<PdfControl | null>(null),
    [source, setSource] = useState<PdfSource | null>(null),
    [attempt, setAttempt] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [downloadProgress, setDownloadProgress] = useState(0),
    [pages, setPages] = useState<any[]>([]),
    [current, setCurrent] = useState(1),
    [zoom, setZoom] = useState(1),
    [sidebar, setSidebar] = useState(desktop),
    [expanded, setExpanded] = useState(false),
    [draftPage, setDraftPage] = useState<string | null>(null),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [results, setResults] = useState({
      index: -1,
      total: 0,
      shown: 0,
      truncated: false,
    }),
    [searching, setSearching] = useState(false),
    [zoomOpen, setZoomOpen] = useState(false),
    [thumbs, setThumbs] = useState<
      Record<number, { data: string; height: number }>
    >({});
  const asked = useRef(new Set<number>()),
    sourceRef = useRef<PdfSource | null>(null);
  sourceRef.current = source;
  const bg = isDark ? "#070708" : colors.background,
    fg = isDark ? "#ededed" : colors.foreground,
    muted = isDark ? "#9e9ea4" : colors.mutedForeground,
    border = isDark ? "#232328" : colors.border,
    subtle = isDark ? "#ffffff0D" : colors.border;
  const f = (
    size: number,
    color = fg,
    weight: TextStyle["fontWeight"] = "400",
    lineHeight = size * 1.65
  ): TextStyle => ({
    fontFamily: Platform.OS === "android" ? "sans-serif" : "Arial",
    fontSize: size,
    color,
    fontWeight: weight,
    lineHeight,
    letterSpacing: -0.15,
  });
  const send = (m: PdfMessage) => engine.current?.send(m);
  const saved = offline.data?.some((item) => matchesOfflineFile(file, item));
  useEffect(() => {
    let alive = true,
      opened: PdfSource | null = null;
    const controller = new AbortController();
    setSource(null);
    setPages([]);
    setThumbs({});
    asked.current.clear();
    setLoading(true);
    setError("");
    setDownloadProgress(0);
    void (async () => {
      if (!file.url) throw Error("This file has no preview link.");
      if (!attempt)
        try {
          opened = await getOfflinePdfSource(offline.scope, file);
        } catch {}
      if (!opened)
        opened = await loadPdfSource(
          file.url,
          offline.scope,
          controller.signal,
          (n) => {
            if (alive) setDownloadProgress(n);
          }
        );
      if (alive) setSource(opened);
      else await opened.release();
    })().catch((e) => {
      if (alive) {
        setError(
          e instanceof Error ? e.message : "This PDF could not be opened."
        );
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      controller.abort();
      if (opened) void opened.release();
    };
  }, [file.id, file.url, offline.scope, attempt]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else if (zoomOpen) setZoomOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, searchOpen, zoomOpen]);
  useEffect(() => {
    if (!pages.length) return;
    const timer = setTimeout(() => {
      setSearching(!!search.trim());
      send({ type: "search", query: search });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pages.length]);
  const requestThumb = (page: number) => {
    if (asked.current.has(page)) return;
    asked.current.add(page);
    send({ type: "thumbnail", page });
  };
  const viewable = useRef(({ viewableItems }: any) => {
    for (const item of viewableItems)
      if (item.item) requestThumb(item.item.page);
  });
  viewable.current = ({ viewableItems }: any) => {
    for (const item of viewableItems)
      if (item.item) requestThumb(item.item.page);
  };
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;
  const onViewableItemsChanged = useRef((x: any) =>
    viewable.current(x)
  ).current;
  useEffect(() => {
    if (sidebar && pages.length)
      pages.slice(0, 5).forEach((p) => requestThumb(p.page));
  }, [sidebar, pages.length]);
  const onMessage = (m: PdfMessage) => {
    if (m.type === "document" && Array.isArray(m.pages)) {
      setPages(m.pages);
      setCurrent(1);
    } else if (m.type === "state") {
      if (Number.isFinite(m.page)) setCurrent(m.page);
      if (Number.isFinite(m.zoom)) setZoom(m.zoom);
    } else if (m.type === "rendered") setLoading(false);
    else if (
      m.type === "thumbnail" &&
      typeof m.data === "string" &&
      m.data.startsWith("data:image/png;base64,")
    )
      setThumbs((prev) => ({
        ...prev,
        [m.page]: { data: m.data, height: m.height },
      }));
    else if (m.type === "search") {
      setSearching(false);
      setResults({
        index: m.index,
        total: m.total,
        shown: m.shown,
        truncated: m.truncated,
      });
    } else if (m.type === "error") {
      if (m.stage === "document" && sourceRef.current?.saved) {
        setAttempt((n) => n + 1);
        return;
      }
      setError(
        m.message || "This PDF could not be opened. Try the original file."
      );
      setLoading(false);
    }
  };
  const icon = (
    label: string,
    Icon: any,
    action: () => void,
    disabled = false,
    selected = false,
    outlined = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      ref={label === "Search in document" ? popover.search : undefined}
      disabled={disabled}
      onPress={action}
      style={{
        width: 32,
        height: 32,
        borderRadius: 99,
        borderWidth: outlined ? 1 : 0,
        borderColor: border,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.55 : 1,
        backgroundColor: selected
          ? isDark
            ? "#1a1a1f"
            : colors.muted
          : outlined
          ? colors.background
          : "transparent",
      }}
    >
      <Icon size={16} color={disabled ? (isDark ? "#5f5f68" : muted) : muted} />
    </Pressable>
  );
  const separator = () => (
    <View
      style={{
        height: 16,
        width: 1,
        marginHorizontal: 4,
        backgroundColor: border,
      }}
    />
  );
  const controlsDisabled = !pages.length || !!error;
  const zoomTo = (value: number) => {
    send({ type: "zoom", value });
    setZoomOpen(false);
  };
  const rotate = (direction: number) => {
    send({ type: "rotate", direction });
    if (sidebar) send({ type: "thumbnail", page: current });
  };
  const action = saved ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
      }}
    >
      <CheckCircle2 size={16} color="#10b981" />
      <Text style={f(11, "#10b981", "600", 16)}>Saved</Text>
    </View>
  ) : downloading ? (
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={f(10, colors.primary, "900", 16)}>{progress}%</Text>
    </View>
  ) : (
    icon("Download to this device", Download, onDownload)
  );
  const go = (raw: string) => {
    setDraftPage(raw);
    const value = Number(raw.trim());
    if (raw.trim() && Number.isInteger(value))
      send({ type: "page", page: Math.max(1, Math.min(pages.length, value)) });
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        testID="lecture-pdf-sheet"
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: desktop ? "#00000099" : bg,
          padding: desktop && !expanded ? 24 : 0,
        }}
      >
        {desktop && (
          <Pressable
            accessibilityLabel="Close PDF backdrop"
            onPress={onClose}
            style={{ position: "absolute", inset: 0 }}
          />
        )}
        <View
          accessibilityViewIsModal
          style={{
            height: desktop && !expanded ? viewportHeight * 0.9 : "100%",
            width: "100%",
            maxWidth: desktop && !expanded ? 1152 : undefined,
            borderRadius: desktop && !expanded ? 16 : 0,
            borderWidth: desktop && !expanded ? 1 : 0,
            borderColor: colors.border,
            backgroundColor: bg,
            overflow: "hidden",
            paddingTop: desktop ? 0 : insets.top,
            paddingBottom: desktop ? 0 : insets.bottom,
          }}
        >
          <View
            style={{
              height: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: subtle,
            }}
          >
            {icon("Close PDF", ArrowLeft, onClose)}
            <Text
              numberOfLines={1}
              style={{ ...f(14, fg, "700", 20), flex: 1 }}
            >
              {file.name}
            </Text>
            {desktop &&
              icon(
                expanded ? "Exit full screen" : "Fill screen",
                expanded ? Minimize2 : Maximize2,
                () => setExpanded(!expanded)
              )}
            {error ? action : null}
            {source?.saved && (
              <View
                style={{
                  borderRadius: 99,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: "#10b9811A",
                  boxShadow: "0 0 0 1px #10b98133",
                }}
              >
                <Text
                  style={{
                    ...f(10, "#10b981", "700", 16.5),
                    letterSpacing: 0.5,
                  }}
                >
                  ON DEVICE
                </Text>
              </View>
            )}
          </View>
          <View
            ref={popover.root}
            collapsable={false}
            onLayout={() => {
              if (searchOpen) popover.measure("search");
              if (zoomOpen) popover.measure("zoom");
            }}
            style={{ flex: 1, minHeight: 0 }}
          >
            <View
              style={{
                minHeight: 48,
                zIndex: 20,
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: subtle,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {icon(
                  "Toggle thumbnails",
                  PanelLeft,
                  () => setSidebar(!sidebar),
                  controlsDisabled,
                  true
                )}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={f(14, colors.primary, "400", 20)}>Page</Text>
                  {draftPage !== null ? (
                    <TextInput
                      autoFocus
                      selectTextOnFocus
                      accessibilityLabel="Page number"
                      value={draftPage}
                      onChangeText={go}
                      keyboardType="number-pad"
                      onBlur={() => setDraftPage(null)}
                      onSubmitEditing={() => setDraftPage(null)}
                      style={{
                        ...f(14, fg, "400", 20),
                        width: 56,
                        height: 32,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: border,
                        marginHorizontal: 4,
                        textAlign: "center",
                        paddingHorizontal: 8,
                      }}
                    />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        "Current page " + current + ". Edit page number"
                      }
                      disabled={controlsDisabled}
                      onPress={() => setDraftPage(String(current))}
                      style={{
                        paddingHorizontal: 12,
                        height: 32,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={f(14, colors.primary, "400", 20)}>
                        {current}
                      </Text>
                    </Pressable>
                  )}
                  <Text style={f(14, colors.primary, "400", 20)}>
                    of {pages.length || "–"}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  gap: 4,
                }}
              >
                {icon(
                  "Rotate counterclockwise",
                  RotateCcw,
                  () => rotate(-1),
                  controlsDisabled
                )}
                {icon(
                  "Rotate clockwise",
                  RotateCw,
                  () => rotate(1),
                  controlsDisabled
                )}
                {separator()}
                {icon(
                  "Zoom out",
                  MinusCircle,
                  () =>
                    zoomTo([...ZOOMS].reverse().find((n) => n < zoom) || 0.1),
                  controlsDisabled || zoom <= 0.1
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Zoom percentage"
                  ref={popover.zoom}
                  onPress={() => {
                    popover.measure("zoom");
                    setZoomOpen(!zoomOpen);
                    setSearchOpen(false);
                  }}
                  disabled={controlsDisabled}
                  style={{
                    width: 84,
                    height: 32,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: isDark ? "#131316" : colors.background,
                    paddingHorizontal: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={f(12, fg, "400", 16)}>
                    {Math.round(zoom * 100)}%
                  </Text>
                  <ChevronDown size={14} color={muted} />
                </Pressable>
                {icon(
                  "Zoom in",
                  PlusCircle,
                  () => zoomTo(ZOOMS.find((n) => n > zoom) || 2),
                  controlsDisabled || zoom >= 2
                )}
                {separator()}
                {icon(
                  "Search in document",
                  Search,
                  () => {
                    popover.measure("search");
                    setSearchOpen(!searchOpen);
                    setZoomOpen(false);
                  },
                  controlsDisabled
                )}
                {separator()}
                {action}
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {sidebar && !error && (
                <View
                  style={{
                    width: 160,
                    borderRightWidth: 1,
                    borderRightColor: subtle,
                    backgroundColor: isDark ? "#0b0b0c" : colors.background,
                    ...(!desktop
                      ? {
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          zIndex: 10,
                        }
                      : {}),
                    overflow: "hidden",
                  }}
                >
                  <FlatList
                    data={pages}
                    keyExtractor={(p) => String(p.page)}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      paddingTop: 32,
                      gap: 12,
                      paddingBottom: 32,
                    }}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    initialNumToRender={5}
                    windowSize={3}
                    renderItem={({ item }) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={"Go to page " + item.page}
                        accessibilityState={{ selected: current === item.page }}
                        onPress={() => {
                          send({ type: "page", page: item.page });
                          if (!desktop) setSidebar(false);
                        }}
                        style={{
                          height:
                            (thumbs[item.page]?.height ||
                              Math.min(256, (92 * item.height) / item.width)) +
                            40,
                          padding: 0,
                          borderRadius: isDark ? 12 : 6,
                          borderWidth: 1,
                          borderColor:
                            current === item.page ? border : "transparent",
                          backgroundColor:
                            current === item.page
                              ? isDark
                                ? "#111113"
                                : colors.muted
                              : "transparent",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            width: 108,
                            height:
                              (thumbs[item.page]?.height ||
                                Math.min(
                                  256,
                                  (92 * item.height) / item.width
                                )) + 16,
                            padding: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 1,
                          }}
                        >
                          {thumbs[item.page] ? (
                            <Image
                              source={{ uri: thumbs[item.page].data }}
                              resizeMode="contain"
                              style={{
                                width: 92,
                                height: thumbs[item.page].height,
                                borderRadius: 8,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: 92,
                                height: Math.min(
                                  200,
                                  (92 * item.height) / item.width
                                ),
                                backgroundColor: isDark
                                  ? "#18181c"
                                  : colors.muted,
                              }}
                            />
                          )}
                        </View>
                        <View
                          style={{
                            height: 24,
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 1,
                          }}
                        >
                          <Text
                            style={f(
                              12,
                              current === item.page ? fg : muted,
                              "400",
                              16
                            )}
                          >
                            {item.page}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                {source && !error && (
                  <LecturePdfEngine
                    key={offline.scope + ":" + file.id + ":" + attempt}
                    ref={engine}
                    source={source}
                    dark={isDark}
                    onMessage={onMessage}
                  />
                )}
              </View>
              {loading && !error && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    inset: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: bg,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ ...f(12, muted, "400", 18), marginTop: 12 }}>
                    {downloadProgress < 100
                      ? "Loading PDF" +
                        (downloadProgress ? " " + downloadProgress + "%" : "…")
                      : "Opening PDF…"}
                  </Text>
                </View>
              )}
              {error && (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    gap: 16,
                    backgroundColor: bg,
                  }}
                >
                  <Text
                    style={{ ...f(14, muted, "400", 22), textAlign: "center" }}
                  >
                    {error}
                  </Text>
                  {file.url && (
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel="Open original PDF"
                      onPress={() => {
                        try {
                          void Linking.openURL(downloadUrl(file.url!)).catch(
                            () => setError("The original file could not open.")
                          );
                        } catch {
                          setError("This file has no supported secure link.");
                        }
                      }}
                    >
                      <Text style={f(14, colors.primary, "600", 20)}>
                        Open original file
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
            {(searchOpen || zoomOpen) && (
              <Pressable
                accessibilityLabel="Close PDF menu"
                onPress={() => {
                  setSearchOpen(false);
                  setZoomOpen(false);
                }}
                style={{ position: "absolute", inset: 0, zIndex: 10 }}
              />
            )}
            {searchOpen && (
              <View
                testID="pdf-search-popover"
                style={{
                  position: "absolute",
                  ...popover.searchBox,
                  zIndex: 30,
                  padding: 16,
                  gap: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: isDark ? "#111113" : colors.card,
                  boxShadow: "0 12px 32px -8px #000000B3",
                }}
              >
                <TextInput
                  autoFocus
                  accessibilityLabel="Search document text"
                  placeholder="Search text"
                  placeholderTextColor={muted}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  onKeyPress={
                    Platform.OS === "web"
                      ? (e) => {
                          if (e.nativeEvent.key === "Enter") {
                            e.preventDefault();
                            if (results.shown)
                              send({
                                type: "result",
                                index:
                                  results.index +
                                  ((e as any).shiftKey ? -1 : 1),
                              });
                            else if (search.trim())
                              send({ type: "search", query: search });
                          }
                        }
                      : undefined
                  }
                  onSubmitEditing={
                    Platform.OS !== "web"
                      ? () => {
                          if (results.shown)
                            send({ type: "result", index: results.index + 1 });
                          else if (search.trim())
                            send({ type: "search", query: search });
                        }
                      : undefined
                  }
                  style={{
                    ...f(desktop ? 14 : 16, fg, "400", 24),
                    height: 36,
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    backgroundColor: isDark ? "#131316" : colors.background,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Text style={{ ...f(12, muted, "400", 16), flex: 1 }}>
                    {searching ? (
                      "Searching"
                    ) : !search.trim() ? (
                      "No search"
                    ) : results.total ? (
                      <>
                        <Text style={{ color: colors.primary }}>
                          {results.index + 1}
                        </Text>
                        {" / " +
                          results.total +
                          (results.truncated
                            ? " (first " + results.shown + " shown)"
                            : "")}
                      </>
                    ) : (
                      "No results"
                    )}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    {icon(
                      "Previous PDF match",
                      ChevronLeft,
                      () => send({ type: "result", index: results.index - 1 }),
                      !results.shown || searching,
                      false,
                      true
                    )}
                    {icon(
                      "Next PDF match",
                      ChevronRight,
                      () => send({ type: "result", index: results.index + 1 }),
                      !results.shown || searching,
                      false,
                      true
                    )}
                  </View>
                </View>
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear PDF search"
                    onPress={() => {
                      setSearch("");
                      setSearching(false);
                      setResults({
                        index: -1,
                        total: 0,
                        shown: 0,
                        truncated: false,
                      });
                      send({ type: "search", query: "" });
                    }}
                    style={{
                      height: 32,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: border,
                      backgroundColor: colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={f(12, fg, "500", 16)}>Clear</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {zoomOpen && (
              <View
                style={{
                  position: "absolute",
                  ...popover.zoomBox,
                  zIndex: 30,
                  padding: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: isDark ? "#111113" : colors.card,
                  boxShadow: "0 12px 32px -8px #000000B3",
                }}
              >
                {ZOOMS.map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={
                      "Zoom " + Math.round(value * 100) + " percent"
                    }
                    onPress={() => zoomTo(value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor:
                        value === zoom
                          ? isDark
                            ? "#1a1a1f"
                            : colors.muted
                          : "transparent",
                    }}
                  >
                    <Text style={f(12, fg, "400", 20)}>
                      {Math.round(value * 100)}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
