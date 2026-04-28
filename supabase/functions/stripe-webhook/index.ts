// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type, stripe-signature",
};

function requireEnv(key: string): string {
	const v = Deno.env.get(key);
	if (!v) throw new Error(`Missing env var: ${key}`);
	return v;
}

/** Verify Stripe webhook signature using crypto.subtle (no SDK needed) */
async function verifyStripeSignature(
	payload: string,
	sigHeader: string,
	secret: string,
): Promise<boolean> {
	const parts = Object.fromEntries(
		sigHeader.split(",").map((p) => p.split("=")),
	) as Record<string, string>;
	const timestamp = parts.t;
	const signature = parts.v1;
	if (!timestamp || !signature) return false;

	const signed = `${timestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sigBytes = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signed),
	);
	const expected = Array.from(new Uint8Array(sigBytes))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Constant-time comparison
	if (expected.length !== signature.length) return false;
	let diff = 0;
	for (let i = 0; i < expected.length; i++) {
		diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
	}
	return diff === 0;
}

async function stripeGet(
	secret: string,
	path: string,
): Promise<Record<string, unknown>> {
	const res = await fetch(`https://api.stripe.com/v1${path}`, {
		headers: { Authorization: `Bearer ${secret}` },
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

	const SUPABASE_URL = requireEnv("SUPABASE_URL");
	const SERVICE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
	const STRIPE_SECRET = requireEnv("STRIPE_SECRET_KEY");
	const WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");

	try {
		const rawBody = await req.text();
		const sigHeader = req.headers.get("stripe-signature") ?? "";

		const valid = await verifyStripeSignature(
			rawBody,
			sigHeader,
			WEBHOOK_SECRET,
		);
		if (!valid) {
			return new Response("Invalid signature", {
				status: 400,
				headers: corsHeaders,
			});
		}

		const event = JSON.parse(rawBody) as {
			type: string;
			data: { object: Record<string, unknown> };
		};

		const admin = createClient(SUPABASE_URL, SERVICE);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object;
			const userId = session.client_reference_id as string;
			const stripeSubId = session.subscription as string;

			if (!userId || !stripeSubId) {
				return new Response("Missing fields", {
					status: 400,
					headers: corsHeaders,
				});
			}

			// Fetch full subscription to get period end
			const stripeSub = await stripeGet(
				STRIPE_SECRET,
				`/subscriptions/${stripeSubId}`,
			);

			await admin.from("subscriptions").upsert(
				{
					user_id: userId,
					stripe_customer_id: session.customer as string,
					stripe_subscription_id: stripeSubId,
					tier: "pro",
					status: "active",
					current_period_end: new Date(
						(stripeSub.current_period_end as number) * 1000,
					).toISOString(),
				},
				{ onConflict: "user_id" },
			);
		} else if (event.type === "customer.subscription.updated") {
			const stripeSub = event.data.object;
			const customerId = stripeSub.customer as string;
			const status = stripeSub.status as string;
			// Map Stripe status to our simplified status
			const ourStatus =
				status === "active" || status === "trialing" ? "active" : "inactive";

			await admin
				.from("subscriptions")
				.update({
					status: ourStatus,
					current_period_end: new Date(
						(stripeSub.current_period_end as number) * 1000,
					).toISOString(),
				})
				.eq("stripe_customer_id", customerId);
		} else if (event.type === "customer.subscription.deleted") {
			const stripeSub = event.data.object;
			const customerId = stripeSub.customer as string;

			await admin
				.from("subscriptions")
				.update({
					tier: "free",
					status: "inactive",
					stripe_subscription_id: null,
					current_period_end: null,
				})
				.eq("stripe_customer_id", customerId);
		}

		return new Response(JSON.stringify({ received: true }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (e) {
		console.error("stripe-webhook error:", e);
		return new Response(JSON.stringify({ error: (e as Error).message }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
