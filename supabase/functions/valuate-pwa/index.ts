// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

function requireEnv(key: string): string {
	const v = Deno.env.get(key);
	if (!v) throw new Error(`Missing env var: ${key}`);
	return v;
}

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
	const buf = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(text),
	);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function fetchRepoSnapshot(
	githubUrl: string,
): Promise<RepoSnapshot | { fetch_error: string }> {
	try {
		const m = githubUrl.match(
			/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i,
		);
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
			fetch(`${base}/git/trees/${repoData.default_branch}?recursive=1`, {
				headers,
			}),
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

		const paths: string[] = (tree.tree ?? []).map((n: { path?: string }) =>
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
			has(/(^|\/)tsconfig\.json$/) ||
			!!(languages as Record<string, unknown>).TypeScript;

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
		return { fetch_error: e instanceof Error ? e.message : "unknown" };
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function getBaseMultiple(niche: string): number {
	const normalized = niche.toLowerCase();
	if (normalized.includes("booking")) return 42;
	if (normalized.includes("b2b")) return 36;
	if (normalized.includes("e-commerce") || normalized.includes("ecommerce")) {
		return 30;
	}
	if (normalized.includes("dev tool") || normalized.includes("developer")) {
		return 25;
	}
	if (normalized.includes("content")) return 23;
	return 30;
}

function getCodeQualityLabel(score: number): CodeQualityLabel {
	if (score >= 90) return "Clean as Glass";
	if (score >= 70) return "Solid";
	if (score >= 50) return "Mixed";
	if (score >= 30) return "Rubberdebt";
	return "Toxic";
}

function uniq(items: string[]): string[] {
	return [...new Set(items.filter(Boolean))];
}

function buildFallbackReport(
	input: z.infer<typeof BodySchema>,
	repo: RepoSnapshot | { fetch_error: string },
	reason: string,
): AiValuationReport {
	const repoOk = !("fetch_error" in repo);
	const detectedStack = repoOk
		? uniq([
			...(repo.framework_hints ?? []),
			repo.language ?? "",
			...Object.keys(repo.languages ?? {}).slice(0, 4),
			...(input.tech_stack
				? input.tech_stack
					.split(",")
					.map((item) => item.trim())
				: []),
		])
		: uniq(
			input.tech_stack
				? input.tech_stack.split(",").map((item) => item.trim())
				: [],
		);

	let score = repoOk ? 35 : 50;
	if (repoOk) {
		if (repo.has_tests) score += 12;
		if (repo.has_ci) score += 10;
		if (repo.has_readme) score += 8;
		if (repo.has_typescript) score += 10;
		if (repo.package_manager) score += 5;
		if (repo.license) score += 4;
		score += Math.min((repo.framework_hints ?? []).length * 3, 9);
		if (repo.recent_commits_30d >= 10) score += 10;
		else if (repo.recent_commits_30d >= 1) score += 5;
		if (repo.pushed_at) {
			const ageDays =
				(Date.now() - new Date(repo.pushed_at).getTime()) / (24 * 3600 * 1000);
			if (ageDays > 365) score -= 12;
			else if (ageDays > 180) score -= 6;
			else if (ageDays < 45) score += 5;
		}
	}
	score = clamp(score, 0, 100);

	const label = getCodeQualityLabel(score);
	const qualityFactor =
		score >= 90 ? 1.25 : score >= 70 ? 1.1 : score >= 50 ? 1 : score >= 30 ? 0.8 : 0.6;
	const netProfit = input.mrr - input.expenses;
	const baseMultiple = getBaseMultiple(input.niche);
	const multiple = netProfit > 0 ? Number((baseMultiple * qualityFactor).toFixed(1)) : 0;

	let low = 0;
	let mid = 0;
	let high = 0;
	if (netProfit > 0) {
		mid = Math.round(netProfit * multiple);
		low = Math.round(mid * 0.8);
		high = Math.round(mid * 1.2);
	} else {
		mid = Math.round(500 + score * 45);
		low = Math.round(mid * 0.6);
		high = Math.round(mid * 1.4);
	}

	const excellence = repoOk
		? [
			repo.has_typescript ? "Type-safe codebase detected" : "",
			repo.has_tests ? "Automated tests are present" : "",
			repo.has_ci ? "CI workflow is configured" : "",
			repo.has_readme ? "Repository includes project documentation" : "",
			(repo.framework_hints ?? []).length > 0
				? `Detected stack: ${(repo.framework_hints ?? []).join(", ")}`
				: "",
		].filter(Boolean).slice(0, 5)
		: [
			"GitHub repository metadata was partially available",
			"Fallback valuation completed without AI gateway",
		].slice(0, 5);

	const techDebt = [
		repoOk && !repo.has_tests ? "Missing or low test coverage reduces buyer confidence" : "",
		repoOk && !repo.has_ci ? "No CI pipeline detected for release confidence" : "",
		repoOk && !repo.has_readme ? "Repository lacks clear onboarding documentation" : "",
		repoOk && !repo.has_typescript ? "Limited type safety increases maintenance risk" : "",
		!repoOk ? `GitHub inspection limitation: ${repo.fetch_error}` : "",
		`AI fallback mode used because ${reason}`,
	].filter(Boolean).slice(0, 5);

	const refactorTips = [
		{
			title: repoOk && !repo.has_tests ? "Add a smoke test suite" : "Document critical flows",
			impact: "high" as const,
			detail: repoOk && !repo.has_tests
				? "Cover the audit, auth, and billing paths to reduce technical diligence risk."
				: "Document setup, deployment, and main product flows for acquirers.",
		},
		{
			title: repoOk && !repo.has_ci ? "Introduce CI checks" : "Strengthen release automation",
			impact: "medium" as const,
			detail: repoOk && !repo.has_ci
				? "Automate lint, tests, and build validation on every push."
				: "Automated release health signals improve buyer trust and handoff quality.",
		},
		{
			title: "Stabilize technical stack evidence",
			impact: "medium" as const,
			detail:
				"Keep dependency locks, framework config, and architecture notes easy to verify during diligence.",
		},
	];

	const valueUpTips = [
		{
			title: "Improve buyer-ready packaging",
			impact: "high" as const,
			detail:
				"A clean README, deployment checklist, and analytics screenshots lift perceived maturity during sale."
		},
		{
			title: "Reduce perceived delivery risk",
			impact: "medium" as const,
			detail:
				"Visible tests, CI, and recent commits help support a stronger valuation multiple."
		},
		{
			title: "Clarify monetization proof",
			impact: "medium" as const,
			detail:
				"Tie technical quality with clear revenue evidence to defend the asking price in diligence."
		},
	];

	return {
		estimated_valuation: { low, mid, high },
		multiple,
		risk_score: clamp(Math.round(11 - score / 10), 1, 10),
		code_quality_score: score,
		code_quality_label: label,
		tech_stack_audit: {
			summary: repoOk
				? `Fallback valuation used because ${reason}. Repo signals were still analyzed from GitHub metadata and file structure.`
				: `Fallback valuation used because ${reason}. GitHub metadata was limited (${repo.fetch_error}).`,
			excellence,
			tech_debt: techDebt,
			detected_stack: detectedStack,
		},
		refactor_tips: refactorTips,
		value_up_tips: valueUpTips,
		summary:
			netProfit > 0
				? `Fallback valuation estimates ${input.name} around $${mid.toLocaleString()} based on roughly ${multiple}x monthly net profit and a ${label.toLowerCase()} technical profile.`
				: `Fallback valuation treats ${input.name} as an asset sale around $${mid.toLocaleString()} because current net profit is non-positive.`,
	};
}

function buildSuccessResponse(
	report: AiValuationReport,
	input: z.infer<typeof BodySchema>,
	repo: RepoSnapshot | { fetch_error: string },
	isAnonymous: boolean,
) {
	return new Response(
		JSON.stringify({
			report,
			inputs: input,
			repo_snapshot: repo,
			anonymous: isAnonymous,
		}),
		{ headers: { ...corsHeaders, "Content-Type": "application/json" } },
	);
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS")
		return new Response(null, { headers: corsHeaders });

	try {
		const parsed = BodySchema.safeParse(await req.json());
		if (!parsed.success) {
			return new Response(
				JSON.stringify({
					error: "Invalid input",
					details: parsed.error.flatten().fieldErrors,
				}),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}
		const input = parsed.data;
		const isAnonymous = !!input.anonymous;

		let _userId: string | null = null;

		if (!isAnonymous) {
			const authHeader = req.headers.get("Authorization");
			if (!authHeader?.startsWith("Bearer ")) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
			const supabase = createClient(
				requireEnv("SUPABASE_URL"),
				requireEnv("SUPABASE_ANON_KEY"),
				{ global: { headers: { Authorization: authHeader } } },
			);
			const { data: claims } = await supabase.auth.getClaims(
				authHeader.replace("Bearer ", ""),
			);
			if (!claims?.claims) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}
			_userId =
				((claims.claims as Record<string, unknown>).sub as string | null) ??
				null;
		} else {
			// Server-side IP rate limit: 1 audit / IP / 24h.
			const fwd = req.headers.get("x-forwarded-for") || "";
			const ip = fwd.split(",")[0].trim() || "unknown";
			const ipHash = await sha256(`rd-anon-${ip}`);
			const admin = createClient(
				requireEnv("SUPABASE_URL"),
				requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
			);
			const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
			const { count } = await admin
				.from("anon_audit_attempts")
				.select("id", { count: "exact", head: true })
				.eq("ip_hash", ipHash)
				.gte("created_at", since);
			if ((count ?? 0) >= 1) {
				return new Response(
					JSON.stringify({
						error: "anon_limit",
						message: "Free audit already used",
					}),
					{
						status: 429,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					},
				);
			}
			// Record attempt up-front so retries don't bypass.
			await admin.from("anon_audit_attempts").insert({
				ip_hash: ipHash,
				github_url: input.github_url,
			});
		}

		const repo = await fetchRepoSnapshot(input.github_url);

		const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
		if (!LOVABLE_API_KEY) {
			return buildSuccessResponse(
				buildFallbackReport(input, repo, "LOVABLE_API_KEY is not configured"),
				input,
				repo,
				isAnonymous,
			);
		}

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

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for AI

		let aiRes: Response;
		try {
			aiRes = await fetch(
			"https://ai.gateway.lovable.dev/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${LOVABLE_API_KEY}`,
					"Content-Type": "application/json",
				},
				signal: controller.signal,
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
								description:
									"Return structured PWA valuation + technical audit.",
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
										code_quality_score: {
											type: "integer",
											minimum: 0,
											maximum: 100,
										},
										code_quality_label: {
											type: "string",
											enum: [
												"Clean as Glass",
												"Solid",
												"Mixed",
												"Rubberdebt",
												"Toxic",
											],
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
												detected_stack: {
													type: "array",
													items: { type: "string" },
												},
											},
											required: [
												"summary",
												"excellence",
												"tech_debt",
												"detected_stack",
											],
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
													impact: {
														type: "string",
														enum: ["high", "medium", "low"],
													},
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
													impact: {
														type: "string",
														enum: ["high", "medium", "low"],
													},
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
					tool_choice: {
						type: "function",
						function: { name: "submit_valuation" },
					},
					max_tokens: 1500,
				}),
			},
			);
		} catch (error) {
			clearTimeout(timeoutId);
			console.error("AI fetch failed", error);
			return buildSuccessResponse(
				buildFallbackReport(input, repo, "AI gateway request failed"),
				input,
				repo,
				isAnonymous,
			);
		}
		clearTimeout(timeoutId);

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
			return buildSuccessResponse(
				buildFallbackReport(input, repo, `AI gateway returned ${aiRes.status}`),
				input,
				repo,
				isAnonymous,
			);
		}

		const aiJson = await aiRes.json();
		const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
		if (!toolCall?.function?.arguments) {
			console.error("No tool call", JSON.stringify(aiJson));
			return buildSuccessResponse(
				buildFallbackReport(input, repo, "AI response did not include a structured tool call"),
				input,
				repo,
				isAnonymous,
			);
		}
		const report = JSON.parse(toolCall.function.arguments);

		return buildSuccessResponse(report, input, repo, isAnonymous);
	} catch (e) {
		console.error("valuate-pwa error", e);
		return new Response(
			JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});
