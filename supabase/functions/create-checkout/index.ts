// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function requireEnv(key: string): string {
	const v = Deno.env.get(key);
	if (!v) throw new Error(`Missing env var: ${key}`);
	return v;
}

/**
 * Validate and resolve the origin against a server-side allowlist.
 * Returns the validated origin or throws if not allowed.
 */
function resolveAppOrigin(requestedOrigin: string): string {
	const baseUrl = requireEnv("APP_BASE_URL");
	const allowedOriginsEnv = Deno.env.get("APP_ALLOWED_ORIGINS") ?? "";
	const allowedOrigins = [
		baseUrl,
		...allowedOriginsEnv.split(",").filter(Boolean),
	];

	// Normalize origins for comparison (remove trailing slash)
	const normalizedRequested = requestedOrigin.replace(/\/$/, "");
	const normalizedAllowed = allowedOrigins.map((o) => o.replace(/\/$/, ""));

	if (!normalizedAllowed.includes(normalizedRequested)) {
		throw new Error("Origin not allowed");
	}

	return normalizedRequested;
}

async function stripePost(
	secret: string,
	path: string,
	params: Record<string, string>,
) {
	const res = await fetch(`https://api.stripe.com/v1${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${secret}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams(params).toString(),
	});
	const json = await res.json();
	if (!res.ok) {
		throw new Error(
			(json as { error?: { message?: string } }).error?.message ??
				"Stripe error",
		);
	}
	return json as Record<string, unknown>;
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS")
		return new Response(null, { headers: corsHeaders });

	try {
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return new Response(JSON.stringify({ error: "Missing auth" }), {
				status: 401,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		const SUPABASE_URL = requireEnv("SUPABASE_URL");
		const ANON =
			Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
			requireEnv("SUPABASE_ANON_KEY");
		const SERVICE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
		const STRIPE_SECRET = requireEnv("STRIPE_SECRET_KEY");
		const PRICE_ID = requireEnv("STRIPE_PRO_PRICE_ID");

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
		const user = userData.user;

		const { origin: requestedOrigin } = (await req.json()) as {
			origin?: string;
		};
		if (!requestedOrigin) {
			return new Response(JSON.stringify({ error: "Missing origin" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// Validate origin against server-side allowlist
		let origin: string;
		try {
			origin = resolveAppOrigin(requestedOrigin);
		} catch {
			return new Response(JSON.stringify({ error: "Invalid origin" }), {
				status: 403,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		const admin = createClient(SUPABASE_URL, SERVICE);

		// Check existing subscription
		const { data: sub } = await admin
			.from("subscriptions")
			.select("stripe_customer_id, tier, status")
			.eq("user_id", user.id)
			.maybeSingle();

		if (sub?.tier === "pro" && sub?.status === "active") {
			return new Response(JSON.stringify({ alreadyActive: true }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// Get or create Stripe customer
		let customerId: string = (sub?.stripe_customer_id as string) ?? "";
		if (!customerId) {
			const { data: profile } = await admin
				.from("profiles")
				.select("display_name")
				.eq("id", user.id)
				.maybeSingle();

			const customer = await stripePost(STRIPE_SECRET, "/customers", {
				email: user.email ?? "",
				name: (profile?.display_name as string) ?? user.email ?? "",
				"metadata[supabase_user_id]": user.id,
			});
			customerId = customer.id as string;

			await admin.from("subscriptions").upsert(
				{
					user_id: user.id,
					stripe_customer_id: customerId,
					tier: "free",
					status: "inactive",
				},
				{ onConflict: "user_id" },
			);
		}

		// Create Stripe Checkout Session
		const session = await stripePost(STRIPE_SECRET, "/checkout/sessions", {
			mode: "subscription",
			customer: customerId,
			"line_items[0][price]": PRICE_ID,
			"line_items[0][quantity]": "1",
			success_url: `${origin}/billing?success=1`,
			cancel_url: `${origin}/billing?canceled=1`,
			client_reference_id: user.id,
		});

		return new Response(JSON.stringify({ url: session.url }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (e) {
		console.error("create-checkout error:", e);
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
