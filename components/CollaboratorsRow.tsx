import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { usePremium } from '@/lib/premium-context';
import { presentPaywall } from '@/lib/paywall';
import { FREE_COLLABORATOR_LIMIT } from '@/lib/limits';
import { QrCode } from '@/components/QrCode';

const PUBLIC_BASE_URL = 'https://www.savetrip-app.com/unirse';

function randomSlug(length = 8) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type Member = {
  id: string;
  user_id: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type OwnerProfile = { full_name: string | null; avatar_url: string | null } | null;

type ShareMode = 'view' | 'collab';

const MODE_COPY: Record<ShareMode, { label: string; description: string }> = {
  view: {
    label: 'Solo ver',
    description: 'Cualquiera con el enlace puede ver el viaje, sin necesidad de cuenta. No puede editar nada.',
  },
  collab: {
    label: 'Colaborar',
    description: 'Quien abra el enlace puede unirse al viaje y añadir recuerdos. Necesita cuenta en SaveTrip.',
  },
};

function SharePanel({
  active,
  mode,
  url,
  busy,
  copied,
  onSelectMode,
  onEnable,
  onCopy,
  onShare,
  onDisable,
}: {
  active: boolean;
  mode: ShareMode;
  url: string | null;
  busy: boolean;
  copied: boolean;
  onSelectMode: (mode: ShareMode) => void;
  onEnable: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDisable: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  return (
    <View style={styles.panel}>
      <View style={styles.segment}>
        {(['view', 'collab'] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.segmentBtn, mode === m && styles.segmentBtnOn]}
            onPress={() => onSelectMode(m)}
            disabled={busy}
          >
            <Text style={[styles.segmentText, mode === m && styles.segmentTextOn]}>{MODE_COPY[m].label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardBody}>{MODE_COPY[mode].description}</Text>

      {active && url ? (
        <>
          <Text style={styles.shareUrl} numberOfLines={1}>
            {url}
          </Text>
          <View style={styles.shareBtnRow}>
            <Pressable style={styles.shareBtnSmall} onPress={onCopy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={colors.sageDark} />
              <Text style={styles.shareBtnSmallText}>{copied ? 'Copiado' : 'Copiar'}</Text>
            </Pressable>
            <Pressable style={styles.shareBtnSmall} onPress={onShare}>
              <Ionicons name="share-social-outline" size={14} color={colors.sageDark} />
              <Text style={styles.shareBtnSmallText}>Compartir</Text>
            </Pressable>
            <Pressable style={styles.shareBtnSmall} onPress={() => setShowQr((v) => !v)}>
              <Ionicons name="qr-code-outline" size={14} color={colors.sageDark} />
              <Text style={styles.shareBtnSmallText}>{showQr ? 'Ocultar QR' : 'QR'}</Text>
            </Pressable>
          </View>
          {showQr ? (
            <View style={styles.qrBox}>
              <QrCode value={url} size={196} />
              <Text style={styles.qrHint}>Escanéalo con la cámara para abrir el viaje</Text>
            </View>
          ) : null}
          <Pressable style={styles.disableLink} onPress={onDisable} disabled={busy}>
            <Text style={styles.disableLinkText}>Desactivar enlace</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.shareBtnRow}>
          <Pressable style={styles.shareBtnSmall} onPress={onEnable} disabled={busy}>
            <Ionicons name="link-outline" size={14} color={colors.sageDark} />
            <Text style={styles.shareBtnSmallText}>{busy ? 'Generando…' : 'Generar enlace'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Avatar({ name, avatarUrl, pending }: { name: string | null; avatarUrl?: string | null; pending?: boolean }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />;
  }
  if (pending) {
    return (
      <View style={[styles.avatarImg, styles.avatarPending]}>
        <Ionicons name="mail-outline" size={13} color={colors.sageDark} />
      </View>
    );
  }
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.avatarImg, styles.avatarInitial]}>
      <Text style={styles.avatarInitialText}>{initial}</Text>
    </View>
  );
}

export function CollaboratorsRow({ tripId, ownerId }: { tripId: string; ownerId: string }) {
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const [owner, setOwner] = useState<OwnerProfile>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [shareMode, setShareMode] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [allowAdd, setAllowAdd] = useState(false);
  const [pendingMode, setPendingMode] = useState<ShareMode>('view');
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [{ data: ownerProfile }, { data: memberRows }, { data: share }] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', ownerId).single(),
      supabase
        .from('trip_members')
        .select('id, user_id, profiles(full_name, avatar_url)')
        .eq('trip_id', tripId),
      supabase.from('trip_shares').select('share_mode, public_slug, allow_add_memories').eq('trip_id', tripId).maybeSingle(),
    ]);
    setOwner(ownerProfile ?? null);
    setMembers((memberRows as Member[]) ?? []);
    setShareMode(share?.share_mode ?? null);
    setShareSlug(share?.public_slug ?? null);
    setAllowAdd(share?.allow_add_memories ?? false);
  }, [tripId, ownerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isOwner = session?.user.id === ownerId;
  const total = 1 + members.length;
  const allPeople = [
    { key: 'owner', name: owner?.full_name ?? 'Propietario', avatarUrl: owner?.avatar_url, pending: false, isOwner: true, memberId: null as string | null },
    ...members.map((m) => ({
      key: m.id,
      name: m.profiles?.full_name ?? 'Invitado',
      avatarUrl: m.profiles?.avatar_url,
      pending: !m.user_id,
      isOwner: false,
      memberId: m.id,
    })),
  ];
  const shown = allPeople.slice(0, 4);

  const onRemove = async (memberId: string) => {
    await supabase.from('trip_members').delete().eq('id', memberId);
    load();
  };

  const linkActive = shareMode === 'link';
  const shareUrl = shareSlug ? `${PUBLIC_BASE_URL}/${shareSlug}` : null;

  const currentMode: ShareMode = linkActive ? (allowAdd ? 'collab' : 'view') : pendingMode;

  // El plan gratuito limita las personas que pueden colaborar; ver no cuenta.
  const canUseCollab = async () => {
    if (!isPremium && total >= FREE_COLLABORATOR_LIMIT) return presentPaywall();
    return true;
  };

  const enableLink = async () => {
    if (pendingMode === 'collab' && !(await canUseCollab())) return;
    setShareBusy(true);
    const slug = shareSlug ?? randomSlug();
    await supabase
      .from('trip_shares')
      .upsert({ trip_id: tripId, share_mode: 'link', public_slug: slug, allow_add_memories: pendingMode === 'collab' });
    setShareBusy(false);
    load();
  };

  const selectMode = async (mode: ShareMode) => {
    if (!linkActive) {
      setPendingMode(mode);
      return;
    }
    if (mode === currentMode) return;
    if (mode === 'collab' && !(await canUseCollab())) return;
    setShareBusy(true);
    await supabase.from('trip_shares').update({ allow_add_memories: mode === 'collab' }).eq('trip_id', tripId);
    setShareBusy(false);
    load();
  };

  const disableLink = async () => {
    setShareBusy(true);
    await supabase.from('trip_shares').update({ share_mode: 'private' }).eq('trip_id', tripId);
    setShareBusy(false);
    load();
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
  };

  const shareLink = async () => {
    if (!shareUrl) return;
    try {
      await Share.share({ message: shareUrl });
    } catch {
      // el usuario canceló el share sheet
    }
  };

  const onAddPress = () => setAddModalOpen(true);

  return (
    <View style={styles.row}>
      <Pressable style={styles.left} onPress={() => setModalOpen(true)}>
        <View style={styles.stack}>
          {shown.map((p, i) => (
            <View key={p.key} style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: shown.length - i }]}>
              <Avatar name={p.name} avatarUrl={p.avatarUrl} pending={p.pending} />
            </View>
          ))}
        </View>
        <Text style={styles.label}>
          Álbum Colaborativo ({total} {total === 1 ? 'participante' : 'participantes'})
        </Text>
      </Pressable>

      {isOwner && (
        <Pressable style={styles.addBtn} onPress={onAddPress}>
          <Ionicons name="add" size={16} color={colors.background} />
        </Pressable>
      )}

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compartir viaje</Text>
            <SharePanel
              active={linkActive}
              mode={currentMode}
              url={shareUrl}
              busy={shareBusy}
              copied={copied}
              onSelectMode={selectMode}
              onEnable={enableLink}
              onCopy={copyLink}
              onShare={shareLink}
              onDisable={disableLink}
            />

            <Pressable style={styles.cancelBtn} onPress={() => setAddModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Colaboradores</Text>
            <Text style={styles.cardBody}>Personas con acceso a este álbum.</Text>

            <ScrollView style={styles.list}>
              {allPeople.map((p) => (
                <View key={p.key} style={styles.listRow}>
                  <Avatar name={p.name} avatarUrl={p.avatarUrl} pending={p.pending} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.listMeta}>
                      {p.isOwner ? 'Propietario' : p.pending ? 'Invitación pendiente' : 'Colaborador'}
                    </Text>
                  </View>
                  {isOwner && !p.isOwner && p.memberId && (
                    <Pressable onPress={() => onRemove(p.memberId!)} style={styles.removeBtn}>
                      <Ionicons name="close" size={14} color={colors.terracotta} />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>

            {isOwner && (
              <View style={styles.shareSection}>
                <Text style={styles.shareTitle}>Enlace para compartir</Text>
                <SharePanel
                  active={linkActive}
                  mode={currentMode}
                  url={shareUrl}
                  busy={shareBusy}
                  copied={copied}
                  onSelectMode={selectMode}
                  onEnable={enableLink}
                  onCopy={copyLink}
                  onShare={shareLink}
                  onDisable={disableLink}
                />
              </View>
            )}

            <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.sageLight,
    borderRadius: radii.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  stack: { flexDirection: 'row' },
  avatarWrap: { borderRadius: 14, borderWidth: 1.5, borderColor: colors.background },
  avatarImg: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.sandDark },
  avatarInitial: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  avatarInitialText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.background },
  avatarPending: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageLight },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink55, flexShrink: 1 },
  addBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  cardBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, lineHeight: 18 },
  list: { marginTop: spacing.xs },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  listMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink55, marginTop: 1 },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracottaLight,
  },
  panel: { gap: spacing.sm },
  segment: { flexDirection: 'row', backgroundColor: colors.sand, borderRadius: radii.pill, padding: 3 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radii.pill },
  segmentBtnOn: { backgroundColor: colors.background },
  segmentText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink55 },
  segmentTextOn: { color: colors.ink },
  qrBox: { alignItems: 'center', gap: 8, paddingVertical: spacing.sm },
  qrHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, textAlign: 'center' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 13 },
  shareSection: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    gap: 8,
  },
  shareTitle: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.ink },
  shareUrl: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.sageDark, backgroundColor: colors.sageLight, borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 10 },
  shareBtnRow: { flexDirection: 'row', gap: 8 },
  shareBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingVertical: 9,
  },
  shareBtnSmallText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.sageDark },
  disableLink: { alignItems: 'center', paddingVertical: 6 },
  disableLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.terracotta },
});
