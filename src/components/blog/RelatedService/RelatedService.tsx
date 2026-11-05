import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { RelatedServiceData } from "@/types/blog";

import styles from "./RelatedService.module.css";

interface RelatedServiceProps {
  service: RelatedServiceData;
  variant?: "inline" | "closing";
}

export function RelatedService({ service, variant = "inline" }: RelatedServiceProps) {
  return (
    <Card
      as="div"
      size="md"
      className={styles.service}
      data-variant={variant}
      data-related-service=""
    >
      <p className={styles.title}>{service.title}</p>
      <p className={styles.text}>{service.text}</p>
      <div className={styles.actions}>
        <Button
          href={service.href}
          size="sm"
          variant={variant === "closing" ? "primary" : "light"}
          icon={<ArrowIcon />}
        >
          {service.cta}
        </Button>
      </div>
    </Card>
  );
}
