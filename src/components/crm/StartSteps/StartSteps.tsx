import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import type { StartStep } from "@/types/crm-start";

import styles from "./StartSteps.module.css";

interface StartStepsProps {
  steps: StartStep[];
  label: string;
}

export function StartSteps({ steps, label }: StartStepsProps) {
  return (
    <ol className={styles.list} aria-label={label}>
      {steps.map((step) => (
        <li key={step.key} className={styles.item}>
          <Heading level={2} size="h4">
            {step.title}
          </Heading>
          <p className={styles.text}>{step.text}</p>
          <Link variant="arrow" href={step.href}>
            {step.action}
          </Link>
        </li>
      ))}
    </ol>
  );
}
