import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type Member = {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type OwnerProfile = { full_name: string | null; avatar_url: string | null } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [owner, setOwner] = useState<OwnerProfile>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [{ data: ownerProfile }, { data: memberRows }] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', ownerId).single(),
      supabase
        .from('trip_members')
        .select('id, user_id, invited_email, profiles(full_name, avatar_url)')
        .eq('trip_id', tripId),
    ]);
    setOwner(ownerProfile ?? null);
    setMembers((memberRows as Member[]) ?? []);
  }, [tripId, ownerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isOwner = session?.user.id === ownerId;
  const total = 1 + members.length;
  const allPeople = [
    { key: 'owner', name: owner?.full_name ?? 'Propietario', avatarUrl: owner?.avatar_url, pending: false, isOwner: true, memberId: null as string | null, invitedEmail: null as string | null },
    ...members.map((m) => ({
      key: m.id,
      name: m.profiles?.full_name ?? m.invited_email ?? 'Invitado',
      avatarUrl: m.profiles?.avatar_url,
      pending: !m.user_id,
      isOwner: false,
      memberId: m.id,
      invitedEmail: m.invited_email,
    })),
  ];
  const shown = allPeople.slice(0, 4);

  const openList = () => {
    setInviting(false);
    setError(null);
    setModalOpen(true);
  };

  const onInvite = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Introduce un email válido.');
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase
      .from('trip_members')
      .insert({ trip_id: tripId, invited_email: trimmed, role: 'editor' });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail('');
    setInviting(false);
    load();
  };

  const onRemove = async (memberId: string) => {
    await supabase.from('trip_members').delete().eq('id', memberId);
    load();
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.left} onPress={openList}>
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
        <Pressable
          onPress={() => {
            setInviting(true);
            setError(null);
            setModalOpen(true);
          }}
        >
          <Text style={styles.inviteLink}>+ invitar</Text>
        </Pressable>
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {inviting ? (
              <>
                <Text style={styles.cardTitle}>Invitar a este viaje</Text>
                <Text style={styles.cardBody}>
                  Guardamos la invitación; la persona tendrá acceso automáticamente al registrarse en Vuelve con ese
                  email.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@ejemplo.com"
                  placeholderTextColor={colors.ink38}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
                <Pressable
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={onInvite}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>{submitting ? 'Enviando…' : 'Enviar invitación'}</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setInviting(false)}>
                  <Text style={styles.cancelBtnText}>Volver a la lista</Text>
                </Pressable>
              </>
            ) : (
              <>
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
                          {p.isOwner ? 'Propietario' : p.pending ? `Invitación pendiente · ${p.invitedEmail}` : 'Colaborador'}
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
                  <Pressable style={styles.submitBtn} onPress={() => setInviting(true)}>
                    <Text style={styles.submitBtnText}>+ invitar a alguien</Text>
                  </Pressable>
                )}
                <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                  <Text style={styles.cancelBtnText}>Cerrar</Text>
                </Pressable>
              </>
            )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: 'rgba(234,226,214,0.4)',
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  stack: { flexDirection: 'row' },
  avatarWrap: { borderRadius: 14, borderWidth: 1.5, borderColor: colors.background },
  avatarImg: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.sandDark },
  avatarInitial: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  avatarInitialText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.background },
  avatarPending: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageLight },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink55, flexShrink: 1 },
  inviteLink: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.sage },
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
    marginTop: spacing.xs,
  },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 12.5 },
  submitBtn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14.5 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 13 },
});
