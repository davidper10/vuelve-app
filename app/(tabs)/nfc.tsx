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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Objetos Conectados</Text>
          <Text style={styles.subtitle}>Tus recuerdos físicos enlazados con NFC</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => router.push('/vincular-nfc')}>
          <Ionicons name="wifi" size={12} color={colors.background} />
          <Text style={styles.headerBtnText}>Vincular NFC</Text>
        </Pressable>
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
        ListFooterComponent={
          <View style={styles.explainer}>
            <View style={styles.explainerTitleRow}>
              <Ionicons name="sparkles" size={13} color={colors.terracotta} />
              <Text style={styles.explainerTitle}>¿Cómo funciona la magia NFC?</Text>
            </View>
            <Text style={styles.explainerBody}>
              Pega un pequeño sticker NFC en un álbum de fotos, una postal o cualquier objeto físico.
              Al acercar un smartphone se abrirá al instante el recuerdo vinculado, sin instalar nada.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="radio-outline" size={20} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'active' ? styles.statusPillActive : styles.statusPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'active' ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {item.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
                {!!item.public_slug && (
                  <View style={styles.linkPill}>
                    <Text style={styles.linkPillText} numberOfLines={1}>
                      Link: {item.public_slug}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, paddingTop: 60, gap: spacing.sm },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginTop: 3 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  headerBtnText: { fontFamily: fonts.sansSemiBold, color: colors.background, fontSize: 12 },
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  statusPill: { borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  statusPillActive: { backgroundColor: '#DCF3E3' },
  statusPillInactive: { backgroundColor: colors.sand },
  statusText: { fontFamily: fonts.sansBold, fontSize: 10.5 },
  statusTextActive: { color: '#1E7A45' },
  statusTextInactive: { color: colors.ink55 },
  linkPill: { backgroundColor: colors.sageLight, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  linkPillText: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: colors.sageDark },
  explainer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 6,
  },
  explainerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  explainerTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink },
  explainerBody: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink55, lineHeight: 17 },
});
