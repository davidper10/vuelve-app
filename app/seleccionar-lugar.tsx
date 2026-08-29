import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { resolveLocation } from '@/lib/location-picker-bridge';

export default function SeleccionarLugar() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const initialLat = params.lat ? Number(params.lat) : null;
  const initialLng = params.lng ? Number(params.lng) : null;

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(false);

  useEffect(() => {
    if (!picked) return;
    let cancelled = false;
    setLoadingName(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${picked.lat}&lon=${picked.lng}&zoom=14`,
      { headers: { 'Accept-Language': 'es' } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPlaceName(data?.display_name ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlaceName(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingName(false);
      });
    return () => {
      cancelled = true;
    };
  }, [picked]);

  const onCancel = () => {
    resolveLocation(null);
    router.back();
  };

  const onConfirm = () => {
    if (!picked) return;
    resolveLocation({ lat: picked.lat, lng: picked.lng, placeName });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <LocationPicker initialLat={initialLat} initialLng={initialLng} onPick={(lat, lng) => setPicked({ lat, lng })} />

      <View style={styles.topBar}>
        <Pressable style={styles.roundBtn} onPress={onCancel}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.hint}>Toca el mapa para colocar el pin</Text>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.placeText} numberOfLines={2}>
          {!picked
            ? 'Ningún lugar seleccionado todavía'
            : loadingName
              ? 'Buscando el nombre del lugar…'
              : (placeName ?? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`)}
        </Text>
        <Pressable style={[styles.confirmBtn, !picked && { opacity: 0.5 }]} onPress={onConfirm} disabled={!picked}>
          <Text style={styles.confirmBtnText}>Confirmar lugar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 2,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  hint: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12.5,
    color: colors.ink,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  placeText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink70 },
  confirmBtn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15 },
});
