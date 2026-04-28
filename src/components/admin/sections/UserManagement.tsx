import { Pencil, Search, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export function UserManagement({
	users,
	roles,
	loading,
	onRefetch,
}: {
	users: Profile[];
	roles: RoleRow[];
	loading: boolean;
	onRefetch: () => void;
}) {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<Profile | null>(null);
	const [selectedRole, setSelectedRole] = useState<AppRole>("user");
	const [saving, setSaving] = useState(false);

	const rolesByUser = useMemo(() => {
		const m = new Map<string, AppRole>();
		roles.forEach((r) => {
			// Pick highest-privilege role
			const cur = m.get(r.user_id);
			if (
				!cur ||
				r.role === "admin" ||
				(r.role === "moderator" && cur === "user")
			) {
				m.set(r.user_id, r.role as AppRole);
			}
		});
		return m;
	}, [roles]);

	const filtered = useMemo(() => {
		if (!query.trim()) return users;
		const q = query.toLowerCase();
		return users.filter(
			(u) =>
				u.display_name?.toLowerCase().includes(q) ||
				u.id.toLowerCase().includes(q),
		);
	}, [users, query]);

	const openEdit = (u: Profile) => {
		setEditing(u);
		setSelectedRole(rolesByUser.get(u.id) ?? "user");
	};

	const saveRole = async () => {
		if (!editing) return;
		setSaving(true);
		try {
			// Replace existing roles
			const { error: delErr } = await supabase
				.from("user_roles")
				.delete()
				.eq("user_id", editing.id);
			if (delErr) throw delErr;
			const { error: insErr } = await supabase
				.from("user_roles")
				.insert({ user_id: editing.id, role: selectedRole });
			if (insErr) throw insErr;
			toast.success(t("admin.users.roleUpdated"));
			setEditing(null);
			onRefetch();
		} catch (e) {
			toast.error(t("admin.users.roleUpdateFailed"));
			console.error(e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card className="glass p-5 md:p-6 shadow-elegant">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						{t("admin.users.title")}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("admin.users.subtitle")}
					</p>
				</div>
				<div className="relative w-full max-w-xs">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("admin.users.searchPlaceholder")}
						className="pl-9"
					/>
				</div>
			</div>

			<div className="mt-5 overflow-hidden rounded-lg border border-border/60">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.users.name")}</TableHead>
							<TableHead>{t("admin.users.role")}</TableHead>
							<TableHead>{t("admin.users.joined")}</TableHead>
							<TableHead className="text-right">
								{t("admin.users.actions")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-8 text-center text-sm text-muted-foreground"
								>
									…
								</TableCell>
							</TableRow>
						) : filtered.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-8 text-center text-sm text-muted-foreground"
								>
									{t("admin.users.empty")}
								</TableCell>
							</TableRow>
						) : (
							filtered.map((u) => {
								const role = rolesByUser.get(u.id) ?? "user";
								const initials = (u.display_name ?? "U")
									.slice(0, 2)
									.toUpperCase();
								return (
									<TableRow key={u.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8 border border-border/60">
													<AvatarImage src={u.avatar_url ?? ""} />
													<AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
														{initials}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="text-sm font-medium text-foreground">
														{u.display_name ?? "—"}
													</div>
													<div className="text-xs text-muted-foreground font-mono">
														{u.id.slice(0, 8)}…
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={
													role === "admin"
														? "border-primary/40 bg-primary/10 text-primary"
														: role === "moderator"
															? "border-accent/40 bg-accent/10 text-accent"
															: "border-border bg-muted/40 text-muted-foreground"
												}
											>
												{t(`admin.users.roles.${role}`)}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(u.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="ghost"
													onClick={() => openEdit(u)}
												>
													<Pencil className="mr-1.5 h-3.5 w-3.5" />
													{t("admin.users.editRole")}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														toast.info(t("admin.users.impersonateSoon"))
													}
													title={t("admin.users.impersonateSoon")}
												>
													<UserCog className="mr-1.5 h-3.5 w-3.5" />
													{t("admin.users.impersonate")}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("admin.users.editRole")}</DialogTitle>
					</DialogHeader>
					<div className="py-2">
						<div className="mb-3 text-sm text-muted-foreground">
							{editing?.display_name ?? editing?.id}
						</div>
						<Select
							value={selectedRole}
							onValueChange={(v) => setSelectedRole(v as AppRole)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="admin">
									{t("admin.users.roles.admin")}
								</SelectItem>
								<SelectItem value="moderator">
									{t("admin.users.roles.moderator")}
								</SelectItem>
								<SelectItem value="user">
									{t("admin.users.roles.user")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setEditing(null)}
							disabled={saving}
						>
							{t("admin.users.cancel")}
						</Button>
						<Button onClick={saveRole} disabled={saving}>
							{t("admin.users.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
