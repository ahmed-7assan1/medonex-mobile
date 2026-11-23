import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

/**
 * Startup crash capture. Release builds kill the process on any uncaught JS
 * error, which leaves the user with only the OS "keeps stopping" dialog and
 * no stack. This guard installs a global error handler and an ErrorBoundary
 * that render the exact error on screen instead, with a copy button so the
 * stack can be pasted back to the developer. Remove once startup is stable.
 */

export interface CrashInfo {
  message: string;
  stack?: string;
  fatal: boolean;
  at: string;
}

let current: CrashInfo | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => {
    try { listener(); } catch { /* noop */ }
  });
}

export function getCrash(): CrashInfo | null {
  return current;
}

export function subscribeCrash(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function reportCrash(error: unknown, fatal: boolean): void {
  let err: Error;
  if (error instanceof Error) err = error;
  else {
    try { err = new Error(typeof error === 'string' ? error : JSON.stringify(error)); }
    catch { err = new Error('Unknown error'); }
  }
  current = { message: err.message || 'Unknown error', stack: err.stack, fatal, at: new Date().toISOString() };
  notify();
  // eslint-disable-next-line no-console
  console.error('[crash-guard]', err);
  // Persist a copy so a later launch can surface a module-eval crash that
  // happened before React mounted. Best effort only.
  void (async () => {
    try {
      if (Platform.OS === 'web') return;
      const FileSystem = await import('expo-file-system');
      const dir = (FileSystem as unknown as { documentDirectory?: string | null }).documentDirectory;
      if (!dir) return;
      const body = JSON.stringify(current, null, 2);
      await (FileSystem as unknown as { writeAsStringAsync?: (p: string, b: string) => Promise<void> })
        .writeAsStringAsync?.(`${dir}medonex-crash.json`, body);
    } catch { /* noop */ }
  })();
}

let installed = false;

// Self-install at module evaluation: app/_layout.tsx imports this module
// first so the global handler is live before any other startup module runs.
// Import order in the entry layout is what protects module-eval-time throws.
// eslint-disable-next-line @typescript-eslint/no-use-before-define
installCrashGuard();

/** Install global JS error capture once. In release the default handler
 *  terminates the app; we replace it so the error renders on screen. */
export function installCrashGuard(): void {
  if (installed) return;
  installed = true;
  try {
    const ErrorUtils = (globalThis as {
      ErrorUtils?: {
        getGlobalHandler?: () => (e: unknown, f?: boolean) => void;
        setGlobalHandler?: (h: (e: unknown, f?: boolean) => void) => void;
      };
    }).ErrorUtils;
    if (ErrorUtils?.getGlobalHandler && ErrorUtils?.setGlobalHandler) {
      const previous = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
        reportCrash(error, Boolean(isFatal));
        // eslint-disable-next-line no-undef
        if (typeof __DEV__ !== 'undefined' && __DEV__ && previous) previous(error, isFatal);
      });
    }
  } catch { /* noop */ }
  try {
    // Unhandled promise rejections (Hermes rejection tracking).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore Metro provides CommonJS require at runtime.
    const tracking = require('promise/setimmediate/rejection-tracking');
    tracking.enable({
      allRejections: true,
      onUnhandled: (_id: unknown, error: unknown) => reportCrash(error, false),
      onHandled: () => { /* noop */ },
    });
  } catch { /* noop */ }
  try {
    if (Platform.OS === 'web') {
      window.addEventListener('unhandledrejection', (event) => reportCrash((event as PromiseRejectionEvent).reason, false));
      window.addEventListener('error', (event) => reportCrash((event as ErrorEvent).error ?? (event as ErrorEvent).message, false));
    }
  } catch { /* noop */ }
}

export function CrashScreen({ crash }: { crash: CrashInfo }): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const detail = `MedOneX startup error\n${crash.at}\nfatal: ${crash.fatal}\n\n${crash.message}\n\n${crash.stack ?? '(no stack)'}`;
  const copy = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(detail);
      setCopied(true);
    } catch { /* noop */ }
  };
  const retry = async () => {
    try {
      if (Platform.OS === 'web') { window.location.reload(); return; }
      const Updates = await import('expo-updates');
      await Updates.reloadAsync();
    } catch { /* noop */ }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0B', paddingTop: 64, paddingHorizontal: 20 }}>
      <Text style={{ color: '#e8c777', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>MedOneX hit a startup error</Text>
      <Text style={{ color: '#ddd', fontSize: 13, marginBottom: 16 }}>
        Screenshot this screen or tap Copy, then send it to the developer. The app cannot continue until this is fixed.
      </Text>
      <ScrollView style={{ flex: 1, backgroundColor: '#161616', borderRadius: 12, padding: 14 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text selectable style={{ color: '#ff9c9c', fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
          {detail}
        </Text>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 12, marginVertical: 18 }}>
        <TouchableOpacity onPress={() => void copy()} style={{ flex: 1, backgroundColor: '#e8c777', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#0B0B0B', fontWeight: '700' }}>{copied ? 'Copied' : 'Copy details'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void retry()} style={{ flex: 1, borderColor: '#e8c777', borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#e8c777', fontWeight: '700' }}>Try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface BoundaryState { error: CrashInfo | null; }

class CrashBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  override state: BoundaryState = { error: null };
  static getDerivedStateFromError(error: unknown): BoundaryState {
    const err = error instanceof Error ? error : new Error(String(error));
    return { error: { message: err.message, stack: err.stack, fatal: true, at: new Date().toISOString() } };
  }
  override componentDidCatch(error: unknown): void { reportCrash(error, true); }
  override render(): React.ReactNode {
    if (this.state.error) return <CrashScreen crash={this.state.error} />;
    return this.props.children;
  }
}

/** Wrap the whole app: catches render errors via the boundary and async
 *  global errors via the shared crash store. */
export function CrashGate({ children }: React.PropsWithChildren): React.JSX.Element {
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => subscribeCrash(() => force()), []);
  const crash = getCrash();
  if (crash) return <CrashScreen crash={crash} />;
  return <CrashBoundary>{children}</CrashBoundary>;
}
