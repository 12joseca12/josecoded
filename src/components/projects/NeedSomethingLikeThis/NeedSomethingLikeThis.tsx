import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";

import styles from "./NeedSomethingLikeThis.module.css";

interface NeedSomethingLikeThisProps {
  title: string;
  text: string;
  service: { href: string; label: string };
  contact: { href: string; label: string };
}

export function NeedSomethingLikeThis({
  title,
  text,
  service,
  contact,
}: NeedSomethingLikeThisProps) {
  return (
    <Card as="aside" size="lg" aria-labelledby="necesitas-algo-asi">
      <div className={styles.body}>
        <Heading level={2} size="h3" id="necesitas-algo-asi">
          {title}
        </Heading>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          <Button href={contact.href} icon={<ArrowIcon />}>
            {contact.label}
          </Button>
          <Button href={service.href} variant="light">
            {service.label}
          </Button>
        </div>
      </div>
    </Card>
  );
}
