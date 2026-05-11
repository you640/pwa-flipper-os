/**
 * Single source of truth for the news-related i18n keys used by the
 * Industry News dashboard widget. Reference these constants instead of
 * inlining string keys so EN and SK can never drift out of sync — adding or
 * renaming a key requires touching this file plus both locale files.
 */
export const NEWS_I18N_KEYS = {
  title: "dashboard.newsTitle",
  source: "dashboard.newsSource",
  liveBadge: "dashboard.newsLiveBadge",
  showMore: "dashboard.newsShowMore",
  showLess: "dashboard.newsShowLess",
  error: "dashboard.newsError",
  readArticle: "dashboard.readArticle",
} as const;

export type NewsI18nKey = (typeof NEWS_I18N_KEYS)[keyof typeof NEWS_I18N_KEYS];
