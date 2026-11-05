import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";

import styles from "./PilotTask.module.css";

interface PilotTaskProps {
  text: string;
  cta: string;
  href: string;
}

export function PilotTask({ text, cta, href }: PilotTaskProps) {
  return (
    <Card className={styles.pilot} data-pilot="">
      <p className={styles.text}>{text}</p>
      <div>
        <Button href={href} icon={<ArrowIcon />}>
          {cta}
        </Button>
      </div>
    </Card>
  );
}
