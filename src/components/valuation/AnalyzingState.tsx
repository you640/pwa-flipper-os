import { motion } from "framer-motion";
import { Brain, Gauge, Sparkles, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEPS = [
  { key: "parsing", icon: Brain },
  { key: "benchmarking", icon: Gauge },
  { key: "pricing", icon: Target },
  { key: "strategy", icon: Sparkles },
] as const;

export function AnalyzingState() {
  const { t } = useTranslation();
  return (
    <div className="relative space-y-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain className="h-5 w-5" />
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
