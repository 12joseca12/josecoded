import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { ExtraChipItem } from "@/types/services";

import styles from "./ExtraList.module.css";

interface ExtraListProps {
  action: string;
  legend: string;
  cta: string;
  hint: string;
  items: ExtraChipItem[];
}

export function ExtraList({ action, legend, cta, hint, items }: ExtraListProps) {
  return (
    <form method="get" action={action} className={styles.form}>
      <input type="hidden" name="via" value="project" />
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{legend}</legend>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.slug} className={styles.entry}>
              <input
                id={`extra-${item.slug}`}
                className={styles.input}
                type="checkbox"
                name="extras"
                value={item.slug}
                aria-describedby={`extra-${item.slug}-text`}
              />
              <label htmlFor={`extra-${item.slug}`} className={styles.chip} data-extra={item.slug}>
                <span className={styles.name}>{item.name}</span>
                <span id={`extra-${item.slug}-text`} className={styles.text}>
                  {item.text}
                </span>
                <span className={styles.meta}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                  <span className={styles.included}>{item.included}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className={styles.actions}>
        <Button type="submit" icon={<ArrowIcon />}>
          {cta}
        </Button>
        <p className={styles.hint}>{hint}</p>
      </div>
    </form>
  );
}
