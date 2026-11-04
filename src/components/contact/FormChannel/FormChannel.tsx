import { ChannelCard } from "../ChannelCard/ChannelCard";
import styles from "./FormChannel.module.css";

interface FormChannelProps {
  title: string;
  hint: string;
  soonLabel: string;
}

export function FormChannel({ title, hint, soonLabel }: FormChannelProps) {
  return (
    <ChannelCard id="formulario" title={title} hint={hint}>
      <p className={styles.soon}>{soonLabel}</p>
    </ChannelCard>
  );
}
