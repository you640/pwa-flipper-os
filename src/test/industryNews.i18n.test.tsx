import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndustryNews } from "@/components/dashboard/IndustryNews";
import i18n from "@/i18n";
import en from "@/i18n/locales/en";
import sk from "@/i18n/locales/sk";
import { NEWS_I18N_KEYS } from "@/i18n/newsKeys";

// Stub framer-motion to keep the DOM simple and synchronous in jsdom.
vi.mock("framer-motion", () => {
	const passthrough = (tag: string) =>
		React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
			(props, ref) => {
				const {
					children,
					variants,
					initial,
					animate,
					whileHover,
					transition,
					...rest
				} = props;
				return React.createElement(tag, { ref, ...rest }, children);
			},
		);
	return {
		motion: new Proxy({}, { get: (_target, key: string) => passthrough(key) }),
		AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
	};
});

const mockArticles = Array.from({ length: 12 }).map((_, i) => ({
	id: i + 1,
	title: `Article ${i + 1}`,
	url: `https://dev.to/a/${i + 1}`,
	cover_image: i % 2 === 0 ? `https://img.example/${i}.png` : null,
	user: { name: `Author ${i + 1}` },
	readable_publish_date: "Jan 1",
}));

beforeEach(() => {
	vi.stubGlobal(
		"fetch",
		vi.fn(() =>
			Promise.resolve({
				json: () => Promise.resolve(mockArticles),
			} as Response),
		),
	);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

async function renderInLang(lang: "en" | "sk") {
	await i18n.changeLanguage(lang);
	return render(React.createElement(IndustryNews));
}

describe("IndustryNews i18n runtime", () => {
	for (const lang of ["en", "sk"] as const) {
		it(`renders the four news strings in ${lang.toUpperCase()}`, async () => {
			const dict = lang === "en" ? en : sk;
			await renderInLang(lang);

			// Wait for fetch to resolve and grid to render.
			await waitFor(() =>
				expect(
					screen.getByText(dict.dashboard.newsShowMore, { exact: false }),
				).toBeInTheDocument(),
			);

			expect(screen.getByText(dict.dashboard.newsSource)).toBeInTheDocument();
			expect(
				screen.getByText(dict.dashboard.newsLiveBadge),
			).toBeInTheDocument();

			// Toggle expand to reveal "Show less".
			fireEvent.click(screen.getByRole("button"));
			expect(screen.getByText(dict.dashboard.newsShowLess)).toBeInTheDocument();
		});
	}

	it("uses NEWS_I18N_KEYS that exist in both EN and SK dictionaries", () => {
		const get = (obj: unknown, path: string) =>
			path.split(".").reduce<unknown>((value, key) => {
				if (value == null || typeof value !== "object") {
					return undefined;
				}
				return (value as Record<string, unknown>)[key];
			}, obj);
		for (const key of Object.values(NEWS_I18N_KEYS)) {
			expect(get(en, key), `EN missing ${key}`).toBeTypeOf("string");
			expect(get(sk, key), `SK missing ${key}`).toBeTypeOf("string");
		}
	});
});
