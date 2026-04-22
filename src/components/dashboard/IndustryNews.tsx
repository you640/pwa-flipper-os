import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Newspaper, Globe, ChevronDown, ChevronUp } from "lucide-react";

interface Article {
  id: number;
  title: string;
  url: string;
  cover_image: string | null;
  user: { name: string; profile_image_90?: string };
  readable_publish_date: string;
}

const INITIAL_COUNT = 8;

function NewsCover({ article }: { article: Article }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !article.cover_image || errored;

  return (
    <div className="relative h-36 w-full overflow-hidden">
      {!showFallback && (
        <img
          src={article.cover_image as string}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setErrored(true)}
        />
      )}
      {showFallback && (
        <div className="relative h-full w-full bg-gradient-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-glow)/0.45),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="h-10 w-10 text-primary-foreground/30" strokeWidth={1.5} />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
      <div className="absolute right-3 top-3 rounded-full bg-background/70 p-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
        <ExternalLink className="h-3.5 w-3.5 text-foreground" />
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function IndustryNews() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("https://dev.to/api/articles?tag=pwa&per_page=24")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setArticles((Array.isArray(data) ? data : []).slice(0, 24));
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = articles
    ? expanded
      ? articles
      : articles.slice(0, INITIAL_COUNT)
    : [];
  const hasMore = (articles?.length ?? 0) > INITIAL_COUNT;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("dashboard.newsTitle")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("dashboard.newsSource")}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {t("dashboard.newsLiveBadge")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!articles && !error &&
          Array.from({ length: INITIAL_COUNT }).map((_, i) => (
            <Card key={i} className="glass overflow-hidden p-0">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}

        {error && (
          <Card className="glass col-span-full p-6 text-center text-sm text-muted-foreground">
            {t("dashboard.newsError")}
          </Card>
        )}

        <AnimatePresence initial={false}>
          {articles && (
            <motion.div
              key="news-grid"
              className="contents"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {visible.map((a) => (
                <motion.a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={cardVariants}
                  whileHover={{ y: -4 }}
                  className="group block"
                >
                  <Card className="glass relative flex h-full flex-col overflow-hidden p-0 shadow-elegant transition-all duration-300 hover:shadow-glow">
                    <NewsCover article={a} />
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {a.title}
                      </h3>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="truncate pr-2 text-xs text-muted-foreground">
                          {a.user.name}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary">
                          {t("dashboard.readArticle")} <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {articles && hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="gap-1.5"
          >
            {expanded ? (
              <>
                {t("dashboard.newsShowLess")} <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {t("dashboard.newsShowMore")} ({articles.length}){" "}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
