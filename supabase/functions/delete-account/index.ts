import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Borra la cuenta del usuario que hace la petición (nunca un id
// arbitrario del body -- la identidad sale del JWT ya verificado por
// el runtime). Antes de borrar el usuario limpia sus fotos en Storage
// (el borrado de filas en Postgres va en cascada, pero Storage no).
Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: trips } = await adminClient.from("trips").select("id").eq("owner_id", userId);
    for (const trip of trips ?? []) {
      const { data: files } = await adminClient.storage.from("memories").list(trip.id);
      if (files?.length) {
        await adminClient.storage.from("memories").remove(files.map((f) => `${trip.id}/${f.name}`));
      }
    }

    const { data: avatarFiles } = await adminClient.storage.from("memories").list(`avatars/${userId}`);
    if (avatarFiles?.length) {
      await adminClient.storage.from("memories").remove(avatarFiles.map((f) => `avatars/${userId}/${f.name}`));
    }

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
