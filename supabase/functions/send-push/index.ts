import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type PushType = "photos_added" | "member_joined" | "nfc_scanned";

type RequestBody = {
  type: PushType;
  tripId?: string;
  tagId?: string;
  momentId?: string;
  count?: number;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_LIMIT = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Envía a los destinatarios ya resueltos, filtrando por preferencia
// (notification_preferences) y por dispositivos registrados (devices),
// en tandas de EXPO_BATCH_LIMIT como pide la API de Expo.
async function sendToRecipients(
  adminClient: ReturnType<typeof createClient>,
  recipientIds: string[],
  prefColumn: "colaborativos" | "nfc",
  title: string,
  bodyText: string,
  data: Record<string, unknown>
) {
  if (recipientIds.length === 0) return;

  const { data: prefs } = await adminClient
    .from("notification_preferences")
    .select(`user_id, ${prefColumn}`)
    .in("user_id", recipientIds);
  // Fila ausente = el usuario nunca activó esta categoría = no se envía.
  const optedIn = new Set(
    (prefs ?? []).filter((p: Record<string, unknown>) => p[prefColumn] === true).map((p: Record<string, unknown>) => p.user_id as string)
  );
  if (optedIn.size === 0) return;

  const { data: devices } = await adminClient.from("devices").select("expo_push_token").in("user_id", [...optedIn]);
  const tokens = [...new Set((devices ?? []).map((d: { expo_push_token: string }) => d.expo_push_token))];
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({ to, title, body: bodyText, data, sound: "default" }));
  for (let i = 0; i < messages.length; i += EXPO_BATCH_LIMIT) {
    const chunk = messages.slice(i, i + EXPO_BATCH_LIMIT);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      const result = await res.json().catch(() => null);
      // Errores por-mensaje (p.ej. DeviceNotRegistered) sólo se loguean;
      // el pruneo de `devices` obsoletos queda para una limpieza futura.
      if (!res.ok) console.error("expo push batch failed", result);
    } catch (e) {
      console.error("expo push fetch error", e);
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // El actor puede ser anónimo: app/m/[slug].tsx (escaneo NFC) no exige
    // sesión. Para los otros dos tipos el actor siempre viene autenticado
    // porque sus pantallas de origen ya exigen sesión.
    let actorId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: userData } = await userClient.auth.getUser();
      actorId = userData.user?.id ?? null;
    }

    const body = (await req.json()) as RequestBody;

    if ((body.type === "photos_added" || body.type === "member_joined") && !actorId) {
      return json({ error: "Sesión inválida" }, 401);
    }

    if (body.type === "photos_added") {
      if (!body.tripId || !body.count) return json({ ok: true });
      const [{ data: trip }, { data: members }, { data: actorProfile }] = await Promise.all([
        adminClient.from("trips").select("title, owner_id").eq("id", body.tripId).single(),
        adminClient.from("trip_members").select("user_id").eq("trip_id", body.tripId),
        adminClient.from("profiles").select("full_name").eq("id", actorId!).maybeSingle(),
      ]);
      const recipientIds = new Set<string>();
      if (trip?.owner_id) recipientIds.add(trip.owner_id);
      for (const m of members ?? []) if (m.user_id) recipientIds.add(m.user_id);
      recipientIds.delete(actorId!);

      const name = actorProfile?.full_name ?? "Alguien";
      const count = body.count;
      const bodyText = `${name} añadió ${count} ${count === 1 ? "foto" : "fotos"} a vuestro viaje a ${trip?.title ?? ""}`;
      await sendToRecipients(adminClient, [...recipientIds], "colaborativos", "Nuevas fotos", bodyText, {
        type: "colaborativo_fotos",
        tripId: body.tripId,
        momentId: body.momentId,
      });
    } else if (body.type === "member_joined") {
      if (!body.tripId) return json({ ok: true });
      const [{ data: trip }, { data: members }, { data: actorProfile }] = await Promise.all([
        adminClient.from("trips").select("title, owner_id").eq("id", body.tripId).single(),
        adminClient.from("trip_members").select("user_id").eq("trip_id", body.tripId),
        adminClient.from("profiles").select("full_name").eq("id", actorId!).maybeSingle(),
      ]);
      const recipientIds = new Set<string>();
      if (trip?.owner_id) recipientIds.add(trip.owner_id);
      for (const m of members ?? []) if (m.user_id) recipientIds.add(m.user_id);
      recipientIds.delete(actorId!);

      const name = actorProfile?.full_name ?? "Alguien";
      const bodyText = `${name} se unió a ${trip?.title ?? ""}`;
      await sendToRecipients(adminClient, [...recipientIds], "colaborativos", "Nuevo colaborador", bodyText, {
        type: "colaborativo_miembro",
        tripId: body.tripId,
      });
    } else if (body.type === "nfc_scanned") {
      if (!body.tagId) return json({ ok: true });
      const { data: tag } = await adminClient
        .from("nfc_tags")
        .select("owner_id, label, trip_id, moment_id")
        .eq("id", body.tagId)
        .maybeSingle();
      if (!tag) return json({ ok: true });
      if (actorId && actorId === tag.owner_id) return json({ ok: true }); // el dueño escaneó su propio imán

      const bodyText = `Tu imán de ${tag.label} fue abierto`;
      await sendToRecipients(adminClient, [tag.owner_id], "nfc", "Actividad NFC", bodyText, {
        type: "nfc_actividad",
        tripId: tag.trip_id ?? undefined,
        momentId: tag.moment_id ?? undefined,
      });
    } else {
      return json({ error: "Tipo desconocido" }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
