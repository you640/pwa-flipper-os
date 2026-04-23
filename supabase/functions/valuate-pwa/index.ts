import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  mrr: z.number().nonnegative().max(10_000_000),
  expenses: z.number().nonnegative().max(10_000_000),
  niche: z.string().trim().min(1).max(80),
  tech_stack: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(800).optional().or(z.literal("")),
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
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const input = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are a senior micro-SaaS / PWA broker who values small internet businesses sold on Acquire.com, MicroAcquire, and Flippa. You produce realistic, conservative valuations in USD for the EU/global market. Weigh:
- Net profit (MRR - expenses), trailing assumed stable
- Niche multipliers: Booking 36-48x, B2B SaaS 30-42x, E-commerce 24-36x, Dev Tool 20-30x, Content/Affiliate 18-28x
- Risk: revenue concentration, churn, dependencies, age, tech debt
- If net profit <= 0, value as ASSET (code + traffic + brand) at 500-5000 USD
Return strictly via the tool. No prose.`;

    const userPrompt = `Value this PWA / micro-SaaS:
Name: ${input.name}
URL: ${input.url || "n/a"}
MRR: $${input.mrr}
Monthly expenses: $${input.expenses}
Niche: ${input.niche}
Tech stack: ${input.tech_stack || "unknown"}
Notes: ${input.notes || "none"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_valuation",
              description: "Return a structured PWA valuation report.",
              parameters: {
                type: "object",
                properties: {
                  estimated_valuation: {
                    type: "object",
                    properties: {
                      low: { type: "number" },
                      mid: { type: "number" },
                      high: { type: "number" },
                    },
                    required: ["low", "mid", "high"],
                    additionalProperties: false,
                  },
                  multiple: { type: "number", description: "Effective multiple of monthly net profit (or 0 if asset-only)" },
                  risk_score: { type: "integer", minimum: 1, maximum: 10 },
                  value_up_tips: {
                    type: "array",
                    minItems: 3,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                        detail: { type: "string" },
                      },
                      required: ["title", "impact", "detail"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "2-3 sentence executive summary" },
                },
                required: ["estimated_valuation", "multiple", "risk_score", "value_up_tips", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_valuation" } },
        max_tokens: 800,
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
    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ report, inputs: input }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("valuate-pwa error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
