import Link from "next/link";

import { Button } from "@/components/ui/Button/Button";
import {
  type ContactFilterLabels,
  type ContactFilters as Filters,
  contactKinds,
  type ContactOwner,
  dealStages,
  noOwnerFilter,
} from "@/types/crm";

import styles from "./ContactFilters.module.css";

interface ContactFiltersProps {
  action: string;
  filters: Filters;
  owners: ContactOwner[];
  showOwner: boolean;
  allowNoOwner: boolean;
  active: boolean;
  labels: ContactFilterLabels;
}

export function ContactFilters({
  action,
  filters,
  owners,
  showOwner,
  allowNoOwner,
  active,
  labels,
}: ContactFiltersProps) {
  return (
    <form
      className={styles.bar}
      method="get"
      action={action}
      role="search"
      aria-label={labels.region}
    >
      <div className={styles.field} data-wide="">
        <label htmlFor="contact-q" className={styles.label}>
          {labels.search}
        </label>
        <input
          id="contact-q"
          name="q"
          type="search"
          className={styles.control}
          defaultValue={filters.q}
          placeholder={labels.searchPlaceholder}
          maxLength={80}
          autoComplete="off"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="contact-kind" className={styles.label}>
          {labels.kind}
        </label>
        <select
          id="contact-kind"
          name="kind"
          className={styles.control}
          defaultValue={filters.kind ?? ""}
        >
          <option value="">{labels.all}</option>
          {contactKinds.map((kind) => (
            <option key={kind} value={kind}>
              {labels.kinds[kind]}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="contact-stage" className={styles.label}>
          {labels.stage}
        </label>
        <select
          id="contact-stage"
          name="stage"
          className={styles.control}
          defaultValue={filters.stage ?? ""}
        >
          <option value="">{labels.all}</option>
          {dealStages.map((stage) => (
            <option key={stage} value={stage}>
              {labels.stages[stage]}
            </option>
          ))}
        </select>
      </div>
      {showOwner ? (
        <div className={styles.field}>
          <label htmlFor="contact-owner" className={styles.label}>
            {labels.owner}
          </label>
          <select
            id="contact-owner"
            name="owner"
            className={styles.control}
            defaultValue={filters.owner ?? ""}
          >
            <option value="">{labels.all}</option>
            {allowNoOwner ? <option value={noOwnerFilter}>{labels.noOwner}</option> : null}
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <label className={styles.check}>
        <input type="checkbox" name="due" value="1" defaultChecked={filters.due} />
        <span>{labels.due}</span>
      </label>
      <div className={styles.actions}>
        <Button type="submit" variant="light" size="sm">
          {labels.apply}
        </Button>
        {active ? (
          <Link href={action} className={styles.clear}>
            {labels.clear}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
