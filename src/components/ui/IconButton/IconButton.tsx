import type { ComponentPropsWithRef, ReactNode } from "react";

import styles from "./IconButton.module.css";

interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "children" | "aria-label"> {
  label: string;
  children: ReactNode;
}

export function IconButton({ label, children, type = "button", ...rest }: IconButtonProps) {
  return (
    <button {...rest} type={type} aria-label={label} className={styles.button}>
      {children}
    </button>
  );
}
