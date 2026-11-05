import NextLink from "next/link";

import { Card } from "@/components/ui/Card/Card";
import type { PostTeaserData } from "@/types/blog";

import styles from "./PostTeaser.module.css";

interface PostTeaserProps {
  post: PostTeaserData;
  headingLevel?: 2 | 3;
}

export function PostTeaser({ post, headingLevel = 2 }: PostTeaserProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Card as="article" size="lg" className={styles.teaser} data-kind={post.kind}>
      <p className={styles.eyebrow}>
        <span>{post.categoryLabel}</span>
        {post.kindLabel ? <span className={styles.kind}>{post.kindLabel}</span> : null}
      </p>
      <Heading className={styles.title}>
        <NextLink href={post.href} className={styles.link}>
          {post.title}
        </NextLink>
      </Heading>
      <p className={styles.description}>{post.description}</p>
      <p className={styles.meta}>
        <time dateTime={post.updated}>{post.updatedLabel}</time>
        <span>{post.readingLabel}</span>
      </p>
    </Card>
  );
}
