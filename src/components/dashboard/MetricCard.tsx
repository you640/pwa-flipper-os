import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { forwardRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
	label: string;
	value: number;
	prefix?: string;
	suffix?: string;
	icon: LucideIcon;
	index?: number;
	accent?: "primary" | "cyan" | "success" | "warning";
	loading?: boolean;
}

const CountUp = forwardRef<
	HTMLSpanElement,
	{ value: number; prefix?: string; suffix?: string }
>(function CountUp({ value, prefix = "", suffix = "" }, ref) {
	const mv = useMotionValue(0);
	const rounded = useTransform(
		mv,
		(v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`,
	);

	useEffect(() => {
		const controls = animate(mv, value, {
			duration: 1.1,
			ease: [0.22, 1, 0.36, 1],
		});
		return () => controls.stop();
	}, [value, mv]);

	return <motion.span ref={ref}>{rounded}</motion.span>;
});

const accentMap = {
	primary: {
		glow: "bg-primary/15",
		icon: "text-primary",
		shadow: "hover:shadow-glow",
	},
	cyan: {
		glow: "bg-accent/15",
		icon: "text-accent",
		shadow: "hover:shadow-glow-cyan",
	},
	success: {
		glow: "bg-success/15",
		icon: "text-success",
		shadow: "hover:shadow-glow",
	},
	warning: {
		glow: "bg-warning/15",
		icon: "text-warning",
		shadow: "hover:shadow-glow",
	},
};

export function MetricCard({
	label,
	value,
	prefix = "",
	suffix = "",
	icon: Icon,
	index = 0,
	accent = "primary",
	loading = false,
}: MetricCardProps) {
	const a = accentMap[accent];
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
		>
			<Card
				className={cn(
					"glow-border group relative overflow-hidden bg-gradient-card p-5 shadow-elegant transition-all duration-300 hover:-translate-y-0.5",
					a.shadow,
				)}
			>
				<div
					className={cn(
						"absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-80",
						a.glow,
					)}
				/>

				<div className="relative flex items-start justify-between">
					<p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
						{label}
					</p>
					<div
						className={cn(
							"flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 ring-1 ring-border/60",
							a.icon,
						)}
					>
						<Icon className="h-4 w-4" />
					</div>
				</div>

				<div className="relative mt-4 text-3xl font-semibold tracking-tight text-foreground">
					{loading ? (
						<span className="inline-block h-8 w-24 animate-pulse rounded-md bg-muted/40" />
					) : (
						<CountUp value={value} prefix={prefix} suffix={suffix} />
					)}
				</div>
			</Card>
		</motion.div>
	);
}
