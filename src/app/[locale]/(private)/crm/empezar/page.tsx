import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StartSteps } from "@/components/crm/StartSteps/StartSteps";
import { Heading } from "@/components/ui/Heading/Heading";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { buildStartSteps } from "@/lib/crm/start";

import styles from "../crm.module.css";
import local from "./empezar.module.css";

interface StartProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: StartProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.start.meta.title") };
}

export default async function StartPage({ params }: StartProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  const steps = buildStartSteps(
    {
      telegram: {
        title: t("crm.start.steps.telegram.title"),
        text: t("crm.start.steps.telegram.text"),
        action: t("crm.start.steps.telegram.action"),
      },
      rates: {
        title: t("crm.start.steps.rates.title"),
        text: t("crm.start.steps.rates.text"),
        action: t("crm.start.steps.rates.action"),
      },
      leads: {
        title: t("crm.start.steps.leads.title"),
        text: t("crm.start.steps.leads.text"),
        action: t("crm.start.steps.leads.action"),
      },
      contact: {
        title: t("crm.start.steps.contact.title"),
        text: t("crm.start.steps.contact.text"),
        action: t("crm.start.steps.contact.action"),
      },
      nextStep: {
        title: t("crm.start.steps.nextStep.title"),
        text: t("crm.start.steps.nextStep.text"),
        action: t("crm.start.steps.nextStep.action"),
      },
    },
    locale,
    { admin: member.role === "admin" },
  );
  const rules = [
    t("crm.start.rules.response").replace("{time}", t("common.responseTime")),
    t("crm.start.rules.price"),
    t("crm.start.rules.invoices"),
    t("crm.start.rules.channels"),
  ];
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.start.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.start.lead")}</p>
      </header>
      <div className={local.stack}>
        <StartSteps steps={steps} label={t("crm.start.stepsLabel")} />
        <section className={local.rules} aria-labelledby="rules-title">
          <Heading level={2} size="h3" id="rules-title">
            {t("crm.start.rules.title")}
          </Heading>
          <p className={local.rulesLead}>{t("crm.start.rules.lead")}</p>
          <ul className={local.ruleList}>
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
