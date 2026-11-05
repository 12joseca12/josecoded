import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { ExtraChipItem } from "@/types/services";

import styles from "./ExtraList.module.css";

interface ExtraListProps {
  action: string;
  legend: string;
  cta: string;
  hint: string;
  showAll: string;
  items: ExtraChipItem[];
}

export function ExtraList({ action, legend, cta, hint, showAll, items }: ExtraListProps) {
  const first = items.filter((item) => item.active);
  const rest = items.filter((item) => !item.active);
  const renderItem = (item: ExtraChipItem) => (
    <li key={item.slug} className={styles.entry}>
      <input
        id={`extra-${item.slug}`}
        className={styles.input}
        type="checkbox"
        name="extras"
        value={item.slug}
        aria-describedby={`extra-${item.slug}-text extra-${item.slug}-who`}
      />
      <label htmlFor={`extra-${item.slug}`} className={styles.chip} data-extra={item.slug}>
        <span className={styles.name}>{item.name}</span>
        <span id={`extra-${item.slug}-text`} className={styles.text}>
          {item.text}
        </span>
        <span id={`extra-${item.slug}-who`} className={styles.who}>
          {item.forWho}
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
  );
  return (
    <form method="get" action={action} className={styles.form}>
      <input type="hidden" name="via" value="project" />
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{legend}</legend>
        <ul className={styles.list}>{first.map(renderItem)}</ul>
        {rest.length > 0 ? (
          <details className={styles.more}>
            <summary className={styles.summary}>{showAll}</summary>
            <ul className={styles.list}>{rest.map(renderItem)}</ul>
          </details>
        ) : null}
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
