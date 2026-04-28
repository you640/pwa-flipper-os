import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];
type Lead = Database["public"]["Tables"]["crm_leads"]["Row"];
type RoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
type UploadErr = Database["public"]["Tables"]["avatar_upload_errors"]["Row"];

export type GrowthPoint = { date: string; signups: number };

export function useAdminData() {
	const [users, setUsers] = useState<Profile[]>([]);
	const [roles, setRoles] = useState<RoleRow[]>([]);
	const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
	const [leads, setLeads] = useState<Lead[]>([]);
	const [uploadErrors, setUploadErrors] = useState<UploadErr[]>([]);
	const [growthSeries, setGrowthSeries] = useState<GrowthPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

	const fetchAll = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [profRes, portRes, leadsRes, rolesRes, errRes] = await Promise.all([
				supabase
					.from("profiles")
					.select("*")
					.order("created_at", { ascending: false }),
				supabase
					.from("portfolio")
					.select("*")
					.order("created_at", { ascending: false }),
				supabase
					.from("crm_leads")
					.select("*")
					.order("created_at", { ascending: false }),
				supabase.from("user_roles").select("*"),
				supabase
					.from("avatar_upload_errors")
					.select("*")
					.order("created_at", { ascending: false })
					.limit(10),
			]);

			if (profRes.error) throw profRes.error;
			if (portRes.error) throw portRes.error;
			if (leadsRes.error) throw leadsRes.error;
			if (rolesRes.error) throw rolesRes.error;
			if (errRes.error) throw errRes.error;

			setUsers(profRes.data ?? []);
			setPortfolio(portRes.data ?? []);
			setLeads(leadsRes.data ?? []);
			setRoles(rolesRes.data ?? []);
			setUploadErrors(errRes.data ?? []);

			// Build 30-day signup series
			const buckets = new Map<string, number>();
			const today = new Date();
			for (let i = 29; i >= 0; i--) {
				const d = new Date(today);
				d.setDate(today.getDate() - i);
				const key = d.toISOString().slice(0, 10);
				buckets.set(key, 0);
			}
			(profRes.data ?? []).forEach((p) => {
				const key = new Date(p.created_at).toISOString().slice(0, 10);
				if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
			});
			setGrowthSeries(
				Array.from(buckets.entries()).map(([date, signups]) => ({
					date,
					signups,
				})),
			);
			setRefreshedAt(new Date());
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchAll();
	}, [fetchAll]);

	return {
		users,
		roles,
		portfolio,
		leads,
		uploadErrors,
		growthSeries,
		loading,
		error,
		refreshedAt,
		refetch: fetchAll,
	};
}
