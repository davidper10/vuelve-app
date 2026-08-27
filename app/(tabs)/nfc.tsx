import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type NfcTag = Tables<'nfc_tags'>;

export default function Nfc() {
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('nfc_tags').select('*').order('created_at', { ascending: false });
    setTags(data ?? []);
    setLoading(false);
  }, []);

  // Recarga cada vez que se vuelve a esta pestaña (p.ej. tras vincular un NFC nuevo).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis recuerdos NFC</Text>
        <Text style={styles.subtitle}>Objetos conectados a tus viajes</Text>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Todavía no has vinculado ningún NFC.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="radio-outline" size={20} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, item.status !== 'active' && { backgroundColor: colors.ink38 }]} />
                <Text style={styles.statusText}>{item.status === 'active' ? 'Activo' : 'Inactivo'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
          </View>
        )}
      />

      <Pressable style={styles.cta} onPress={() => router.push('/vincular-nfc')}>
        <Ionicons name="add" size={18} color={colors.background} />
        <Text style={styles.ctaText}>Vincular un NFC</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: 60 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink },
  subtitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink55, marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 140, gap: spacing.sm },
  empty: { fontFamily: fonts.sans, color: colors.ink55, fontSize: 14, marginTop: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage },
  statusText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.sage },
  cta: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 24,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
});
