import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { linkDomain } from "@/lib/area/overview";
import type { ProjectLink } from "@/types/area";

import styles from "./ProjectLinks.module.css";

export interface ProjectLinksLabels {
  title: string;
  newTab: string;
}

interface ProjectLinksProps {
  links: ProjectLink[];
  labels: ProjectLinksLabels;
}

export function ProjectLinks({ links, labels }: ProjectLinksProps) {
  if (links.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="area-links">
      <Heading level={2} size="h4" id="area-links">
        {labels.title}
      </Heading>
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.id} className={styles.item}>
            <Link href={link.url} external newTabLabel={labels.newTab}>
              {link.name}
            </Link>
            <span className={styles.domain}>{linkDomain(link.url)}</span>
            {link.usage ? <p className={styles.usage}>{link.usage}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
