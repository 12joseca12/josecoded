import { Link } from "@/components/ui/Link/Link";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import type { SuggestionId } from "@/types/errors";

import styles from "./RouteSuggestion.module.css";

interface RouteSuggestionProps {
  locale: Locale;
  suggestion: SuggestionId;
}

const targets: Record<SuggestionId, { path: string; label: MessageKey }> = {
  services: { path: "/servicios", label: "nav.services" },
  freelance: { path: "/servicios/freelance", label: "services.ways.freelance.nav" },
  offers: { path: "/servicios/a-medida", label: "services.ways.project.nav" },
  projects: { path: "/proyectos", label: "nav.projects" },
  about: { path: "/sobre-mi", label: "nav.about" },
  how: { path: "/como-trabajo", label: "services.how.title" },
  contact: { path: "/contacto", label: "nav.contact" },
  privacy: { path: "/legal/privacidad", label: "footer.privacy" },
  cookies: { path: "/legal/cookies", label: "footer.cookies" },
  notice: { path: "/legal/aviso-legal", label: "footer.notice" },
};

export async function RouteSuggestion({ locale, suggestion }: RouteSuggestionProps) {
  const t = await getTranslator(locale);
  const target = targets[suggestion];

  return (
    <p className={styles.suggestion} data-suggestion={suggestion}>
      {t("suggestion.lead")}{" "}
      <Link href={`/${locale}${target.path}`} variant="arrow">
        {t(target.label)}
      </Link>
    </p>
  );
}
