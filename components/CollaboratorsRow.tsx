import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const shown = [
    { key: 'owner', name: owner?.full_name ?? 'Propietario', avatarUrl: owner?.avatar_url, pending: false },
    ...members.map((m) => ({
      key: m.id,
      name: m.profiles?.full_name ?? m.invited_email,
      avatarUrl: m.profiles?.avatar_url,
      pending: !m.user_id,
    })),
  ].slice(0, 4);

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
    setModalOpen(false);
    load();
  };

  return (
    <View style={styles.row}>
      <View style={styles.left}>
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
      </View>

      {isOwner && (
        <Pressable onPress={() => setModalOpen(true)}>
          <Text style={styles.inviteLink}>+ invitar</Text>
        </Pressable>
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
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
            <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
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
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  cardBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, lineHeight: 18 },
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
