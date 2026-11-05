import { KeyIcon } from "@/components/ui/icons/KeyIcon";

import styles from "./OwnershipNote.module.css";

interface OwnershipNoteProps {
  text: string;
}

export function OwnershipNote({ text }: OwnershipNoteProps) {
  return (
    <p className={styles.note} data-ownership="">
      <span className={styles.icon}>
        <KeyIcon />
      </span>
      {text}
    </p>
  );
}
