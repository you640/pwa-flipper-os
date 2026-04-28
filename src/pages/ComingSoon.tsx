import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ComingSoon({ title }: { title: string }) {
	const { t } = useTranslation();
	return (
		<AppLayout>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex min-h-[60vh] flex-col items-center justify-center text-center"
			>
				<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
					<Construction className="h-6 w-6 text-primary-foreground" />
				</div>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					{title}
				</h1>
				<p className="mt-2 max-w-md text-sm text-muted-foreground">
					{t("common.comingSoonDesc")}
				</p>
			</motion.div>
		</AppLayout>
	);
}
