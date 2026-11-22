import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { AuthUser } from './auth';

WebBrowser.maybeCompleteAuthSession();

/** Proposed backend exchange (pending Ahmed's OK): POST /api/mobile/auth/google
 *  { idToken } -> { token, user }. Until it ships, the exchange 404s and the
 *  hook surfaces `endpoint-missing`. */
export class ExchangeError extends Error {
  constructor(public code: 'endpoint-missing' | 'config-missing' | 'failed', message: string) {
    super(message);
  }
}

interface Extra {
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
}

export function useGoogleSignIn() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const configured = Boolean(extra.googleWebClientId && extra.googleAndroidClientId);
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: extra.googleWebClientId || 'not-configured.apps.googleusercontent.com',
    androidClientId: extra.googleAndroidClientId || 'not-configured.apps.googleusercontent.com',
    iosClientId: extra.googleIosClientId || 'not-configured.apps.googleusercontent.com',
    responseType: 'id_token' as never,
    scopes: ['openid', 'profile', 'email'],
  });

  const [pending, setPending] = useState<{
    resolve: (v: { token: string; user: AuthUser }) => void;
    reject: (e: Error) => void;
  } | null>(null);

  useEffect(() => {
    if (!pending) return;
    if (response?.type === 'success') {
      const idToken = (response.params as Record<string, string>).id_token;
      api
        .post<{ token: string; user: AuthUser }>('/auth/google', { idToken })
        .then(pending.resolve)
        .catch((e) => {
          const missing = e instanceof Error && /404/.test(e.message);
          pending.reject(
            new ExchangeError(missing ? 'endpoint-missing' : 'failed', missing ? 'Google exchange endpoint not deployed yet' : String(e)),
          );
        })
        .finally(() => setPending(null));
    } else if (response && response.type !== 'dismiss') {
      pending.reject(new ExchangeError('failed', response.type));
      setPending(null);
    } else if (response?.type === 'dismiss') {
      pending.reject(new ExchangeError('failed', 'cancelled'));
      setPending(null);
    }
  }, [response, pending]);

  const signIn = async (): Promise<{ token: string; user: AuthUser }> => {
    if (!configured) throw new ExchangeError('config-missing', 'Google client IDs are not configured yet');
    if (!request) throw new ExchangeError('failed', 'auth request not ready');
    setBusy(true);
    try {
      return await new Promise((resolve, reject) => {
        setPending({ resolve, reject });
        void promptAsync();
      });
    } finally {
      setBusy(false);
    }
  };

  return { signIn, busy, ready: Boolean(request), configured };
}
