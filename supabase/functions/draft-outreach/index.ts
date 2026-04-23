import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { lead_id, portfolio_id } = parsed.data;

    const [{ data: lead }, { data: app }, { data: profile }, { data: latestAudit }] = await Promise.all([
      supabase.from("crm_leads").select("agency_name,contact_email,notes").eq("id", lead_id).maybeSingle(),
      supabase.from("portfolio").select("name,mrr,expenses,asking_price,status").eq("id", portfolio_id).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase
        .from("portfolio_audits")
        .select("ai_report")
        .eq("portfolio_id", portfolio_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!lead || !app) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiReport = (latestAudit?.ai_report as any) ?? null;
    const valueTips = aiReport?.value_up_tips ?? [];
    const summary = aiReport?.summary ?? "";
    const codeScore = aiReport?.code_quality_score;
    const codeLabel = aiReport?.code_quality_label;
    const excellence: string[] = aiReport?.tech_stack_audit?.excellence ?? [];
    const detectedStack: string[] = aiReport?.tech_stack_audit?.detected_stack ?? [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You write killer, technically informed cold outreach emails for a solo PWA / micro-SaaS flipper pitching agencies on acquiring an existing app. Rules:
- Max 140 words in the body
- Open with ONE specific observation about the agency's niche/work (infer from their name)
- If a Code Quality score is provided, mention it naturally with ONE concrete tech excellence (e.g. "92% Code Quality, TypeScript + tests + CI") — this is your differentiator
- Tie MRR + 1 value-up tip to "their book of business"
- One clear CTA (15-min call this week)
- Sign off with sender's name only (no fake company)
- Tone: consultative, confident, never spammy, no exclamation marks, no emoji
Return strictly via the tool.`;

    const userPrompt = `Sender name: ${profile?.display_name || "the founder"}
Agency: ${lead.agency_name}
Contact email: ${lead.contact_email || "unknown"}
Lead notes: ${lead.notes || "none"}

App for sale:
- Name: ${app.name}
- MRR: $${app.mrr}
- Monthly expenses: $${app.expenses}
- Asking: $${app.asking_price}
- Status: ${app.status}

Code audit:
- Code Quality score: ${codeScore != null ? `${codeScore}/100 (${codeLabel})` : "not audited"}
- Detected stack: ${detectedStack.join(", ") || "n/a"}
- Tech excellence: ${excellence.slice(0, 3).join(" | ") || "n/a"}

AI valuation summary: ${summary || "n/a"}
Top value-up tips:
${valueTips.map((t: any, i: number) => `${i + 1}. [${t.impact}] ${t.title} — ${t.detail}`).join("\n") || "n/a"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_email",
              description: "Return the cold email subject and body.",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Compelling subject under 70 chars" },
                  body_markdown: { type: "string", description: "Email body in plain markdown, max 140 words" },
                  tone: { type: "string", enum: ["consultative", "direct", "warm"] },
                },
                required: ["subject", "body_markdown", "tone"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_email" } },
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call", JSON.stringify(aiJson));
      return new Response(JSON.stringify({ error: "no_tool_call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const draft = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ draft, has_audit: !!latestAudit, contact_email: lead.contact_email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("draft-outreach error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
