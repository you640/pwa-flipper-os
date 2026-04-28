import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export type Subscription = {
	tier: string;
	status: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	current_period_end: string | null;
};

export function useSubscription() {
	const { user } = useProfile();

	const query = useQuery({
		queryKey: ["subscription", user?.id],
		enabled: !!user?.id,
		staleTime: 30_000,
		queryFn: async (): Promise<Subscription | null> => {
			if (!user?.id) return null;
			const { data, error } = await supabase
				.from("subscriptions")
				.select(
					"tier, status, stripe_customer_id, stripe_subscription_id, current_period_end",
				)
				.eq("user_id", user.id)
				.maybeSingle();
			if (error) throw error;
			return data as Subscription | null;
		},
	});

	const sub = query.data ?? null;
	const isPro = sub?.tier === "pro" && sub?.status === "active";

	return {
		subscription: sub,
		isPro,
		loading: query.isLoading,
		refetch: query.refetch,
	};
}
