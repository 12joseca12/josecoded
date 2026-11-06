import Link from "next/link";

import type { RoomPickerLabels } from "@/types/crm-chat";
import type { RoomSummary } from "@/types/room";

import styles from "./RoomPicker.module.css";

interface RoomPickerProps {
  own: RoomSummary | undefined;
  clients: RoomSummary[];
  currentId: string;
  basePath: string;
  labels: RoomPickerLabels;
}

function RoomLink({
  room,
  title,
  current,
  href,
  labels,
}: {
  room: RoomSummary;
  title: string;
  current: boolean;
  href: string;
  labels: RoomPickerLabels;
}) {
  return (
    <Link
      className={styles.link}
      href={href}
      aria-current={current ? "page" : undefined}
      scroll={false}
    >
      <span className={styles.title}>{title}</span>
      {room.unread_count > 0 ? (
        <span className={styles.badge}>
          {labels.unread.replace("{count}", String(room.unread_count))}
        </span>
      ) : null}
      <span className={styles.excerpt}>{room.last_message_excerpt ?? labels.noMessages}</span>
    </Link>
  );
}

export function RoomPicker({ own, clients, currentId, basePath, labels }: RoomPickerProps) {
  return (
    <nav className={styles.picker} aria-label={labels.label}>
      <section className={styles.group} aria-labelledby="crm-chat-jose">
        <h2 id="crm-chat-jose" className={styles.heading}>
          {labels.jose}
        </h2>
        {own ? (
          <RoomLink
            room={own}
            title={labels.joseRoom}
            current={own.id === currentId}
            href={`${basePath}?sala=${own.id}`}
            labels={labels}
          />
        ) : null}
      </section>
      <section className={styles.group} aria-labelledby="crm-chat-clients">
        <h2 id="crm-chat-clients" className={styles.heading}>
          {labels.clients}
        </h2>
        {clients.length === 0 ? (
          <p className={styles.empty}>{labels.emptyClients}</p>
        ) : (
          clients.map((room) => (
            <RoomLink
              key={room.id}
              room={room}
              title={room.counterpart_name ?? labels.clientRoom}
              current={room.id === currentId}
              href={`${basePath}?sala=${room.id}`}
              labels={labels}
            />
          ))
        )}
      </section>
    </nav>
  );
}
