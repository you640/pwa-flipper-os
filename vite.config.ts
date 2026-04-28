import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function getManualChunk(id: string) {
	if (!id.includes("node_modules")) return undefined;

	const parts = id.split("node_modules/")[1]?.split("/") ?? [];
	const pkg = parts[0]?.startsWith("@")
		? `${parts[0]}/${parts[1]}`
		: parts[0];

	if (!pkg) return "vendor";

	if (["react", "react-dom", "scheduler"].includes(pkg)) {
		return "react-core";
	}

	if (["react-router", "react-router-dom", "history"].includes(pkg)) {
		return "router";
	}

	if (pkg.startsWith("@tanstack/")) {
		return "query";
	}

	if (pkg.startsWith("@supabase/")) {
		return "supabase";
	}

	if (
		[
			"i18next",
			"react-i18next",
			"i18next-browser-languagedetector",
		].includes(pkg)
	) {
		return "i18n";
	}

	if (
		pkg.startsWith("@radix-ui/") ||
		[
			"cmdk",
			"embla-carousel-react",
			"input-otp",
			"react-day-picker",
			"react-resizable-panels",
			"sonner",
			"vaul",
		].includes(pkg)
	) {
		return "ui-kit";
	}

	if (pkg === "jspdf") {
		return "pdf-core";
	}

	if (["html2canvas", "dompurify", "canvg"].includes(pkg)) {
		return "canvas-export";
	}

	if (
		pkg === "recharts" ||
		pkg === "victory-vendor" ||
		pkg.startsWith("d3-")
	) {
		return "charts";
	}

	if (["framer-motion", "motion-dom", "motion-utils"].includes(pkg)) {
		return "motion";
	}

	if (["react-hook-form", "@hookform/resolvers", "zod"].includes(pkg)) {
		return "forms";
	}

	if (["lucide-react"].includes(pkg)) {
		return "icons";
	}

	return "vendor";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 8080,
		hmr: {
			overlay: false,
		},
	},
	plugins: [
		react(),
		mode === "development" && componentTagger(),
		VitePWA({
			registerType: "autoUpdate",
			devOptions: {
				enabled: false,
			},
			includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg"],
			manifest: {
				name: "RUBBERDUCK.SPACE",
				short_name: "Rubberduck",
				description:
					"Command center to manage, value, and sell your micro-SaaS and PWA portfolio.",
				theme_color: "#09090b",
				background_color: "#09090b",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "/icons/icon-192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable",
					},
					{
						src: "/icons/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				navigateFallbackDenylist: [/^\/~oauth/],
				globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
			},
		}),
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: [
			"react",
			"react-dom",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"@tanstack/react-query",
			"@tanstack/query-core",
		],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: getManualChunk,
			},
		},
	},
}));
