import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setGuestMode } from './fixtures';
import {clearQuizResult}from'./quiz-store';
import {useStudyStore}from'./local-study-store';

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
const SESSION_KEY='authSessionV2';

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    throw new Error('The saved session could not be read from this device.');
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { globalThis.localStorage?.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  } catch { throw new Error('The session could not be saved securely on this device.'); }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { globalThis.localStorage?.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  } catch { throw new Error('The saved session could not be removed from this device.'); }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient=useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    (async () => {
      let [t,u,g,record]=await Promise.all([secureGet(TOKEN_KEY),secureGet(USER_KEY),secureGet(GUEST_KEY),secureGet(SESSION_KEY)]);if(record){try{const session=JSON.parse(record);t=typeof session.token==='string'?session.token:null;u=JSON.stringify(session.user)}catch{t=null;u=null}}
      let restored:AuthUser|null=null;try{const value=u?JSON.parse(u):null;if(value&&typeof value.id==='string'&&value.id&&typeof value.email==='string')restored=value}catch{}
      if(t&&restored){useStudyStore.getState().setScope(restored.id);setToken(t);setUser(restored);setGuestMode(false)}
      else if(!t&&g==='1'){useStudyStore.getState().setScope('guest');setUser(GUEST_USER);setIsGuest(true);setGuestMode(true)}
      else{useStudyStore.getState().setScope('guest');setGuestMode(false)}
      setBootstrapped(true);
    })().catch(()=>{setGuestMode(false);setBootstrapped(true)});
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      bootstrapped,
      isGuest,
      signIn: async (t, u) => {
        await secureSet(SESSION_KEY,JSON.stringify({token:t,user:u}));
        await queryClient.cancelQueries();
        queryClient.clear();
        clearQuizResult();
        useStudyStore.getState().setScope(u.id);
        setToken(t);
        setUser(u);
        setIsGuest(false);
        setGuestMode(false);
        await secureDelete(GUEST_KEY).catch(()=>{});
      },
      signInAsGuest: async () => {
        await Promise.all([secureDelete(SESSION_KEY),secureDelete(TOKEN_KEY),secureDelete(USER_KEY)]);
        await secureSet(GUEST_KEY,'1');
        await queryClient.cancelQueries();
        queryClient.clear();
        clearQuizResult();
        useStudyStore.getState().setScope('guest');
        setToken(null);
        setUser(GUEST_USER);
        setIsGuest(true);
        setGuestMode(true);

      },
      signOut: async () => {
        await Promise.all([secureDelete(SESSION_KEY),secureDelete(TOKEN_KEY),secureDelete(USER_KEY),secureDelete(GUEST_KEY)]);
        await queryClient.cancelQueries();
        queryClient.clear();
        clearQuizResult();
        useStudyStore.getState().setScope('guest');
        setToken(null);
        setUser(null);
        setIsGuest(false);
        setGuestMode(false);

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
