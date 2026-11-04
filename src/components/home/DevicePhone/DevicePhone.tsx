import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { cx } from "@/lib/cx";

import { clockTime, rulerHigh, rulerWide, tags, vars } from "../hero-content";
import morph from "../morph.module.css";
import styles from "./DevicePhone.module.css";

interface DevicePhoneProps {
  locale: Locale;
}

function Cross() {
  return (
    <svg className={styles.cross} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M0 0 100 100M100 0 0 100" />
    </svg>
  );
}

export async function DevicePhone({ locale }: DevicePhoneProps) {
  const t = await getTranslator(locale);
  const rows = [
    {
      id: "new",
      fresh: true,
      slot: -1,
      order: 4,
      title: t("home.hero.demo.phone.rowNew.title"),
      meta: t("home.hero.demo.phone.rowNew.meta"),
      price: t("home.hero.demo.phone.rowNew.price"),
    },
    {
      id: "1",
      slot: 0,
      order: 4,
      title: t("home.hero.demo.phone.row1.title"),
      meta: t("home.hero.demo.phone.row1.meta"),
      price: t("home.hero.demo.phone.row1.price"),
      tag: tags.orderRow,
    },
    {
      id: "2",
      slot: 1,
      order: 5,
      title: t("home.hero.demo.phone.row2.title"),
      meta: t("home.hero.demo.phone.row2.meta"),
      price: t("home.hero.demo.phone.row2.price"),
    },
    {
      id: "3",
      slot: 2,
      order: 6,
      title: t("home.hero.demo.phone.row3.title"),
      meta: t("home.hero.demo.phone.row3.meta"),
      price: t("home.hero.demo.phone.row3.price"),
    },
    {
      id: "4",
      slot: 3,
      order: 7,
      last: true,
      title: t("home.hero.demo.phone.row4.title"),
      meta: t("home.hero.demo.phone.row4.meta"),
      price: t("home.hero.demo.phone.row4.price"),
    },
  ];

  return (
    <div className={cx(styles.slot, morph.float)}>
      <div className={styles.phone} data-device="phone">
        <div className={morph.wire} />
        <div className={morph.shell} />
        <div className={styles.screen}>
          <div className={morph.paper} />
          <div className={morph.ink} />

          <div className={cx(morph.el, styles.statusBar)} style={vars({ "--i": 0 })}>
            <span className={cx(morph.drawn, styles.time)}>{clockTime}</span>
            <span className={cx(morph.drawn, styles.island)} />
            <span className={cx(morph.drawn, styles.signal)}>
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className={cx(morph.el, styles.header)} style={vars({ "--i": 1 })}>
            <span className={cx(morph.sketch, styles.textLine)} />
            <span className={cx(morph.sketch, styles.dotLine)} />
            <span className={cx(morph.drawn, styles.headerTitle)}>
              {t("home.hero.demo.phone.title")}
            </span>
            <span className={cx(morph.drawn, styles.avatar)} />
            <span className={morph.tag} data-tag={tags.header} />
          </div>

          <div className={cx(morph.el, styles.card)} style={vars({ "--i": 2 })}>
            <span className={cx(morph.sketch, styles.box)}>
              <Cross />
            </span>
            <span className={cx(morph.sketch, styles.note)}>{t("home.hero.demo.phone.note")}</span>
            <span className={cx(morph.drawn, styles.cardBg)} />
            <span className={styles.cardNow}>
              <b>{t("home.hero.demo.phone.nowTitle")}</b>
              <small>{t("home.hero.demo.phone.nowSub")}</small>
            </span>
            <span className={styles.cardLive}>
              <b>{t("home.hero.demo.phone.weekTotal")}</b>
              <small>{t("home.hero.demo.phone.weekLabel")}</small>
              <span className={styles.spark}>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path d="M0 24 C 10 22, 16 26, 26 20 S 42 12, 52 15 S 70 8, 80 9 S 94 3, 100 2" />
                </svg>
                <span className={styles.cover} />
              </span>
            </span>
            <span className={styles.selection}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className={cx(styles.ruler, styles.rulerWide)}>
              <span>{rulerWide}</span>
            </span>
            <span className={cx(styles.ruler, styles.rulerHigh)}>
              <span>{rulerHigh}</span>
            </span>
            <span className={morph.tag} data-tag={tags.orderCard} />
          </div>

          <div className={cx(morph.el, styles.label)} style={vars({ "--i": 3 })}>
            <span className={cx(morph.sketch, styles.textLine, styles.labelLine)} />
            <span className={morph.drawn}>{t("home.hero.demo.phone.recent")}</span>
          </div>

          <div className={styles.rows}>
            {rows.map((row) => (
              <div
                key={row.id}
                className={cx(styles.row, row.fresh && styles.fresh, row.last && styles.last)}
                style={vars({ "--i": row.order, "--r": row.slot })}
              >
                {row.fresh ? null : (
                  <>
                    <span className={cx(morph.sketch, styles.box)} />
                    <span className={cx(morph.sketch, styles.thumbLine)} />
                    <span className={cx(morph.sketch, styles.linesLine)} />
                  </>
                )}
                <span className={cx(morph.drawn, styles.rowBg)} />
                <span className={cx(morph.drawn, styles.rowThumb)} />
                <span className={cx(morph.drawn, styles.rowText)}>
                  <b>{row.title}</b>
                  <small>
                    {row.fresh ? <i /> : null}
                    {row.meta}
                  </small>
                </span>
                <span className={cx(morph.drawn, styles.rowPrice)}>{row.price}</span>
                {row.tag ? <span className={morph.tag} data-tag={row.tag} /> : null}
              </div>
            ))}
          </div>

          <div className={cx(morph.el, styles.tabBar)} style={vars({ "--i": 8 })}>
            <span className={cx(morph.sketch, styles.box, styles.tabBox)} />
            <span className={cx(morph.drawn, styles.tabBg)} />
            <span className={cx(morph.drawn, styles.tabIcons)}>
              <i data-on="" />
              <i />
              <i />
              <i />
            </span>
            <span className={morph.tag} data-tag={tags.tabBar} />
          </div>

          <div className={styles.toast}>
            <i />
            <span className={styles.toastShip}>{t("home.hero.demo.phone.toastShip")}</span>
            <span className={styles.toastCare}>{t("home.hero.demo.phone.toastCare")}</span>
          </div>

          <span className={morph.scan} />
        </div>
      </div>
    </div>
  );
}
