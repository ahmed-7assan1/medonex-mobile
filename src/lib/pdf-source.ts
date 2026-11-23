import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import {lectureFileDelivery} from "./lecture-file-delivery";
import { downloadUrl } from "./offline-downloads";
export const PDF_CHUNK_BYTES = 192 * 1024,
  MAX_PDF_BYTES = 100 * 1024 * 1024;
export type PdfSource = {
  bytes: number;
  saved: boolean;
  read: (offset: number, length: number) => Promise<string>;
  release: () => Promise<void>;
};
function signature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  );
}
function encode(bytes: Uint8Array) {
  let raw = "";
  for (const b of bytes) raw += String.fromCharCode(b);
  return btoa(raw);
}
/** The isolated decoder receives selected PDF bytes only, never URLs or app credentials. */
export async function loadPdfSource(
  raw: string,
  scope: string,
  signal: AbortSignal,
  onProgress?: (n: number) => void,
  fileId?: string
): Promise<PdfSource> {
  const delivery=fileId?await lectureFileDelivery(fileId,scope):null;
  const url = delivery?.url || downloadUrl(raw);
  if (signal.aborted) throw Error("Preview cancelled.");
  if (Platform.OS === "web") {
    const response = await fetch(url, { signal, credentials: "omit", headers:delivery?.headers });
    if (!response.ok) throw Error("This file could not be downloaded.");
    const type = response.headers.get("content-type") || "";
    if (/html|json/i.test(type))
      throw Error("This link opened a web page, not a PDF.");
    const expected = Number(response.headers.get("content-length"));
    if (expected > MAX_PDF_BYTES)
      throw Error("This PDF is too large for the in-app viewer.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        for (;;) {
          const r = await reader.read();
          if (r.done) break;
          total += r.value.length;
          if (total > MAX_PDF_BYTES) {
            await reader.cancel();
            throw Error("This PDF is too large for the in-app viewer.");
          }
          chunks.push(r.value);
          if (expected > 0)
            onProgress?.(Math.min(99, Math.round((total / expected) * 100)));
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > MAX_PDF_BYTES)
        throw Error("This PDF is too large for the in-app viewer.");
      chunks.push(bytes);
      total = bytes.length;
    }
    const blob = new Blob(chunks as BlobPart[]);
    if (!signature(new Uint8Array(await blob.slice(0, 8).arrayBuffer())))
      throw Error("This link did not return a valid PDF.");
    onProgress?.(100);
    return {
      bytes: total,
      saved: false,
      read: async (o, n) =>
        encode(new Uint8Array(await blob.slice(o, o + n).arrayBuffer())),
      release: async () => {},
    };
  }
  if (!FS.cacheDirectory) throw Error("The document cache is unavailable.");
  const owner = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      scope
    ),
    dir =
      FS.cacheDirectory +
      "pdf-viewer/" +
      owner +
      "/" +
      Crypto.randomUUID() +
      "/";
  await FS.makeDirectoryAsync(dir, { intermediates: true });
  const file = dir + "selected.pdf";
  let tooLarge = false;
  const task = FS.createDownloadResumable(url, file, {headers:delivery?.headers}, (s) => {
    if (
      s.totalBytesWritten > MAX_PDF_BYTES ||
      s.totalBytesExpectedToWrite > MAX_PDF_BYTES
    ) {
      tooLarge = true;
      void task.pauseAsync().catch(() => {});
    }
    if (s.totalBytesExpectedToWrite > 0)
      onProgress?.(
        Math.min(
          99,
          Math.round((s.totalBytesWritten / s.totalBytesExpectedToWrite) * 100)
        )
      );
  });
  const abort = () => {
    void task.pauseAsync().catch(() => {});
  };
  signal.addEventListener("abort", abort);
  try {
    if (signal.aborted) throw Error("Preview cancelled.");
    const r = await task.downloadAsync();
    if (signal.aborted) throw Error("Preview cancelled.");
    if (tooLarge) throw Error("This PDF is too large for the in-app viewer.");
    if (!r || r.status < 200 || r.status >= 300)
      throw Error("This file could not be downloaded.");
    const type =
      Object.entries(r.headers || {}).find(
        ([k]) => k.toLowerCase() === "content-type"
      )?.[1] || "";
    if (/html|json/i.test(type))
      throw Error("This link opened a web page, not a PDF.");
    const info = await FS.getInfoAsync(file);
    if (!info.exists || !info.size || info.size > MAX_PDF_BYTES)
      throw Error("This PDF is empty or too large.");
    const first = await FS.readAsStringAsync(file, {
      encoding: FS.EncodingType.Base64,
      position: 0,
      length: 8,
    });
    if (!first.startsWith("JVBERi0"))
      throw Error("This link did not return a valid PDF.");
    onProgress?.(100);
    return {
      bytes: info.size,
      saved: false,
      read: (offset, length) =>
        FS.readAsStringAsync(file, {
          encoding: FS.EncodingType.Base64,
          position: offset,
          length,
        }),
      release: () => FS.deleteAsync(dir, { idempotent: true }),
    };
  } catch (error) {
    await FS.deleteAsync(dir, { idempotent: true }).catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
