import * as React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
	title: string;
	description: string;
	image?: string;
	url?: string;
	type?: "website" | "article";
	twitterHandle?: string;
}

const DEFAULT_IMAGE = "/icons/icon-512.png";
const DEFAULT_TWITTER = "@flipperos";
const SITE_NAME = "Flipper OS";

function SEOComponent({
	title,
	description,
	image,
	url,
	type = "website",
	twitterHandle = DEFAULT_TWITTER,
}: SEOProps) {
	const resolvedUrl =
		url ??
		(typeof window !== "undefined"
			? window.location.href
			: "https://flipperos.app/");
	const resolvedImage =
		image ??
		(typeof window !== "undefined"
			? `${window.location.origin}${DEFAULT_IMAGE}`
			: DEFAULT_IMAGE);

	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebApplication",
				name: SITE_NAME,
				url: resolvedUrl,
				description,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Any",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
			},
			{
				"@type": "SoftwareApplication",
				name: SITE_NAME,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Any",
				description,
				image: resolvedImage,
				aggregateRating: {
					"@type": "AggregateRating",
					ratingValue: "4.9",
					ratingCount: "127",
				},
			},
		],
	};

	return (
		<Helmet>
			{/* Standard */}
			<title>{title}</title>
			<meta name="description" content={description} />
			<link rel="canonical" href={resolvedUrl} />

			{/* OpenGraph */}
			<meta property="og:type" content={type} />
			<meta property="og:site_name" content={SITE_NAME} />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={resolvedImage} />
			<meta property="og:url" content={resolvedUrl} />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:creator" content={twitterHandle} />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={resolvedImage} />

			{/* Structured data */}
			<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
		</Helmet>
	);
}

export const SEO = React.memo(SEOComponent);
export default SEO;
