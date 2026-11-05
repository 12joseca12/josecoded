import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { PriceState } from "@/components/ui/PriceState/PriceState";
import type { MaintenancePlan } from "@/types/services";

import styles from "./WarrantyPlans.module.css";

interface WarrantyPlansProps {
  warranty: { title: string; text: string };
  plans: { title: string; lead: string; items: MaintenancePlan[] };
  price: { unit: string; review: string };
  note: string;
}

export function WarrantyPlans({ warranty, plans, price, note }: WarrantyPlansProps) {
  return (
    <div className={styles.wrap}>
      <Card size="sm" className={styles.warranty} data-warranty="">
        <Heading level={3} size="h4">
          {warranty.title}
        </Heading>
        <p className={styles.text}>{warranty.text}</p>
      </Card>
      <div className={styles.plans}>
        <Heading level={3} size="h4">
          {plans.title}
        </Heading>
        <p className={styles.text}>{plans.lead}</p>
        <ul className={styles.list}>
          {plans.items.map((plan) => (
            <li key={plan.id} className={styles.entry}>
              <Card as="article" size="sm" className={styles.plan} data-plan={plan.id}>
                <Heading level={4} size="h4">
                  {plan.name}
                </Heading>
                <p className={styles.hours}>{plan.hours}</p>
                <p className={styles.text}>{plan.text}</p>
                <p>
                  {plan.amount === null ? (
                    <PriceState variant="review" label={price.review} />
                  ) : (
                    <PriceState variant="final" amount={plan.amount} unit={price.unit} />
                  )}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
