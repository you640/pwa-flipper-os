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

		const { origin } = (await req.json()) as { origin?: string };
		if (!origin) {
			return new Response(JSON.stringify({ error: "Missing origin" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		const admin = createClient(SUPABASE_URL, SERVICE);
		const { data: sub } = await admin
			.from("subscriptions")
			.select("stripe_customer_id")
			.eq("user_id", userData.user.id)
			.maybeSingle();

		if (!sub?.stripe_customer_id) {
			return new Response(
				JSON.stringify({ error: "No billing account found" }),
				{
					status: 404,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const portalSession = await stripePost(
			STRIPE_SECRET,
			"/billing_portal/sessions",
			{
				customer: sub.stripe_customer_id as string,
				return_url: `${origin}/billing`,
			},
		);

		return new Response(JSON.stringify({ url: portalSession.url }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (e) {
		console.error("customer-portal error:", e);
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
