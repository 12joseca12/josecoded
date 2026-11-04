import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import type { PhaseNoteKind } from "@/types/hero";

import {
  briefFile,
  codeFile,
  codeLines,
  liveUrl,
  typeFace,
  typeSample,
  vars,
} from "../hero-content";
import styles from "./PhaseNote.module.css";

interface PhaseNoteProps {
  kind: PhaseNoteKind;
  locale: Locale;
}

function Check() {
  return <i className={styles.check} />;
}

export async function PhaseNote({ kind, locale }: PhaseNoteProps) {
  const t = await getTranslator(locale);

  return (
    <div className={styles.note} data-kind={kind}>
      {kind === "brief" ? (
        <>
          <p className={styles.file}>{briefFile}</p>
          <ul className={styles.brief}>
            <li>
              <span>{t("home.hero.demo.notes.who")}</span>
              {t("home.hero.demo.notes.whoValue")}
            </li>
            <li>
              <span>{t("home.hero.demo.notes.what")}</span>
              {t("home.hero.demo.notes.whatValue")}
            </li>
            <li>
              <span>{t("home.hero.demo.notes.where")}</span>
              {t("home.hero.demo.notes.whereValue")}
            </li>
          </ul>
        </>
      ) : null}

      {kind === "system" ? (
        <>
          <div className={styles.swatches}>
            <i />
            <i />
            <i />
          </div>
          <p className={styles.type}>
            <b>{typeSample}</b>
            <span>{typeFace}</span>
          </p>
          <div className={styles.space}>
            {[1, 2, 4, 6].map((step) => (
              <i key={step} style={vars({ "--s": step })} />
            ))}
          </div>
        </>
      ) : null}

      {kind === "code" ? (
        <>
          <p className={styles.file}>{codeFile}</p>
          <pre className={styles.code}>
            {codeLines.map((line, index) => (
              <span
                key={line.map((token) => token.text).join("")}
                className={styles.line}
                style={vars({ "--k": index })}
              >
                {line.map((token, position) => (
                  <i key={position} data-kind={token.kind}>
                    {token.text}
                  </i>
                ))}
              </span>
            ))}
          </pre>
          <p className={styles.ok}>
            <Check />
            {t("home.hero.demo.notes.tests")}
          </p>
        </>
      ) : null}

      {kind === "ship" ? (
        <>
          <p className={styles.head}>{t("home.hero.demo.notes.shipHead")}</p>
          <ul className={styles.checks}>
            <li style={vars({ "--n": 0 })}>
              <Check />
              {t("home.hero.demo.notes.store")}
              <span>{t("home.hero.demo.notes.storeNote")}</span>
            </li>
            <li style={vars({ "--n": 1 })}>
              <Check />
              {t("home.hero.demo.notes.play")}
              <span>{t("home.hero.demo.notes.playNote")}</span>
            </li>
            <li style={vars({ "--n": 2 })}>
              <Check />
              {liveUrl}
              <span>{t("home.hero.demo.notes.webNote")}</span>
            </li>
          </ul>
        </>
      ) : null}

      {kind === "care" ? (
        <>
          <p className={styles.head}>
            <i className={styles.pulse} />
            {t("home.hero.demo.notes.careHead")}
          </p>
          <dl className={styles.metrics}>
            <div>
              <dt>{t("home.hero.demo.notes.sessions")}</dt>
              <dd>{t("home.hero.demo.notes.sessionsValue")}</dd>
            </div>
            <div>
              <dt>{t("home.hero.demo.notes.load")}</dt>
              <dd>{t("home.hero.demo.notes.loadValue")}</dd>
            </div>
            <div>
              <dt>{t("home.hero.demo.notes.release")}</dt>
              <dd>{t("home.hero.demo.notes.releaseValue")}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </div>
  );
}
