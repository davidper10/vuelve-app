import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// En web, signInWithOAuth hace una redirección de página completa (no un
// popup), así que al volver la sesión llega en la URL. En nativo esto no
// se ejecuta: ahí el resultado se resuelve directamente en signInWithOAuth
// a través de WebBrowser.openAuthSessionAsync.
async function consumeOAuthRedirectOnWeb() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  } else {
    return;
  }

  window.history.replaceState({}, '', url.pathname);
}

export type OAuthProvider = 'google' | 'apple';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consumeOAuthRedirectOnWeb().finally(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signInWithIdentifier: async (identifier, password) => {
        const trimmed = identifier.trim();
        let email = trimmed;

        if (!trimmed.includes('@')) {
          const { data: resolvedEmail } = await supabase.rpc('email_for_username', {
            username_input: trimmed,
          });
          if (!resolvedEmail) return { error: 'Usuario o contraseña incorrectos.' };
          email = resolvedEmail;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? 'Usuario/email o contraseña incorrectos.' : null };
      },
      signUp: async (email, password, fullName, username) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, username: username.trim().toLowerCase() } },
        });
        return { error: error?.message ?? null };
      },
      signInWithOAuth: async (provider) => {
        const redirectTo = AuthSession.makeRedirectUri();

        if (Platform.OS === 'web') {
          // Redirección de página completa: evita el bloqueo de popups que
          // sufre window.open() cuando se llama tras un await.
          const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
          return { error: error?.message ?? null };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data.url) {
          return { error: error?.message ?? 'No se pudo iniciar el inicio de sesión.' };
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') {
          return { error: null }; // el usuario canceló o cerró el navegador
        }

        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          return { error: exchangeErr?.message ?? null };
        }

        const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
        const accessToken = fragment.get('access_token');
        const refreshToken = fragment.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return { error: setErr?.message ?? null };
        }

        return { error: 'No se pudo completar el inicio de sesión.' };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
