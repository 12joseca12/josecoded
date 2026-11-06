import styles from "./AttachmentChip.module.css";

interface AttachmentChipProps {
  href: string;
  name: string;
  size: string;
  title: string;
}

export function AttachmentChip({ href, name, size, title }: AttachmentChipProps) {
  return (
    <a className={styles.chip} href={href} download={name} title={title}>
      <span className={styles.name}>{name}</span>
      <span className={styles.size}>{size}</span>
    </a>
  );
}
