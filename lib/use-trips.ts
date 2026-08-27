import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Tables } from './database.types';

export type Trip = Tables<'trips'>;

// Hook mínimo de lectura de viajes del usuario autenticado (RLS ya filtra
// a "los viajes que puede ver": propios, en los que es miembro, o
// compartidos por enlace/NFC). Se puede sustituir más adelante por
// TanStack Query si la app crece.
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setTrips(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}
