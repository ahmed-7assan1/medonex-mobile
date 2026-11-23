import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as Crypto from "expo-crypto";
import { PDF_CHUNK_BYTES, type PdfSource } from "../../lib/pdf-source";
export type PdfMessage = { type: string; [key: string]: any };
export type PdfControl = { send: (message: PdfMessage) => void };
/** Provider-free content sandbox. The selected document and viewer preferences are its only inputs. */
export const LecturePdfEngine = forwardRef<
  PdfControl,
  {
    source: PdfSource | null;
    dark: boolean;
    onMessage: (message: PdfMessage) => void;
  }
>(function LecturePdfEngine({ source, dark, onMessage }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null),
    native = useRef<WebView | null>(null),
    scope = useRef(Crypto.randomUUID()),
    engineReady = useRef(false),
    callback = useRef(onMessage),
    [uri, setUri] = useState(""),
    [ready, setReady] = useState(false),
    pending = useRef(
      new Map<
        string,
        {
          resolve: () => void;
          reject: (e: Error) => void;
          timer: ReturnType<typeof setTimeout>;
        }
      >()
    );
  callback.current = onMessage;
  const send = (data: PdfMessage) => {
    const m = { ...data, scope: scope.current };
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(m, "*");
    else
      native.current?.injectJavaScript(
        "window.lecturePdfCommand&&window.lecturePdfCommand(" +
          JSON.stringify(m) +
          ");true;"
      );
  };
  useImperativeHandle(ref, () => ({ send }));
  useEffect(() => {
    let alive = true;
    const timeout = setTimeout(() => {
      if (alive && !engineReady.current)
        callback.current({
          type: "error",
          message:
            "The document viewer took too long to start. Try the original file.",
        });
    }, 30000);
    const asset = Asset.fromModule(
      require("../../../assets/lecture-pdf-engine.html")
    );
    void asset
      .downloadAsync()
      .then(() => {
        if (alive)
          setUri((asset.localUri || asset.uri) + "#scope=" + scope.current);
      })
      .catch(() =>
        callback.current({
          type: "error",
          message: "The document viewer could not start.",
        })
      );
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, []);
  const accept = (m: unknown) => {
    if (!m || typeof m !== "object") return;
    const data = m as PdfMessage;
    if (data.scope !== scope.current) return;
    if (data.type === "ready") {
      engineReady.current = true;
      setReady(true);
      return;
    }
    if (data.type === "ack") {
      const key = String(data.index),
        item = pending.current.get(key);
      if (item) {
        clearTimeout(item.timer);
        item.resolve();
        pending.current.delete(key);
      }
      return;
    }
    callback.current(data);
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const receive = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow) accept(e.data);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (ready) send({ type: "configure", dark });
  }, [ready, dark]);
  useEffect(() => {
    if (!ready || !source) return;
    let alive = true;
    const ack = (index: number, data: PdfMessage) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.current.delete(String(index));
          reject(Error("The document viewer stopped responding."));
        }, 15000);
        pending.current.set(String(index), { resolve, reject, timer });
        send(data);
      });
    void (async () => {
      await ack(-1, {
        type: "begin",
        bytes: source.bytes,
        fit: windowWidth() < 768,
      });
      let index = 0;
      for (let offset = 0; offset < source.bytes; offset += PDF_CHUNK_BYTES) {
        const base64 = await source.read(offset, PDF_CHUNK_BYTES);
        if (!alive) return;
        await ack(index, { type: "chunk", index, offset, data: base64 });
        index++;
      }
      if (alive) send({ type: "finish" });
    })().catch((e) => {
      if (alive)
        callback.current({
          type: "error",
          message:
            e instanceof Error ? e.message : "The PDF could not be opened.",
        });
    });
    return () => {
      alive = false;
      for (const item of pending.current.values()) {
        clearTimeout(item.timer);
        item.reject(Error("Preview cancelled."));
      }
      pending.current.clear();
      send({ type: "close" });
    };
  }, [ready, source]);
  if (!uri) return <View style={styles.fill} />;
  if (Platform.OS === "web")
    return React.createElement("iframe", {
      ref: frame,
      src: uri,
      sandbox: "allow-scripts",
      title: "PDF document",
      style: {
        width: "100%",
        height: "100%",
        border: 0,
        background: "transparent",
      },
    });
  return (
    <WebView
      ref={native}
      source={{ uri }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled={false}
      sharedCookiesEnabled={false}
      thirdPartyCookiesEnabled={false}
      allowFileAccess
      allowingReadAccessToURL={uri.split("#")[0].replace(/[^/]+$/, "")}
      onShouldStartLoadWithRequest={(r) =>
        r.url === uri || r.url === uri.split("#")[0] || r.url === "about:blank"
      }
      onMessage={(e) => {
        try {
          if (e.nativeEvent.data.length <= 1500000)
            accept(JSON.parse(e.nativeEvent.data));
        } catch {}
      }}
      onError={() =>
        callback.current({
          type: "error",
          message: "The document viewer could not load.",
        })
      }
      style={styles.fill}
    />
  );
});
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "transparent" },
});

function windowWidth() {
  return Dimensions.get("window").width;
}
