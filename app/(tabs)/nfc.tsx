import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/lib/confirm-context';
import { useTrips } from '@/lib/use-trips';
import type { Tables } from '@/lib/database.types';

type NfcTag = Tables<'nfc_tags'> & {
  trips: { title: string } | null;
  moments: { title: string } | null;
};

type Moment = Tables<'moments'>;
type LinkType = 'trip' | 'moment';

const PUBLIC_BASE_URL = 'https://savetrip.vercel.app/m';

export default function Nfc() {
  const confirm = useConfirm();
  const { trips } = useTrips();
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NfcTag | null>(null);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [newLinkType, setNewLinkType] = useState<LinkType>('trip');
  const [newTripId, setNewTripId] = useState<string | null>(null);
  const [newMoments, setNewMoments] = useState<Moment[]>([]);
  const [newMomentId, setNewMomentId] = useState<string | null>(null);
  const [reconfiguringSaving, setReconfiguringSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('nfc_tags')
      .select('*, trips(title), moments(title)')
      .order('created_at', { ascending: false });
    setTags((data as NfcTag[]) ?? []);
    setLoading(false);
  }, []);

  // Recarga cada vez que se vuelve a esta pestaña (p.ej. tras vincular un NFC nuevo).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openTag = (tag: NfcTag) => {
    setSelected(tag);
    setLabel(tag.label);
    setCopied(false);
    setReconfiguring(false);
  };

  const closeModal = () => {
    setSelected(null);
    setReconfiguring(false);
  };

  const startReconfigure = (tag: NfcTag) => {
    setNewLinkType(tag.link_type === 'moment' ? 'moment' : 'trip');
    setNewTripId(tag.trip_id);
    setNewMomentId(tag.moment_id);
    setReconfiguring(true);
  };

  useEffect(() => {
    if (newLinkType !== 'moment' || !newTripId) {
      setNewMoments([]);
      return;
    }
    supabase
      .from('moments')
      .select('*')
      .eq('trip_id', newTripId)
      .order('occurred_at', { ascending: true })
      .then(({ data }) => setNewMoments(data ?? []));
  }, [newLinkType, newTripId]);

  const canSaveReconfigure = newLinkType === 'trip' ? !!newTripId : !!newTripId && !!newMomentId;

  const saveReconfigure = async () => {
    if (!selected || !canSaveReconfigure) return;
    setReconfiguringSaving(true);
    await supabase
      .from('nfc_tags')
      .update({
        link_type: newLinkType,
        trip_id: newTripId,
        moment_id: newLinkType === 'moment' ? newMomentId : null,
      })
      .eq('id', selected.id);
    setReconfiguringSaving(false);
    closeModal();
    load();
  };

  const saveLabel = async () => {
    if (!selected || !label.trim()) return;
    setSaving(true);
    await supabase.from('nfc_tags').update({ label: label.trim() }).eq('id', selected.id);
    setSaving(false);
    closeModal();
    load();
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const next = selected.status === 'active' ? 'inactive' : 'active';
    await supabase.from('nfc_tags').update({ status: next }).eq('id', selected.id);
    closeModal();
    load();
  };

  const copyLink = async () => {
    if (!selected) return;
    await Clipboard.setStringAsync(`${PUBLIC_BASE_URL}/${selected.public_slug}`);
    setCopied(true);
  };

  const onDelete = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: 'Eliminar NFC',
      message: `¿Quitar "${selected.label}"? El sticker físico dejará de funcionar.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    await supabase.from('nfc_tags').delete().eq('id', selected.id);
    closeModal();
    load();
  };

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
          <Pressable style={styles.card} onPress={() => openTag(item)}>
            <View style={styles.icon}>
              <Ionicons name={item.link_type === 'moment' ? 'image-outline' : 'radio-outline'} size={20} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardTarget} numberOfLines={1}>
                {item.moments?.title ?? item.trips?.title ?? 'Sin destino'}
              </Text>
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
          </Pressable>
        )}
      />

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {selected && !reconfiguring && (
              <>
                <Text style={styles.modalTitle}>Editar NFC</Text>
                <Text style={styles.modalTarget}>
                  Vinculado a: {selected.moments?.title ?? selected.trips?.title ?? 'sin destino'}
                </Text>

                <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholderTextColor={colors.ink38} />

                <Pressable style={styles.modalBtn} onPress={saveLabel} disabled={saving}>
                  <Text style={styles.modalBtnText}>{saving ? 'Guardando…' : 'Guardar nombre'}</Text>
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={toggleStatus}>
                  <Ionicons
                    name={selected.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={16}
                    color={colors.sageDark}
                  />
                  <Text style={styles.secondaryBtnText}>
                    {selected.status === 'active' ? 'Desactivar' : 'Activar'}
                  </Text>
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={copyLink}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.sageDark} />
                  <Text style={styles.secondaryBtnText}>{copied ? 'Enlace copiado' : 'Copiar enlace'}</Text>
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={() => startReconfigure(selected)}>
                  <Ionicons name="swap-horizontal-outline" size={16} color={colors.sageDark} />
                  <Text style={styles.secondaryBtnText}>Reconfigurar destino</Text>
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={16} color={colors.terracotta} />
                  <Text style={[styles.secondaryBtnText, { color: colors.terracotta }]}>Eliminar</Text>
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>Cerrar</Text>
                </Pressable>
              </>
            )}

            {selected && reconfiguring && (
              <ScrollView style={styles.reconfigureScroll}>
                <Text style={styles.modalTitle}>Reconfigurar "{selected.label}"</Text>
                <Text style={styles.modalTarget}>
                  El sticker físico no cambia — solo cambia a dónde apunta el enlace.
                </Text>

                <View style={styles.typeRow}>
                  <Pressable
                    style={[styles.typeOption, newLinkType === 'trip' && styles.typeOptionOn]}
                    onPress={() => setNewLinkType('trip')}
                  >
                    <Text style={[styles.typeOptionText, newLinkType === 'trip' && styles.typeOptionTextOn]}>
                      Un viaje entero
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.typeOption, newLinkType === 'moment' && styles.typeOptionOn]}
                    onPress={() => setNewLinkType('moment')}
                  >
                    <Text style={[styles.typeOptionText, newLinkType === 'moment' && styles.typeOptionTextOn]}>
                      Un momento
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.modalTarget, { marginTop: spacing.md }]}>Viaje</Text>
                {trips.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[styles.tripOption, newTripId === t.id && styles.tripOptionOn]}
                    onPress={() => {
                      setNewTripId(t.id);
                      setNewMomentId(null);
                    }}
                  >
                    <Text style={styles.tripOptionText}>{t.title}</Text>
                  </Pressable>
                ))}

                {newLinkType === 'moment' && newTripId && (
                  <>
                    <Text style={[styles.modalTarget, { marginTop: spacing.md }]}>Momento</Text>
                    {newMoments.length === 0 ? (
                      <Text style={styles.modalTarget}>Este viaje todavía no tiene momentos guardados.</Text>
                    ) : (
                      newMoments.map((m) => (
                        <Pressable
                          key={m.id}
                          style={[styles.tripOption, newMomentId === m.id && styles.tripOptionOn]}
                          onPress={() => setNewMomentId(m.id)}
                        >
                          <Text style={styles.tripOptionText}>{m.title}</Text>
                        </Pressable>
                      ))
                    )}
                  </>
                )}

                <Pressable
                  style={[styles.modalBtn, (!canSaveReconfigure || reconfiguringSaving) && { opacity: 0.5 }]}
                  onPress={saveReconfigure}
                  disabled={!canSaveReconfigure || reconfiguringSaving}
                >
                  <Text style={styles.modalBtnText}>{reconfiguringSaving ? 'Guardando…' : 'Guardar nuevo destino'}</Text>
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={() => setReconfiguring(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  cardTarget: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, marginTop: 1 },
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
  overlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  modalTarget: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  modalBtn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  modalBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.sageDark },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 13 },
  reconfigureScroll: { maxHeight: '80%' },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeOptionOn: { borderColor: colors.sage, backgroundColor: colors.sageLight },
  typeOptionText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink55 },
  typeOptionTextOn: { color: colors.sageDark },
  tripOption: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tripOptionOn: { borderColor: colors.sage, backgroundColor: colors.sand },
  tripOptionText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
});
