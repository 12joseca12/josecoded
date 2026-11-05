import styles from "./PriceDrivers.module.css";

interface PriceDriversProps {
  text: string;
}

export function PriceDrivers({ text }: PriceDriversProps) {
  return (
    <p className={styles.drivers} data-price-drivers="">
      {text}
    </p>
  );
}
