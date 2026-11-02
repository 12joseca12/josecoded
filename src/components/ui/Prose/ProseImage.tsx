import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

import styles from "./Prose.module.css";

const defaultWidth = 1200;
const defaultHeight = 675;

type ProseImageProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "width" | "height"> & {
  src?: string;
  width?: number | string;
  height?: number | string;
};

export function ProseImage({ src, alt, width, height, title }: ProseImageProps) {
  if (!src) return null;
  return (
    <Image
      className={styles.image}
      src={src}
      alt={alt ?? ""}
      title={title}
      width={Number(width ?? defaultWidth)}
      height={Number(height ?? defaultHeight)}
      sizes="(min-width: 48rem) 42rem, 100vw"
    />
  );
}
