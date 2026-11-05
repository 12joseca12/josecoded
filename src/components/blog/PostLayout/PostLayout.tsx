import type { ReactNode } from "react";

import styles from "./PostLayout.module.css";

interface PostLayoutProps {
  toc: ReactNode;
  children: ReactNode;
}

export function PostLayout({ toc, children }: PostLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.aside} data-print="hide">
        {toc}
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
