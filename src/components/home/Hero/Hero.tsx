import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Link } from "@/components/ui/Link/Link";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { type PhaseId, phaseIds, phaseNoteKinds } from "@/types/hero";

import { DemoTag } from "../DemoTag/DemoTag";
import { DeviceBrowser } from "../DeviceBrowser/DeviceBrowser";
import { DevicePhone } from "../DevicePhone/DevicePhone";
import { HeroStage } from "../HeroStage/HeroStage";
import { PhaseNote } from "../PhaseNote/PhaseNote";
import styles from "./Hero.module.css";

interface HeroProps {
  locale: Locale;
}

const phaseKeys: Record<PhaseId, MessageKey> = {
  discover: "home.hero.phases.discover",
  design: "home.hero.phases.design",
  build: "home.hero.phases.build",
  publish: "home.hero.phases.publish",
  maintain: "home.hero.phases.maintain",
};

const titleId = "hero-title";

export async function Hero({ locale }: HeroProps) {
  const t = await getTranslator(locale);
  const phases = phaseIds.map((id) => ({ id, label: t(phaseKeys[id]) }));

  return (
    <section id="hero" className={styles.hero} aria-labelledby={titleId} data-block="">
      <div className={styles.copy}>
        <Heading level={1} size="h1" id={titleId} accent={t("home.hero.accent")}>
          {t("home.hero.title")}
        </Heading>
        <p className={styles.lead}>{t("home.hero.lead")}</p>
        <div className={styles.actions}>
          <Button href={`/${locale}/contacto`} icon={<ArrowIcon />}>
            {t("home.hero.ctaPrimary")}
          </Button>
          <Button href={`/${locale}/proyectos`} variant="light">
            {t("home.hero.ctaSecondary")}
          </Button>
        </div>
        <p className={styles.identity}>
          {t("home.hero.identity")}{" "}
          <Link href={`/${locale}/sobre-mi`}>{t("home.hero.identityLink")}</Link>
        </p>
      </div>
      <HeroStage
        phases={phases}
        labels={{
          list: t("home.hero.rail.list"),
          pause: t("home.hero.rail.pause"),
          resume: t("home.hero.rail.resume"),
          pauseText: t("home.hero.rail.pauseText"),
          resumeText: t("home.hero.rail.resumeText"),
        }}
        note={
          <p>
            <VisuallyHidden>{t("home.hero.demoNote")}</VisuallyHidden>
          </p>
        }
      >
        <DemoTag label={t("home.hero.demoTag")} />
        <DeviceBrowser locale={locale} />
        <DevicePhone locale={locale} />
        {phaseNoteKinds.map((kind) => (
          <PhaseNote key={kind} kind={kind} locale={locale} />
        ))}
      </HeroStage>
    </section>
  );
}
