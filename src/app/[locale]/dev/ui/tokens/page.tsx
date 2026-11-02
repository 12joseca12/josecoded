import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { type TokenName, tokenNames } from "@/styles/tokens.generated";

import styles from "./page.module.css";

const colorPrefixes = [
  "--bg",
  "--steel",
  "--charcoal",
  "--coral",
  "--ink",
  "--on-dark",
  "--line",
  "--glass",
  "--panel",
  "--focus",
  "--error",
  "--sk",
];

const withPrefix = (prefixes: string[]) =>
  tokenNames.filter((name) => prefixes.some((prefix) => name.startsWith(prefix)));

const sample = (name: TokenName): CSSProperties =>
  ({ "--sample": `var(${name})` }) as CSSProperties;

export default async function TokensPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  const colors = withPrefix(colorPrefixes).filter(
    (name) => !name.startsWith("--font") && !name.startsWith("--fs") && !name.startsWith("--fw"),
  );
  const sizes = withPrefix(["--fs-"]);
  const radii = withPrefix(["--radius-"]);
  const shadows = withPrefix(["--shadow-"]);
  const durations = withPrefix(["--dur"]);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("dev.tokens.title")}</h1>

      <section className={styles.section} aria-labelledby="tokens-colors">
        <h2 id="tokens-colors" className={styles.heading}>
          {t("dev.tokens.colors")}
        </h2>
        <ul className={styles.grid}>
          {colors.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.swatch} style={sample(name)} />
              <code className={styles.name}>{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="tokens-type">
        <h2 id="tokens-type" className={styles.heading}>
          {t("dev.tokens.typeScale")}
        </h2>
        <ul className={styles.stack}>
          {sizes.map((name) => (
            <li key={name} className={styles.typeRow}>
              <code className={styles.name}>{name}</code>
              <span className={styles.type} style={sample(name)}>
                {t("dev.tokens.sample")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="tokens-radii">
        <h2 id="tokens-radii" className={styles.heading}>
          {t("dev.tokens.radii")}
        </h2>
        <ul className={styles.grid}>
          {radii.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.radius} style={sample(name)} />
              <code className={styles.name}>{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="tokens-shadows">
        <h2 id="tokens-shadows" className={styles.heading}>
          {t("dev.tokens.shadows")}
        </h2>
        <ul className={styles.grid}>
          {shadows.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.shadow} style={sample(name)} />
              <code className={styles.name}>{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="tokens-durations">
        <h2 id="tokens-durations" className={styles.heading}>
          {t("dev.tokens.durations")}
        </h2>
        <ul className={styles.stack}>
          {durations.map((name) => (
            <li key={name} className={styles.typeRow}>
              <code className={styles.name}>{name}</code>
              <span className={styles.track}>
                <span className={styles.runner} style={sample(name)} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
