import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setGuestMode } from './fixtures';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  image?: string | null;
  universityId?: string | null;
  semesterId?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** false while restoring the saved session at boot. */
  bootstrapped: boolean;
  /** Guest trial mode: fixtures only, no API calls, no writes. */
  isGuest: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Placeholder profile while browsing as a guest; settings falls back to its
 *  guest-name label. Never sent to the backend. */
const GUEST_USER: AuthUser = { id: 'guest', name: null, email: '' };

const TOKEN_KEY = 'sessionToken'; // api.ts reads the same key
const USER_KEY = 'authUser';
const GUEST_KEY = 'guestMode';

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { globalThis.localStorage?.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  } catch { /* ignore */ }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { globalThis.localStorage?.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient=useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, u, g] = await Promise.all([secureGet(TOKEN_KEY), secureGet(USER_KEY), secureGet(GUEST_KEY)]);
      if (t) setToken(t);
      if (u) { try { setUser(JSON.parse(u)); } catch { /* ignore */ } }
      if (!t && g === '1') { setIsGuest(true); setGuestMode(true); }
      setBootstrapped(true);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      bootstrapped,
      isGuest,
      signIn: async (t, u) => {
        await queryClient.cancelQueries();
        queryClient.clear();
        setToken(t);
        setUser(u);
        setIsGuest(false);
        setGuestMode(false);
        await Promise.all([secureSet(TOKEN_KEY, t), secureSet(USER_KEY, JSON.stringify(u)), secureDelete(GUEST_KEY)]);
      },
      signInAsGuest: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        setToken(null);
        setUser(GUEST_USER);
        setIsGuest(true);
        setGuestMode(true);
        await Promise.all([secureDelete(TOKEN_KEY), secureDelete(USER_KEY), secureSet(GUEST_KEY, '1')]);
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        setToken(null);
        setUser(null);
        setIsGuest(false);
        setGuestMode(false);
        await Promise.all([secureDelete(TOKEN_KEY), secureDelete(USER_KEY), secureDelete(GUEST_KEY)]);
      },
    }),
    [token, user, bootstrapped, isGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const s = useContext(AuthContext);
  if (!s) throw new Error('useAuth must be used within AuthProvider');
  return s;
}
