import { useTranslation } from "react-i18next";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { GrowthPoint } from "@/hooks/useAdminData";
import { useLocale } from "@/hooks/useLocale";

export function GlobalGrowthChart({ data }: { data: GrowthPoint[] }) {
	const { t } = useTranslation();
	const { intlLocale } = useLocale();

	const formatted = data.map((d) => ({
		...d,
		label: new Date(d.date).toLocaleDateString(intlLocale, {
			month: "short",
			day: "numeric",
		}),
	}));

	return (
		<Card className="glass overflow-hidden p-5 shadow-elegant md:p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						{t("admin.pulse.growthTitle")}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("admin.pulse.growthSubtitle")}
					</p>
				</div>
			</div>
			<div className="mt-6 h-[280px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={formatted}
						margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
					>
						<defs>
							<linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="hsl(var(--primary-glow))"
									stopOpacity={0.65}
								/>
								<stop
									offset="100%"
									stopColor="hsl(var(--primary))"
									stopOpacity={0}
								/>
							</linearGradient>
							<linearGradient id="growthStroke" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stopColor="hsl(var(--primary-glow))" />
								<stop offset="100%" stopColor="hsl(var(--accent))" />
							</linearGradient>
						</defs>
						<XAxis
							dataKey="label"
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							interval="preserveStartEnd"
						/>
						<YAxis
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							allowDecimals={false}
							width={32}
						/>
						<Tooltip
							contentStyle={{
								background: "hsl(var(--popover))",
								border: "1px solid hsl(var(--border))",
								borderRadius: 8,
								fontSize: 12,
							}}
						/>
						<Area
							type="monotone"
							dataKey="signups"
							stroke="url(#growthStroke)"
							strokeWidth={2.5}
							fill="url(#growthFill)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}
