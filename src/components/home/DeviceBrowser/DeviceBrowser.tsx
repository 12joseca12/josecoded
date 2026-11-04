import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { cx } from "@/lib/cx";

import { chartBars, liveUrl, localUrl, tags, vars } from "../hero-content";
import morph from "../morph.module.css";
import styles from "./DeviceBrowser.module.css";

interface DeviceBrowserProps {
  locale: Locale;
}

function Lock() {
  return (
    <svg viewBox="0 0 10 12">
      <rect x="1" y="5" width="8" height="6" rx="1.4" />
      <path d="M3 5V3.6a2 2 0 0 1 4 0V5" />
    </svg>
  );
}

export async function DeviceBrowser({ locale }: DeviceBrowserProps) {
  const t = await getTranslator(locale);
  const kpis = [
    {
      id: "orders",
      label: t("home.hero.demo.browser.orders"),
      now: t("home.hero.demo.browser.ordersNow"),
      live: t("home.hero.demo.browser.ordersLive"),
    },
    {
      id: "wait",
      label: t("home.hero.demo.browser.wait"),
      now: t("home.hero.demo.browser.waitNow"),
      live: t("home.hero.demo.browser.waitLive"),
    },
    {
      id: "rating",
      label: t("home.hero.demo.browser.rating"),
      now: t("home.hero.demo.browser.ratingNow"),
      live: t("home.hero.demo.browser.ratingLive"),
    },
  ];

  return (
    <div className={cx(styles.slot, morph.float)}>
      <div className={styles.web} data-device="browser">
        <div className={morph.wire} />
        <div className={morph.shell} />
        <div className={styles.body}>
          <div className={morph.paper} />
          <div className={morph.ink} />

          <div className={cx(morph.el, styles.bar)} style={vars({ "--i": 0 })}>
            <span className={cx(styles.dots, morph.drawn)}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.url}>
              <span className={cx(morph.sketch, styles.textLine, styles.urlLine)} />
              <span className={styles.urlText} data-for="1">
                {t("home.hero.demo.browser.designUrl")}
              </span>
              <span className={styles.urlText} data-for="2">
                {localUrl}
              </span>
              <span className={styles.urlText} data-for="3">
                <Lock />
                {liveUrl}
              </span>
              <span className={styles.urlText} data-for="4">
                <Lock />
                {liveUrl}
              </span>
            </span>
            <span className={styles.pill}>
              <i />
              {t("home.hero.demo.browser.live")}
            </span>
          </div>

          <div className={cx(morph.el, styles.side)} style={vars({ "--i": 1 })}>
            <span className={cx(morph.sketch, styles.box, styles.sideBox)} />
            <span className={cx(morph.drawn, styles.sideBg)} />
            <span className={cx(morph.drawn, styles.logo)} />
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={cx(morph.drawn, styles.item)}
                data-on={index === 0 ? "" : undefined}
                style={vars({ "--k": index })}
              />
            ))}
            <span className={morph.tag} data-tag={tags.sidebar} />
          </div>

          <div className={cx(morph.el, styles.title)} style={vars({ "--i": 2 })}>
            <span className={cx(morph.sketch, styles.textLine, styles.titleLine)} />
            <span className={cx(morph.drawn, styles.titleText)}>
              {t("home.hero.demo.browser.title")}
            </span>
          </div>

          <div className={cx(morph.el, styles.kpis)} style={vars({ "--i": 3 })}>
            {kpis.map((kpi, index) => (
              <span key={kpi.id} className={styles.kpi} style={vars({ "--k": index })}>
                <span className={cx(morph.sketch, styles.box)} />
                <span className={cx(morph.drawn, styles.kpiBg)} />
                <small className={morph.drawn}>{kpi.label}</small>
                <b className={morph.drawn}>
                  <em className={styles.now}>{kpi.now}</em>
                  <em className={styles.live}>{kpi.live}</em>
                </b>
              </span>
            ))}
            <span className={morph.tag} data-tag={tags.kpi} />
          </div>

          <div className={cx(morph.el, styles.chart)} style={vars({ "--i": 4 })}>
            <span className={cx(morph.sketch, styles.box)}>
              <svg className={styles.cross} viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0 100 100M100 0 0 100" />
              </svg>
            </span>
            <span className={cx(morph.drawn, styles.chartBg)} />
            <span className={cx(morph.drawn, styles.bars)}>
              {chartBars.map((height, index) => (
                <i key={height} style={vars({ "--h": height, "--k": index })} />
              ))}
            </span>
            <span className={styles.line}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M2 32 C 14 30, 22 26, 32 27 S 50 20, 60 18 S 80 10, 98 5" />
              </svg>
              <span className={styles.cover} />
            </span>
            <span className={morph.tag} data-tag={tags.chart} />
          </div>

          <span className={morph.scan} />
        </div>
      </div>
    </div>
  );
}
