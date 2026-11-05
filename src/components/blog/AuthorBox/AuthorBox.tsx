import type { AuthorBoxData } from "@/types/blog";

import styles from "./AuthorBox.module.css";

interface AuthorBoxProps {
  author: AuthorBoxData;
}

export function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <section className={styles.box} aria-label={author.label}>
      <p className={styles.name}>{author.name}</p>
      <p className={styles.credential}>{author.credential}</p>
      <p className={styles.dates}>
        <span>
          {author.publishedPrefix} <time dateTime={author.published}>{author.publishedLabel}</time>
        </span>
        <span>
          {author.updatedPrefix} <time dateTime={author.updated}>{author.updatedLabel}</time>
        </span>
        <span>{author.readingLabel}</span>
      </p>
    </section>
  );
}
