import type { ComponentPropsWithoutRef } from "react";

import styles from "./Prose.module.css";

export function ProsePre(props: ComponentPropsWithoutRef<"pre">) {
  return <pre {...props} className={styles.pre} tabIndex={0} />;
}

export function ProseTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className={styles.tableScroll} tabIndex={0}>
      <table {...props} />
    </div>
  );
}
