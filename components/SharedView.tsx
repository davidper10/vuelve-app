import type { ReactNode } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { APP_STORE_URL } from '@/constants/links';
import { flagForCountry } from '@/lib/flags';
import { mediaUrl, type SharedMedia, type SharedMoment, type SharedPayload } from '@/lib/shared';

function formatRange(start: string | null, end: string | null) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  return null;
}

function VideoTile({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
  });
  return <VideoView player={player} style={styles.media} contentFit="cover" nativeControls />;
}

function MediaTile({ item }: { item: SharedMedia }) {
  const url = mediaUrl(item.path);
  if (item.type === 'video') return <VideoTile url={url} />;
  return <Image source={{ uri: url }} style={styles.media} resizeMode="cover" />;
}

function MomentBlock({ moment }: { moment: SharedMoment }) {
  const date = moment.occurred_at
    ? new Date(moment.occurred_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return (
    <View style={styles.moment}>
      {date ? <Text style={styles.momentDate}>{date}</Text> : null}
      <Text style={styles.momentTitle}>{moment.title}</Text>
      {moment.place_name ? (
        <View style={styles.placeRow}>
          <Ionicons name="location-outline" size={14} color={colors.ink55} />
          <Text style={styles.place} numberOfLines={1}>
            {moment.place_name.split(',').slice(0, 2).join(',')}
          </Text>
        </View>
      ) : null}
      {moment.story ? <Text style={styles.story}>{moment.story}</Text> : null}
      {moment.media.length > 0 ? (
        <View style={styles.mediaList}>
          {moment.media.map((m) => (
            <MediaTile key={m.path} item={m} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function SharedButton({
  label,
  onPress,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable style={[styles.btn, primary ? styles.btnPrimary : styles.btnSecondary]} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={18} color={primary ? colors.background : colors.ink} /> : null}
      <Text style={[styles.btnText, { color: primary ? colors.background : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

// El botón de App Store solo existe en web y cuando la app ya tiene ficha.
export function AppStoreButton() {
  if (!APP_STORE_URL || Platform.OS !== 'web') return null;
  return <SharedButton variant="secondary" icon="logo-apple" label="Descargar en App Store" onPress={() => Linking.openURL(APP_STORE_URL!)} />;
}

// Vista de un viaje compartido: cabecera con portada y, si el enlace lo permite
// (content), los recuerdos en solo lectura. `actions` son los botones de debajo.
export function SharedView({
  data,
  content,
  actions,
  note,
}: {
  data: SharedPayload;
  content: boolean;
  actions: ReactNode;
  note?: string;
}) {
  const { trip, owner } = data;
  const range = formatRange(trip.start_date, trip.end_date);
  const flag = flagForCountry(trip.country);
  const ownerName = owner.full_name?.split(' ')[0];
  const counts =
    data.moment_count != null
      ? `${data.moment_count} ${data.moment_count === 1 ? 'recuerdo' : 'recuerdos'} · ${data.memory_count ?? 0} ${
          data.memory_count === 1 ? 'foto o vídeo' : 'fotos y vídeos'
        }`
      : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <View style={styles.cover}>
          {trip.cover_photo_url ? (
            <Image source={{ uri: trip.cover_photo_url }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sandDark }]} />
          )}
        </View>

        <View style={styles.head}>
          {ownerName ? <Text style={styles.eyebrow}>{ownerName} comparte contigo</Text> : null}
          <Text style={styles.title}>
            {flag ? `${flag} ` : ''}
            {trip.title}
          </Text>
          {trip.destination_summary ? <Text style={styles.summary}>{trip.destination_summary}</Text> : null}
          {range ? <Text style={styles.meta}>{range}</Text> : null}
          {!content && counts ? <Text style={styles.meta}>{counts}</Text> : null}
        </View>

        {note ? <Text style={styles.note}>{note}</Text> : null}
        <View style={styles.actions}>{actions}</View>

        {content ? data.moments.map((m) => <MomentBlock key={m.id} moment={m} />) : null}
        {content && data.moments.length === 0 ? <Text style={styles.empty}>Este viaje aún no tiene recuerdos.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: 560 },
  cover: { height: 240, backgroundColor: colors.sand, overflow: 'hidden' },
  head: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 4 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.terracotta, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink, lineHeight: 38 },
  summary: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink70, marginTop: 4 },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink55, marginTop: 2 },
  note: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink55, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  btnPrimary: { backgroundColor: colors.ink },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnText: { fontFamily: fonts.sansBold, fontSize: 15 },
  moment: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: 6 },
  momentDate: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink55, textTransform: 'uppercase', letterSpacing: 0.5 },
  momentTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  place: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink55, flexShrink: 1 },
  story: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.ink70, marginTop: 4 },
  mediaList: { gap: spacing.sm, marginTop: spacing.sm },
  media: { width: '100%', aspectRatio: 4 / 3, borderRadius: radii.md, backgroundColor: colors.sand },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink55, textAlign: 'center', marginTop: spacing.xl },
});
