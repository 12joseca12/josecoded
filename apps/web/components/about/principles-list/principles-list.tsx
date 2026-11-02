import styles from './principles-list.module.css';

/** Three principles, each one a short promise with its reason. A plain list of headed items. */
export function PrinciplesList({ items }: { items: readonly { id: string; title: string; text: string }[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}
