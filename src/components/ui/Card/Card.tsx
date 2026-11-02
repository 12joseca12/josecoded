import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { CardSize, CardTone } from "@/types/ui";

import styles from "./Card.module.css";

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: CardTone;
  size?: CardSize;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  tone = "panel",
  size = "md",
  className,
  ...rest
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      {...rest}
      className={className ? `${styles.card} ${className}` : styles.card}
      data-tone={tone}
      data-size={size}
    />
  );
}
