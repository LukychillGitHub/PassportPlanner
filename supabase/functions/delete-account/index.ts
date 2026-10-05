import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Borra la cuenta de quien la llama (identificado por su JWT, nunca por un
// parametro). Los pasaportes que lidera pasan al miembro mas antiguo; si no
// queda nadie, el pasaporte se borra completo (actividades y sellos en
// cascada). Perfil, membresias, calificaciones y token de push se borran en
// cascada al borrar el usuario; lo que creo en pasaportes compartidos queda
// sin autor (created_by / sealed_by pasan a null).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Falta la sesion" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "Sesion invalida" }, 401);
  const uid = userData.user.id;

  const { data: ledPassports, error: ledError } = await admin
    .from("passports")
    .select("id")
    .eq("created_by", uid);
  if (ledError) return json({ error: ledError.message }, 500);

  for (const p of ledPassports ?? []) {
    const { data: others, error: othersError } = await admin
      .from("passport_members")
      .select("user_id")
      .eq("passport_id", p.id)
      .neq("user_id", uid)
      .order("joined_at", { ascending: true })
      .limit(1);
    if (othersError) return json({ error: othersError.message }, 500);

    const nextLeader = others?.[0]?.user_id;
    const { error: passportError } = nextLeader
      ? await admin.from("passports").update({ created_by: nextLeader }).eq("id", p.id)
      : await admin.from("passports").delete().eq("id", p.id);
    if (passportError) return json({ error: passportError.message }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) return json({ error: deleteError.message }, 500);

  return json({ ok: true });
});
