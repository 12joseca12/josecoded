import { Heading } from "@/components/ui/Heading/Heading";
import { settingGroups } from "@/lib/settings/definitions";
import type { SwitchListProps } from "@/types/system";

import { SettingRow } from "./SettingRow";
import styles from "./SwitchList.module.css";

export function SwitchList({ settings, labels, locale, save, readOnly }: SwitchListProps) {
  return (
    <div className={styles.groups} role="region" aria-label={labels.region}>
      {settingGroups.map((group) => {
        const rows = settings.filter((setting) => setting.group === group);
        if (rows.length === 0) return null;
        const headingId = `settings-${group}`;
        return (
          <section key={group} className={styles.group} aria-labelledby={headingId}>
            <header className={styles.groupHead}>
              <Heading level={2} size="h4" id={headingId}>
                {labels.groups[group].title}
              </Heading>
              <p className={styles.groupText}>{labels.groups[group].text}</p>
            </header>
            <ul className={styles.list}>
              {rows.map((setting) => (
                <SettingRow
                  key={setting.key}
                  setting={setting}
                  item={labels.items[setting.key]}
                  labels={labels.row}
                  locale={locale}
                  save={save}
                  readOnly={readOnly}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
