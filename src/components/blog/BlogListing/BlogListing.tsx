import type { ReactNode } from "react";

import type { CategoryTabItem, PaginationData, PostTeaserData } from "@/types/blog";

import { CategoryTabs } from "../CategoryTabs/CategoryTabs";
import { Pagination } from "../Pagination/Pagination";
import { PostTeaser } from "../PostTeaser/PostTeaser";
import styles from "./BlogListing.module.css";

interface BlogListingProps {
  tabsLabel: string;
  tabs: CategoryTabItem[];
  posts: PostTeaserData[];
  pagination: PaginationData | null;
  closing: ReactNode;
}

export function BlogListing({ tabsLabel, tabs, posts, pagination, closing }: BlogListingProps) {
  return (
    <div className={styles.listing}>
      <CategoryTabs label={tabsLabel} items={tabs} />
      <ul className={styles.grid}>
        {posts.map((post) => (
          <li key={post.href}>
            <PostTeaser post={post} />
          </li>
        ))}
      </ul>
      {pagination ? <Pagination data={pagination} /> : null}
      {closing}
    </div>
  );
}
