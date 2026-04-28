import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CodeQualityLabel } from "@/hooks/useAiValuation";
import { cn } from "@/lib/utils";

const LABEL_KEY: Record<CodeQualityLabel, string> = {
	"Clean as Glass": "cleanAsGlass",
	Solid: "solid",
	Mixed: "mixed",
	Rubberdebt: "rubberdebt",
	Toxic: "toxic",
};

// HSL hue 0=red → 120=green
function scoreToHue(score: number) {
	return Math.max(0, Math.min(120, (score / 100) * 120));
}

export function CodeHealthGauge({
	score,
	label,
}: {
	score: number;
	label: CodeQualityLabel;
}) {
	const { t } = useTranslation();
	const [displayScore, setDisplayScore] = useState(0);
	const safeScore = Math.max(0, Math.min(100, Math.round(score)));
	const motionScore = useMotionValue(0);

	useEffect(() => {
		const controls = animate(motionScore, safeScore, {
			duration: 1.4,
			ease: [0.22, 1, 0.36, 1],
			onUpdate: (v) => setDisplayScore(Math.round(v)),
		});
		return () => controls.stop();
	}, [safeScore, motionScore]);

	// semicircle: arc length = π * r ; we use stroke-dasharray
	const r = 72;
	const circumference = Math.PI * r; // semicircle
	const dashOffset = useTransform(
		motionScore,
		(v) => circumference - (v / 100) * circumference,
	);
	const stroke = useTransform(
		motionScore,
		(v) => `hsl(${scoreToHue(v)}, 80%, 55%)`,
	);

	return (
		<div className="rounded-2xl border border-border/50 bg-card/40 p-5">
			<div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
				{t("valuation.ai.report.codeQuality")}
			</div>
			<div className="mt-3 flex items-center gap-5">
				<div className="relative h-[100px] w-[180px] shrink-0">
					<svg
						viewBox="0 0 180 100"
						className="h-full w-full"
						aria-hidden="true"
					>
						{/* Track */}
						<path
							d="M 18 90 A 72 72 0 0 1 162 90"
							fill="none"
							stroke="hsl(var(--muted) / 0.4)"
							strokeWidth="12"
							strokeLinecap="round"
						/>
						{/* Animated value */}
						<motion.path
							d="M 18 90 A 72 72 0 0 1 162 90"
							fill="none"
							strokeWidth="12"
							strokeLinecap="round"
							style={{
								stroke,
								strokeDasharray: circumference,
								strokeDashoffset: dashOffset,
								filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))",
							}}
						/>
					</svg>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
						<div className="font-mono text-3xl font-bold tabular-nums text-foreground">
							{displayScore}
							<span className="text-base text-muted-foreground">/100</span>
						</div>
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className={cn(
							"inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1",
							safeScore >= 90
								? "bg-success/15 text-success ring-success/30"
								: safeScore >= 70
									? "bg-primary/15 text-primary ring-primary/30"
									: safeScore >= 50
										? "bg-warning/15 text-warning ring-warning/30"
										: safeScore >= 30
											? "bg-orange-500/15 text-orange-400 ring-orange-500/30"
											: "bg-destructive/15 text-destructive ring-destructive/30",
						)}
					>
						{t(`valuation.ai.report.labels.${LABEL_KEY[label]}`)}
					</motion.div>
					<p className="mt-2 text-xs text-muted-foreground">
						{t("valuation.ai.report.codeQualityHint")}
					</p>
				</div>
			</div>
		</div>
	);
}
