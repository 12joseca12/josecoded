import styles from "./WarrantyChip.module.css";

interface WarrantyChipProps {
  label: string;
}

export function WarrantyChip({ label }: WarrantyChipProps) {
  return (
    <span className={styles.chip} data-warranty-chip="">
      {label}
    </span>
  );
}
