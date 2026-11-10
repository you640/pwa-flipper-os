import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS", "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { error: revokeError } = await admin.auth.admin.signOut(authHeader.slice(7), "global");
    if (revokeError) throw new Error("Session revocation failed");
    // Remove only objects under the verified user's own prefix, in bounded
    // batches. Never delete the auth identity if cleanup fails.
    const folders = [userData.user.id];
    let visited = 0;
    while (folders.length) {
      const folder = folders.pop()!;
      let offset = 0;
      const files: string[] = [];
      for (;;) {
        const { data: objects, error: listError } = await admin.storage.from("avatars").list(folder, { limit: 100, offset });
        if (listError) throw new Error("Avatar listing failed");
        for (const object of objects ?? []) {
          if (++visited > 10_000) throw new Error("Avatar cleanup limit reached");
          if (object.id) files.push(`${folder}/${object.name}`);
          else folders.push(`${folder}/${object.name}`);
        }
        if (!objects || objects.length < 100) break;
        offset += 100;
      }
      for (let start = 0; start < files.length; start += 100) {
        const { error: removeError } = await admin.storage.from("avatars").remove(files.slice(start, start + 100));
        if (removeError) throw new Error("Avatar cleanup failed");
      }
    }
    const { error: delErr } = await admin.auth.admin.deleteUser(userData.user.id);
    if (delErr) {
      return new Response(JSON.stringify({ error: "delete_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
