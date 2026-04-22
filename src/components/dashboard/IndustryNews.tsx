import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Newspaper } from "lucide-react";

interface Article {
  id: number;
  title: string;
  url: string;
  cover_image: string | null;
  user: { name: string; profile_image_90?: string };
  readable_publish_date: string;
}

export function IndustryNews() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("https://dev.to/api/articles?tag=pwa&top=3")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setArticles((Array.isArray(data) ? data : []).slice(0, 3));
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">PWA Industry News</h2>
        </div>
        <span className="text-xs text-muted-foreground">via dev.to · live</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {!articles && !error &&
          Array.from({ length: 3 }).map((_, i) => (
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
            Couldn't reach the news feed right now.
          </Card>
        )}

        {articles?.map((a, i) => (
          <motion.a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="group block"
          >
            <Card className="glass relative h-full overflow-hidden p-0 shadow-elegant transition-all duration-300 hover:shadow-glow">
              <div className="relative h-36 w-full overflow-hidden">
                {a.cover_image ? (
                  <img
                    src={a.cover_image}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-primary opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute right-3 top-3 rounded-full bg-background/70 p-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                  <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                </div>
              </div>

              <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {a.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{a.user.name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    Read Article <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
