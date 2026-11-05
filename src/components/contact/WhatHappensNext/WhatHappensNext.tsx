import { Heading } from "@/components/ui/Heading/Heading";

import styles from "./WhatHappensNext.module.css";

interface WhatHappensNextProps {
  title: string;
  steps: string[];
  size?: "sm" | "md";
}

export function WhatHappensNext({ title, steps, size = "md" }: WhatHappensNextProps) {
  return (
    <section className={styles.next} data-size={size} data-testid="what-happens-next">
      <Heading level={3} size="h4">
        {title}
      </Heading>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step} className={styles.step}>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
