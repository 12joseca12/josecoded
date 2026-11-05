import { useId } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { FilterField } from "@/types/filters";

import styles from "./FilterBar.module.css";

interface FilterBarProps {
  label: string;
  action: string;
  fields: FilterField[];
  hidden?: Record<string, string>;
  submitLabel: string;
  clearLabel: string;
  clearHref: string;
  active: boolean;
}

export function FilterBar({
  label,
  action,
  fields,
  hidden = {},
  submitLabel,
  clearLabel,
  clearHref,
  active,
}: FilterBarProps) {
  const id = useId();
  return (
    <form className={styles.bar} method="get" action={action} role="search" aria-label={label}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) => (
        <div key={field.name} className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-${field.name}`}>
            {field.label}
          </label>
          {field.kind === "search" ? (
            <input
              id={`${id}-${field.name}`}
              className={styles.control}
              type="search"
              name={field.name}
              defaultValue={field.value}
              maxLength={field.maxLength}
              autoComplete="off"
            />
          ) : (
            <select
              id={`${id}-${field.name}`}
              className={styles.control}
              name={field.name}
              defaultValue={field.value}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      <div className={styles.actions}>
        <Button type="submit" variant="light" size="sm">
          {submitLabel}
        </Button>
        {active ? (
          <Button href={clearHref} variant="quiet" size="sm">
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
