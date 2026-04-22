import { useTranslation } from "react-i18next";
import { motion, type Variants } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import {
  BookOpen,
  Lightbulb,
  Kanban,
  Cpu,
  Zap,
  ShieldCheck,
  Mail,
  Globe,
  Lock,
  Github,
  Linkedin,
  Twitter,
  Rocket,
  TrendingUp,
  Radar,
  ClipboardList,
} from "lucide-react";

const fade: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const stepIcons = [Lightbulb, Kanban, Cpu, Zap];
const ceoIcons = [Radar, TrendingUp, Rocket, ClipboardList];

export default function Docs() {
  const { t } = useTranslation();
  const { isAdmin, loading } = useProfile();

  const steps = [0, 1, 2, 3].map((i) => ({
    Icon: stepIcons[i],
    title: t(`docs.manual.steps.${i + 1}.title`),
    desc: t(`docs.manual.steps.${i + 1}.desc`),
    tip: t(`docs.manual.steps.${i + 1}.tip`),
  }));

  const faqItems = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    q: t(`docs.faq.items.${i}.q`),
    a: t(`docs.faq.items.${i}.a`),
  }));

  const ceoSections = (["market", "leads", "scale", "ops"] as const).map((k, i) => ({
    Icon: ceoIcons[i],
    title: t(`docs.ceo.sections.${k}.title`),
    body: t(`docs.ceo.sections.${k}.body`),
  }));

  return (
    <AppLayout>
      <SEO title={t("docs.seoTitle")} description={t("docs.seoDesc")} />

      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div initial="hidden" animate="show" variants={fade}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("docs.title")}{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {t("docs.titleAccent")}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">{t("docs.subtitle")}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card/40 backdrop-blur-xl border border-border/60 h-auto p-1">
            <TabsTrigger value="manual">{t("docs.tabs.manual")}</TabsTrigger>
            <TabsTrigger value="faq">{t("docs.tabs.faq")}</TabsTrigger>
            <TabsTrigger value="ceo">
              {t("docs.tabs.ceo")}
              <Lock className="ml-1.5 h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="about">{t("docs.tabs.about")}</TabsTrigger>
          </TabsList>

          {/* USER MANUAL */}
          <TabsContent value="manual" className="mt-6">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  variants={fade}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl shadow-xl"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                      <s.Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {t("docs.manual.stepLabel", { n: i + 1 })}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {s.desc}
                      </p>
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-2.5 text-xs text-muted-foreground">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{s.tip}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-6">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fade}
              className="rounded-2xl border border-border/60 bg-card/40 p-2 sm:p-4 backdrop-blur-xl shadow-xl"
            >
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                    <AccordionTrigger className="px-3 text-left text-sm font-medium hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </TabsContent>

          {/* CEO MANUAL */}
          <TabsContent value="ceo" className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
                {t("common.loading")}
              </div>
            ) : !isAdmin ? (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fade}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-8 text-center backdrop-blur-xl shadow-xl"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
                  <ShieldCheck className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t("docs.ceo.restrictedTitle")}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {t("docs.ceo.restricted")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="space-y-4"
              >
                <motion.div variants={fade} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">
                      {t("docs.ceo.headerTitle")}
                    </span>
                  </div>
                  <Badge variant="destructive" className="uppercase tracking-wider">
                    {t("docs.ceo.confidential")}
                  </Badge>
                </motion.div>

                <motion.div variants={fade} className="grid gap-4 sm:grid-cols-2">
                  {ceoSections.map((s, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-card/40 p-5 backdrop-blur-xl shadow-xl"
                    >
                      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-destructive/10 blur-3xl" />
                      <div className="relative flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15">
                          <s.Icon className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                            {s.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </TabsContent>

          {/* ABOUT & CONTACT */}
          <TabsContent value="about" className="mt-6">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="grid gap-4 lg:grid-cols-2"
            >
              <motion.div
                variants={fade}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl shadow-xl"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                    <Rocket className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {t("docs.about.missionTitle")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("docs.about.missionBody")}
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fade}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl shadow-xl"
              >
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                    <Mail className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {t("docs.about.contactTitle")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("docs.about.contactBody")}
                  </p>

                  <a
                    href="mailto:support@flipper-os.com"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground transition-colors hover:bg-background/70"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    support@flipper-os.com
                  </a>

                  <div className="mt-5 flex items-center gap-2">
                    {[
                      { Icon: Twitter, href: "https://x.com", label: "X" },
                      { Icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                      { Icon: Github, href: "https://github.com", label: "GitHub" },
                      { Icon: Globe, href: "https://flipper-os.com", label: "Web" },
                    ].map(({ Icon, href, label }) => (
                      <Button
                        key={label}
                        asChild
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-border/60 bg-background/40 hover:bg-background/70"
                      >
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
