import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
	[k in string]: {
		label?: React.ReactNode;
		icon?: React.ComponentType;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

type ChartContextProps = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);

	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}

	return context;
}

const ChartContainer = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<"div"> & {
		config: ChartConfig;
		children: React.ComponentProps<
			typeof RechartsPrimitive.ResponsiveContainer
		>["children"];
	}
>(({ id, className, children, config, ...props }, ref) => {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				data-chart={chartId}
				ref={ref}
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
					className,
				)}
				{...props}
			>
				<ChartStyle id={chartId} config={config} />
				<RechartsPrimitive.ResponsiveContainer>
					{children}
				</RechartsPrimitive.ResponsiveContainer>
			</div>
		</ChartContext.Provider>
	);
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
	const colorConfig = Object.entries(config).filter(
		([_, config]) => config.theme || config.color,
	);

	if (!colorConfig.length) {
		return null;
	}

	const chartCss = Object.entries(THEMES)
		.map(
			([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
	.map(([key, itemConfig]) => {
		const color =
			itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
			itemConfig.color;
		return color ? `  --color-${key}: ${color};` : null;
	})
	.join("\n")}
}
`,
		)
		.join("\n");

	return <style>{chartCss}</style>;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartPayloadItem = {
	color?: string;
	dataKey?: string | number;
	name?: string;
	value?: number | string;
	payload?: Record<string, unknown> & { fill?: string };
};

type ChartTooltipContentProps = React.ComponentProps<
	typeof RechartsPrimitive.Tooltip
> &
	React.ComponentProps<"div"> & {
		hideLabel?: boolean;
		hideIndicator?: boolean;
		indicator?: "line" | "dot" | "dashed";
		label?: React.ReactNode;
		nameKey?: string;
		labelKey?: string;
		payload?: ChartPayloadItem[];
	};

type TooltipLabelFormatter = (
	label: React.ReactNode,
	payload: ChartPayloadItem[],
) => React.ReactNode;

type TooltipValueFormatter = (
	value: ChartPayloadItem["value"],
	name: ChartPayloadItem["name"],
	item: ChartPayloadItem,
	index: number,
	payload: ChartPayloadItem["payload"],
) => React.ReactNode;

type ChartLegendContentProps = React.ComponentProps<"div"> & {
	hideIcon?: boolean;
	nameKey?: string;
	payload?: ChartPayloadItem[];
	verticalAlign?: "top" | "middle" | "bottom";
};

function ChartColorIndicator({
	color,
	indicator,
	nestLabel,
}: {
	color?: string;
	indicator: "line" | "dot" | "dashed";
	nestLabel: boolean;
}) {
	if (!color) {
		return null;
	}

	if (indicator === "line") {
		return (
			<svg
				className="shrink-0"
				width="4"
				height="16"
				viewBox="0 0 4 16"
				aria-hidden="true"
			>
				<line x1="2" y1="0" x2="2" y2="16" stroke={color} strokeWidth="3" />
			</svg>
		);
	}

	if (indicator === "dashed") {
		return (
			<svg
				className={cn("shrink-0", nestLabel && "my-0.5")}
				width="4"
				height="16"
				viewBox="0 0 4 16"
				aria-hidden="true"
			>
				<line
					x1="2"
					y1="0"
					x2="2"
					y2="16"
					stroke={color}
					strokeWidth="3"
					strokeDasharray="4 3"
				/>
			</svg>
		);
	}

	return (
		<svg
			className="h-2.5 w-2.5 shrink-0"
			viewBox="0 0 10 10"
			aria-hidden="true"
		>
			<rect x="0" y="0" width="10" height="10" rx="2" fill={color} />
		</svg>
	);
}

const ChartTooltipContent = React.forwardRef<
	HTMLDivElement,
	ChartTooltipContentProps
>((props, ref) => {
	const {
		active,
		payload,
		className,
		indicator = "dot",
		hideLabel = false,
		hideIndicator = false,
		label,
		labelFormatter,
		labelClassName,
		formatter,
		color,
		nameKey,
		labelKey,
	} = props as ChartTooltipContentProps;
	const tooltipLabelFormatter = labelFormatter as TooltipLabelFormatter | undefined;
	const tooltipValueFormatter = formatter as TooltipValueFormatter | undefined;
	const { config } = useChart();

	const tooltipLabel = React.useMemo(() => {
		if (hideLabel || !payload?.length) {
			return null;
		}

		const [item] = payload;
		const key = `${labelKey || item.dataKey || item.name || "value"}`;
		const itemConfig = getPayloadConfigFromPayload(config, item, key);
		const value =
			!labelKey && typeof label === "string"
				? config[label as keyof typeof config]?.label || label
				: itemConfig?.label;

		if (tooltipLabelFormatter) {
			return (
				<div className={cn("font-medium", labelClassName)}>
					{tooltipLabelFormatter(value, payload)}
				</div>
			);
		}

		if (!value) {
			return null;
		}

		return <div className={cn("font-medium", labelClassName)}>{value}</div>;
	}, [
		label,
		tooltipLabelFormatter,
		payload,
		hideLabel,
		labelClassName,
		config,
		labelKey,
	]);

	if (!active || !payload?.length) {
		return null;
	}

	const nestLabel = payload.length === 1 && indicator !== "dot";

	return (
		<div
			ref={ref}
			className={cn(
				"grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
				className,
			)}
		>
			{!nestLabel ? tooltipLabel : null}
			<div className="grid gap-1.5">
				{payload.map((item: ChartPayloadItem, index: number) => {
					const key = `${nameKey || item.name || item.dataKey || "value"}`;
					const itemConfig = getPayloadConfigFromPayload(config, item, key);
					const indicatorColor = color || item.payload?.fill || item.color;

					return (
						<div
							key={item.dataKey}
							className={cn(
								"flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
								indicator === "dot" && "items-center",
							)}
						>
							{tooltipValueFormatter && item?.value !== undefined && item.name ? (
								tooltipValueFormatter(
									item.value,
									item.name,
									item,
									index,
									item.payload,
								)
							) : (
								<>
									{itemConfig?.icon ? (
										<itemConfig.icon />
									) : (
										!hideIndicator && (
											<ChartColorIndicator
												color={indicatorColor}
												indicator={indicator}
												nestLabel={nestLabel}
											/>
										)
									)}
									<div
										className={cn(
											"flex flex-1 justify-between leading-none",
											nestLabel ? "items-end" : "items-center",
										)}
									>
										<div className="grid gap-1.5">
											{nestLabel ? tooltipLabel : null}
											<span className="text-muted-foreground">
												{itemConfig?.label || item.name}
											</span>
										</div>
										{item.value && (
											<span className="font-mono font-medium tabular-nums text-foreground">
												{item.value.toLocaleString()}
											</span>
										)}
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
});
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
	HTMLDivElement,
	ChartLegendContentProps
>(
	(
		{ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
		ref,
	) => {
		const { config } = useChart();

		if (!payload?.length) {
			return null;
		}

		return (
			<div
				ref={ref}
				className={cn(
					"flex items-center justify-center gap-4",
					verticalAlign === "top" ? "pb-3" : "pt-3",
					className,
				)}
			>
				{payload.map((item: ChartPayloadItem) => {
					const key = `${nameKey || item.dataKey || "value"}`;
					const itemConfig = getPayloadConfigFromPayload(config, item, key);

					return (
						<div
							key={item.value}
							className={cn(
								"flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
							)}
						>
							{itemConfig?.icon && !hideIcon ? (
								<itemConfig.icon />
							) : (
								<ChartColorIndicator
									color={item.color}
									indicator="dot"
									nestLabel={false}
								/>
							)}
							{itemConfig?.label}
						</div>
					);
				})}
			</div>
		);
	},
);
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: unknown,
	key: string,
) {
	if (typeof payload !== "object" || payload === null) {
		return undefined;
	}

	const payloadPayload =
		"payload" in payload &&
		typeof payload.payload === "object" &&
		payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey: string = key;

	if (
		key in payload &&
		typeof payload[key as keyof typeof payload] === "string"
	) {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
	) {
		configLabelKey = payloadPayload[
			key as keyof typeof payloadPayload
		] as string;
	}

	return configLabelKey in config
		? config[configLabelKey]
		: config[key as keyof typeof config];
}

export {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent
};

