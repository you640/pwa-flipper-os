import { motion } from "framer-motion";
import { Github, Code2, BarChart3, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEPS = [
  { key: "fetching", icon: Github },
  { key: "analyzing", icon: Code2 },
  { key: "benchmarking", icon: BarChart3 },
  { key: "pricing", icon: Coins },
] as const;

const SNIPPETS = [
  "<Component/>",
  "useState()",
  "await fetch()",
  "tsconfig.json",
  ".test.tsx",
  "export default",
  "supabase.from()",
  "tailwind.config",
];

export function AnalyzingState() {
  const { t } = useTranslation();
  return (
    <div className="relative space-y-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Code2 className="h-5 w-5" />
        </motion.div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-primary">
            {t("valuation.ai.analyzing")}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("valuation.ai.analyzingHint")}
          </div>
        </div>
      </div>

      {/* Floating code snippet stream */}
      <div className="relative h-12 overflow-hidden rounded-lg border border-border/40 bg-card/20">
        <div className="absolute inset-0 flex items-center">
          {[...SNIPPETS, ...SNIPPETS].map((s, i) => (
            <motion.span
              key={i}
              className="mx-3 whitespace-nowrap font-mono text-[11px] text-primary/60"
              initial={{ x: 0 }}
              animate={{ x: -800 }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.1,
              }}
            >
              {s}
            </motion.span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-card/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card/80 to-transparent" />
      </div>

      <div className="space-y-2">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0.3, x: -8 }}
            animate={{ opacity: [0.3, 1, 0.3], x: 0 }}
            transition={{
              duration: 2.4,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2.5"
          >
            <s.icon className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              {t(`valuation.ai.steps.${s.key}`)}
            </span>
            <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted/40">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary-glow"
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "100%", "0%"] }}
                transition={{
                  duration: 2.4,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
