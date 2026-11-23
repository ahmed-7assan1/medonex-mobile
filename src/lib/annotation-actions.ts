import { Platform } from 'react-native';
import type * as ClipboardTypes from 'expo-clipboard';
import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type * as PrintTypes from 'expo-print';
import * as Crypto from 'expo-crypto';
export function validateAnnotationExport(mime: unknown, base64: unknown): base64 is string {
  if (!['application/pdf', 'image/png'].includes(String(mime)) || typeof base64 !== 'string' || base64.length > 26_666_668 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return false;
  return mime === 'application/pdf' ? base64.startsWith('JVBERi0') : base64.startsWith('iVBORw0KGgo');
}
export async function copyAnnotationText(text: unknown) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw Error('The selected text is too large.');
  if (Platform.OS === 'web') {
    if (!navigator.clipboard?.writeText) throw Error('The clipboard is unavailable in this browser.');
    await navigator.clipboard.writeText(text);
    return;
  }
  const Clipboard: typeof ClipboardTypes = await import('expo-clipboard');
  const ok = await Clipboard.setStringAsync(text);
  if (!ok) throw Error('The clipboard could not be updated.');
}
export async function exportAnnotationDocument(mime: unknown, base64: unknown, mode: 'download' | 'print') {
  if (!validateAnnotationExport(mime, base64)) throw Error('The generated document is invalid or too large.');
  const type = mime as 'application/pdf' | 'image/png', extension = type === 'application/pdf' ? 'pdf' : 'png', name = 'lecture-notes-' + Crypto.randomUUID().slice(0, 8) + '.' + extension;
  if (mode === 'print' && type !== 'application/pdf') throw Error('Only the PDF can be printed.');
  if (Platform.OS === 'web') {
    const raw = atob(base64), bytes = Uint8Array.from(raw, c => c.charCodeAt(0)), url = URL.createObjectURL(new Blob([bytes], { type }));
    if (mode === 'print') {
      const preview = document.createElement('iframe');
      preview.title = 'Lecture notes print preview';
      preview.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { preview.remove(); URL.revokeObjectURL(url); reject(Error('The print preview could not load.')); }, 20000);
        preview.onload = () => {
          clearTimeout(timeout);
          try { preview.contentWindow?.focus(); preview.contentWindow?.print(); resolve(); }
          catch { preview.remove(); URL.revokeObjectURL(url); reject(Error('The print dialog could not open.')); }
        };
        preview.src = url;
        document.body.appendChild(preview);
      });
      setTimeout(() => { preview.remove(); URL.revokeObjectURL(url); }, 600000);
    } else {
      const link = document.createElement('a'); link.href = url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    return;
  }
  if (!FS.cacheDirectory) throw Error('Temporary document storage is unavailable.');
  const names = await FS.readDirectoryAsync(FS.cacheDirectory).catch(() => [] as string[]);
  for (const file of names.filter(value => /^lecture-notes-[a-f0-9]{8}\.(pdf|png)$/.test(value))) {
    const path = FS.cacheDirectory + file, info = await FS.getInfoAsync(path);
    if (info.exists && !info.isDirectory && info.modificationTime && info.modificationTime < Date.now() / 1000 - 86400) await FS.deleteAsync(path, { idempotent: true }).catch(() => {});
  }
  const uri = FS.cacheDirectory + name;
  await FS.writeAsStringAsync(uri, base64, { encoding: FS.EncodingType.Base64 });
  if (mode === 'print') { const Print: typeof PrintTypes = await import('expo-print'); await Print.printAsync({ uri }); return; }
  if (!await Sharing.isAvailableAsync()) throw Error('The document share sheet is unavailable.');
  // The receiving app may still read the content URI after the chooser closes.
  // Keep this private cache file for the OS; a later export removes old copies.
  await Sharing.shareAsync(uri, { mimeType: type, dialogTitle: 'Export lecture notes', UTI: type === 'application/pdf' ? 'com.adobe.pdf' : 'public.png' });
}
