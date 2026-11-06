import Link from "next/link";

import { ConsentBadge } from "@/components/chat/ConsentBadge/ConsentBadge";
import type { ConversationListLabels } from "@/types/admin-chat";
import type { RoomSummary } from "@/types/room";

import styles from "./ConversationList.module.css";

interface ConversationListProps {
  rooms: RoomSummary[];
  locale: string;
  detailBase: string;
  labels: ConversationListLabels;
}

function nameOf(room: RoomSummary, labels: ConversationListLabels): string {
  if (room.kind === "visitor") return labels.visitor;
  return room.counterpart_name ?? labels.kinds[room.kind];
}

export function ConversationList({ rooms, locale, detailBase, labels }: ConversationListProps) {
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  return (
    <ul className={styles.list}>
      {rooms.map((room) => {
        const name = nameOf(room, labels);
        const unread = room.unread_count;
        return (
          <li key={room.id}>
            <Link
              className={styles.row}
              href={`${detailBase}/${room.id}`}
              data-unread={unread > 0 ? "true" : undefined}
            >
              <span className={styles.head}>
                <span className={styles.kind}>{labels.kinds[room.kind]}</span>
                <span className={styles.name}>{name}</span>
                {unread > 0 ? (
                  <span className={styles.badge}>
                    {labels.unread.replace("{count}", String(unread))}
                  </span>
                ) : null}
                <time className={styles.time} dateTime={room.last_activity_at}>
                  {when.format(new Date(room.last_activity_at))}
                </time>
              </span>
              <span className={styles.excerpt}>
                {room.last_message_excerpt ?? labels.noMessages}
              </span>
              <span className={styles.meta}>
                {room.first_page_path ? (
                  <span className={styles.path}>{room.first_page_path}</span>
                ) : null}
                {room.status === "archived" ? (
                  <span>{labels.archived}</span>
                ) : (
                  <span>{room.ai_active ? labels.nexoOn : labels.nexoOff}</span>
                )}
                <ConsentBadge state={room.consent_state} labels={labels.consent} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
