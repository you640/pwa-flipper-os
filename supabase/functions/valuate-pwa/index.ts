import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";
import { z } from "https://esm.sh/zod@4.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  github_url: z
    .string()
    .trim()
    .regex(
      /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i,
      "Must be a github.com/owner/repo URL",
    )
    .max(300),
  mrr: z.number().nonnegative().max(10_000_000),
  expenses: z.number().nonnegative().max(10_000_000),
  niche: z.string().trim().min(1).max(80),
  tech_stack: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(800).optional().or(z.literal("")),
  // Anonymous flow (no JWT). Server enforces 1 audit / IP / 24h.
  anonymous: z.boolean().optional(),
});

interface RepoSnapshot {
  full_name: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  open_issues: number;
  size_kb: number;
  default_branch: string;
  pushed_at: string | null;
  created_at: string | null;
  topics: string[];
  license: string | null;
  has_tests: boolean;
  has_ci: boolean;
  has_readme: boolean;
  has_typescript: boolean;
  package_manager: string | null;
  framework_hints: string[];
  recent_commits_30d: number;
  fetch_error?: string;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchRepoSnapshot(
  githubUrl: string,
): Promise<RepoSnapshot | { fetch_error: string }> {
  try {
    const m = githubUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    if (!m) return { fetch_error: "invalid_url" };
    const [, owner, repo] = m;
    const headers: Record<string, string> = {
      "User-Agent": "rubberduck-space/valuate-pwa",
      Accept: "application/vnd.github+json",
    };
    const ghToken = Deno.env.get("GITHUB_TOKEN");
    if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

    const base = `https://api.github.com/repos/${owner}/${repo}`;
    const repoRes = await fetch(base, { headers });
    if (!repoRes.ok) {
      return {
        fetch_error:
          repoRes.status === 404
            ? "repo_not_found"
            : repoRes.status === 403
              ? "rate_limit"
              : `http_${repoRes.status}`,
      };
    }
    const repoData = await repoRes.json();

    const [langsRes, treeRes, commitsRes] = await Promise.all([
      fetch(`${base}/languages`, { headers }),
      fetch(`${base}/git/trees/${repoData.default_branch}?recursive=1`, { headers }),
      fetch(
        `${base}/commits?since=${new Date(
          Date.now() - 30 * 24 * 3600 * 1000,
        ).toISOString()}&per_page=100`,
        { headers },
      ),
    ]);

    const languages = langsRes.ok ? await langsRes.json() : {};
    const tree = treeRes.ok ? await treeRes.json() : { tree: [] };
    const commits = commitsRes.ok ? await commitsRes.json() : [];

    const paths: string[] = (tree.tree ?? []).map((n: { path: string }) =>
      String(n.path).toLowerCase(),
    );
    const has = (re: RegExp) => paths.some((p) => re.test(p));

    const has_tests =
      has(/(^|\/)__tests__\//) ||
      has(/\.(test|spec)\.[tj]sx?$/) ||
      has(/(^|\/)(tests?|e2e)\//) ||
      has(/(^|\/)cypress\.config\./) ||
      has(/(^|\/)playwright\.config\./);
    const has_ci =
      has(/^\.github\/workflows\//) ||
      has(/(^|\/)\.gitlab-ci\.yml$/) ||
      has(/(^|\/)\.circleci\//);
    const has_readme = has(/^readme(\.md|\.mdx|\.rst|\.txt)?$/);
    const has_typescript =
      has(/(^|\/)tsconfig\.json$/) || !!languages["TypeScript"];

    const package_manager = has(/^pnpm-lock\.yaml$/)
      ? "pnpm"
      : has(/^yarn\.lock$/)
        ? "yarn"
        : has(/^bun\.lockb?$/)
          ? "bun"
          : has(/^package-lock\.json$/)
            ? "npm"
            : has(/^poetry\.lock$/)
              ? "poetry"
              : has(/^cargo\.lock$/)
                ? "cargo"
                : has(/^go\.sum$/)
                  ? "go modules"
                  : null;

    const framework_hints: string[] = [];
    if (has(/(^|\/)next\.config\./)) framework_hints.push("Next.js");
    if (has(/(^|\/)vite\.config\./)) framework_hints.push("Vite");
    if (has(/(^|\/)nuxt\.config\./)) framework_hints.push("Nuxt");
    if (has(/(^|\/)remix\.config\./)) framework_hints.push("Remix");
    if (has(/(^|\/)astro\.config\./)) framework_hints.push("Astro");
    if (has(/(^|\/)svelte\.config\./)) framework_hints.push("Svelte");
    if (has(/(^|\/)tailwind\.config\./)) framework_hints.push("Tailwind");
    if (has(/(^|\/)supabase\//)) framework_hints.push("Supabase");
    if (has(/(^|\/)prisma\/schema\.prisma$/)) framework_hints.push("Prisma");
    if (has(/(^|\/)drizzle\.config\./)) framework_hints.push("Drizzle");

    return {
      full_name: repoData.full_name,
      description: repoData.description ?? null,
      language: repoData.language ?? null,
      languages,
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      open_issues: repoData.open_issues_count ?? 0,
      size_kb: repoData.size ?? 0,
      default_branch: repoData.default_branch ?? "main",
      pushed_at: repoData.pushed_at ?? null,
      created_at: repoData.created_at ?? null,
      topics: repoData.topics ?? [],
      license: repoData.license?.spdx_id ?? null,
      has_tests,
      has_ci,
      has_readme,
      has_typescript,
      package_manager,
      framework_hints,
      recent_commits_30d: Array.isArray(commits) ? commits.length : 0,
    };
  } catch (e) {
    return { fetch_error: "internal_error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS", "Content-Type": "application/json" } });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const input = parsed.data;
    const isAnonymous = !!input.anonymous;

    let userId: string | null = null;

    if (!isAnonymous) {
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
      const { data: identity, error: identityError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (identityError || !identity?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = identity.user.id;
    }
    // No guessed trust in x-forwarded-for. Anonymous access remains unavailable
    // unless deployment supplies the name of an IP header overwritten by its gateway.
    let quotaKey = `valuation:user:${userId}`;
    if (isAnonymous) {
      const ipHeader = Deno.env.get("TRUSTED_CLIENT_IP_HEADER");
      const ip = ipHeader ? req.headers.get(ipHeader)?.trim() : null;
      if (!ip || ip.length > 100 || ip.includes(",")) return new Response(JSON.stringify({ error: "anonymous_unavailable" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      quotaKey = `valuation:ip:${await sha256(ip)}`;
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: reserved, error: quotaError } = await admin.rpc("reserve_ai_audit", { _key: quotaKey, _limit: isAnonymous ? 1 : 10 });
    if (quotaError) throw new Error("Quota unavailable");
    if (!reserved) return new Response(JSON.stringify({ error: isAnonymous ? "anon_limit" : "rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const repo = await fetchRepoSnapshot(input.github_url);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are a SENIOR CODE AUDITOR and micro-SaaS broker. You value PWAs and small SaaS for sale on Acquire / MicroAcquire / Flippa, and you treat code quality as a multiplier on the exit price.

CODE QUALITY SCORING (0-100):
- 90-100 "Clean as Glass": TypeScript, tests, CI, recent commits, clear framework, lockfile, license, README
- 70-89  "Solid": most of the above, minor gaps
- 50-69  "Mixed": missing tests OR CI OR types
- 30-49  "Rubberdebt": no tests, no CI, stale, no docs
- 0-29   "Toxic": inactive, no docs, no tests, no types, unknown stack

VALUATION RULES:
- Base = net profit (MRR - expenses) × niche multiplier (Booking 36-48x, B2B SaaS 30-42x, E-commerce 24-36x, Dev Tool 20-30x, Content 18-28x).
- Adjust the multiplier by code quality: 90+ → +25%, 70-89 → +10%, 50-69 → 0, 30-49 → -20%, <30 → -40%.
- If net profit ≤ 0, value as ASSET ($500-$5000), code quality still shifts within range.
- All amounts in USD, conservative.

If repo_snapshot has fetch_error, set code_quality_score to 50, note the limitation in tech_stack_audit.summary, and proceed.

Return strictly via the tool. No prose.`;

    const userPrompt = `Value this PWA / micro-SaaS:

PROJECT
- Name: ${input.name}
- Live URL: ${input.url || "n/a"}
- Niche: ${input.niche}
- MRR: $${input.mrr}/mo
- Expenses: $${input.expenses}/mo
- User-stated tech: ${input.tech_stack || "unknown"}
- Notes: ${input.notes || "none"}

GITHUB DNA (auto-fetched)
${JSON.stringify(repo, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(40_000),
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
              description: "Return structured PWA valuation + technical audit.",
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
                  multiple: { type: "number" },
                  risk_score: { type: "integer", minimum: 1, maximum: 10 },
                  code_quality_score: { type: "integer", minimum: 0, maximum: 100 },
                  code_quality_label: {
                    type: "string",
                    enum: ["Clean as Glass", "Solid", "Mixed", "Rubberdebt", "Toxic"],
                  },
                  tech_stack_audit: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      excellence: {
                        type: "array",
                        minItems: 1,
                        maxItems: 5,
                        items: { type: "string" },
                      },
                      tech_debt: {
                        type: "array",
                        minItems: 1,
                        maxItems: 5,
                        items: { type: "string" },
                      },
                      detected_stack: { type: "array", items: { type: "string" } },
                    },
                    required: ["summary", "excellence", "tech_debt", "detected_stack"],
                    additionalProperties: false,
                  },
                  refactor_tips: {
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
                  summary: { type: "string" },
                },
                required: [
                  "estimated_valuation",
                  "multiple",
                  "risk_score",
                  "code_quality_score",
                  "code_quality_label",
                  "tech_stack_audit",
                  "refactor_tips",
                  "value_up_tips",
                  "summary",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_valuation" } },
        max_tokens: 1500,
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
      console.error("AI upstream status", aiRes.status);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("AI response missing tool call");
      return new Response(JSON.stringify({ error: "no_tool_call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tipSchema = z.object({ title: z.string().max(500), impact: z.enum(["high", "medium", "low"]), detail: z.string().max(5000) });
    const reportSchema = z.object({
      estimated_valuation: z.object({ low: z.number().finite().nonnegative(), mid: z.number().finite().nonnegative(), high: z.number().finite().nonnegative() }).refine(v => v.low <= v.mid && v.mid <= v.high),
      multiple: z.number().finite().nonnegative(), risk_score: z.number().int().min(1).max(10),
      code_quality_score: z.number().int().min(0).max(100), code_quality_label: z.enum(["Clean as Glass", "Solid", "Mixed", "Rubberdebt", "Toxic"]),
      tech_stack_audit: z.object({ summary: z.string().max(5000), excellence: z.array(z.string().max(2000)).max(5), tech_debt: z.array(z.string().max(2000)).max(5), detected_stack: z.array(z.string().max(300)).max(50) }),
      refactor_tips: z.array(tipSchema).length(3), value_up_tips: z.array(tipSchema).length(3), summary: z.string().max(10000),
    });
    const validated = reportSchema.safeParse(JSON.parse(toolCall.function.arguments));
    if (!validated.success) return new Response(JSON.stringify({ error: "invalid_ai_response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const report = validated.data;

    return new Response(
      JSON.stringify({ report, inputs: input, repo_snapshot: repo, anonymous: isAnonymous }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("valuate-pwa error", e);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
