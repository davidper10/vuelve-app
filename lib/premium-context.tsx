import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export const ENTITLEMENT_ID = 'premium';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

type PremiumContextValue = {
  isPremium: boolean;
  loading: boolean;
};

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

let configured = false;

function configurePurchases() {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
  if (!apiKey) return;
  try {
    Purchases.configure({ apiKey });
    configured = true;
  } catch {
    // Módulo nativo no disponible todavía (p.ej. falta un rebuild nativo).
  }
}

export function PremiumProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const applyCustomerInfo = (info: CustomerInfo) => {
      setIsPremium(!!info.entitlements.active[ENTITLEMENT_ID]);
    };

    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    (async () => {
      try {
        if (session?.user.id) {
          const { customerInfo } = await Purchases.logIn(session.user.id);
          applyCustomerInfo(customerInfo);
        } else {
          const customerInfo = await Purchases.getCustomerInfo();
          applyCustomerInfo(customerInfo);
        }
      } catch {
        // RevenueCat no disponible (p.ej. en el preview web); se asume no premium.
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [session?.user.id]);

  // Refleja el estado de la suscripción en `profiles.is_premium` para que
  // otros usuarios (p.ej. alguien que se une a un viaje) puedan comprobar
  // el plan del dueño sin poder consultar RevenueCat directamente.
  useEffect(() => {
    if (loading || !session?.user.id) return;
    supabase.from('profiles').update({ is_premium: isPremium }).eq('id', session.user.id).then();
  }, [isPremium, loading, session?.user.id]);

  return <PremiumContext.Provider value={{ isPremium, loading }}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium debe usarse dentro de <PremiumProvider>');
  return ctx;
}
