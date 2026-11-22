import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'sessionToken'; // api.ts reads the same key
const USER_KEY = 'authUser';

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([secureGet(TOKEN_KEY), secureGet(USER_KEY)]);
      if (t) setToken(t);
      if (u) { try { setUser(JSON.parse(u)); } catch { /* ignore */ } }
      setBootstrapped(true);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      bootstrapped,
      signIn: async (t, u) => {
        setToken(t);
        setUser(u);
        await Promise.all([secureSet(TOKEN_KEY, t), secureSet(USER_KEY, JSON.stringify(u))]);
      },
      signOut: async () => {
        setToken(null);
        setUser(null);
        await Promise.all([secureDelete(TOKEN_KEY), secureDelete(USER_KEY)]);
      },
    }),
    [token, user, bootstrapped],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const s = useContext(AuthContext);
  if (!s) throw new Error('useAuth must be used within AuthProvider');
  return s;
}
