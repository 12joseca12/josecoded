import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";

import styles from "./BlogClosing.module.css";

interface BlogClosingProps {
  title: string;
  text: string;
  cta: string;
  href: string;
}

export function BlogClosing({ title, text, cta, href }: BlogClosingProps) {
  return (
    <section className={styles.closing} aria-labelledby="blog-closing-title">
      <Heading level={2} size="h3" id="blog-closing-title">
        {title}
      </Heading>
      <p className={styles.text}>{text}</p>
      <div>
        <Button href={href} icon={<ArrowIcon />}>
          {cta}
        </Button>
      </div>
    </section>
  );
}
