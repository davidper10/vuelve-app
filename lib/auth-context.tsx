import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

// En web, el login con Google hace una redirección de página completa (no
// un popup), así que al volver la sesión llega en la URL. En nativo esto
// no se ejecuta: ahí se usa el SDK nativo de Google/Apple directamente.
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

// Los enlaces de recuperación de contraseña llegan de forma pasiva (el
// usuario los abre desde su app de Correo). Se procesan aquí en cuanto
// el sistema operativo entrega la URL. El login con Google/Apple ya no
// pasa por esquemas de URL (usa los SDKs nativos), así que no hay
// riesgo de que este listener interfiera con ellos.
async function exchangeUrlForSession(url: string) {
  const { params, errorCode } = getQueryParams(url);
  if (errorCode || !params || params.type !== 'recovery') return;
  if (params.code) {
    await supabase.auth.exchangeCodeForSession(params.code);
  } else if (params.access_token && params.refresh_token) {
    await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
  }
}

let googleConfigured = false;
function configureGoogleSignIn() {
  if (googleConfigured || Platform.OS === 'web') return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  resetPasswordWithRecoverySession: (newPassword: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
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

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/restablecer-contrasena');
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Enlace de restablecer contraseña abierto desde fuera de la app (Correo).
  // En web ya lo cubre consumeOAuthRedirectOnWeb() vía window.location.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Linking.getInitialURL().then((url) => {
      if (url) exchangeUrlForSession(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      exchangeUrlForSession(url);
    });
    return () => sub.remove();
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
      signInWithGoogle: async () => {
        if (Platform.OS === 'web') {
          // En web no hay SDK nativo: se mantiene el redirect de página
          // completa (evita el bloqueo de popups de window.open() tras un
          // await). consumeOAuthRedirectOnWeb() procesa la vuelta.
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: AuthSession.makeRedirectUri() },
          });
          return { error: error?.message ?? null };
        }

        configureGoogleSignIn();
        try {
          if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
          const response = await GoogleSignin.signIn();
          if (!isSuccessResponse(response) || !response.data.idToken) {
            return { error: 'No se pudo completar el inicio de sesión con Google.' };
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.data.idToken,
          });
          return { error: error?.message ?? null };
        } catch (e: any) {
          if (e.code === statusCodes.SIGN_IN_CANCELLED) return { error: null };
          return { error: 'No se pudo iniciar sesión con Google.' };
        }
      },
      signInWithApple: async () => {
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.identityToken) {
            return { error: 'No se pudo completar el inicio de sesión con Apple.' };
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });
          return { error: error?.message ?? null };
        } catch (e: any) {
          if (e.code === 'ERR_REQUEST_CANCELED') return { error: null };
          return { error: 'No se pudo iniciar sesión con Apple.' };
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      changePassword: async (currentPassword, newPassword) => {
        const email = session?.user.email;
        if (!email) return { error: 'No se pudo verificar la sesión.' };

        const { error: verifyErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (verifyErr) return { error: 'La contraseña actual no es correcta.' };

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
      requestPasswordReset: async (email) => {
        const redirectTo = AuthSession.makeRedirectUri();
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        return { error: error?.message ?? null };
      },
      resetPasswordWithRecoverySession: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
      deleteAccount: async () => {
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) {
          const body = await error.context?.json?.().catch(() => null);
          return { error: body?.error ?? error.message };
        }
        await supabase.auth.signOut();
        return { error: null };
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
