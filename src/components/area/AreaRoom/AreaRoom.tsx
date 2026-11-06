"use client";

import { type ReactNode, useMemo } from "react";

import { MemberList } from "@/components/chat/MemberList/MemberList";
import { RoomView } from "@/components/chat/RoomView/RoomView";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { createHttpRoomTransport } from "@/lib/chat/room-transport";
import type { MemberListLabels, RoomLabels, RoomMember, RoomMessage } from "@/types/room";

import styles from "./AreaRoom.module.css";

interface AreaRoomProps {
  conversationId: string;
  locale: string;
  userId: string;
  initial: RoomMessage[];
  members: RoomMember[];
  archived: boolean;
  canWrite: boolean;
  labels: RoomLabels;
  memberLabels: MemberListLabels;
  pollMs: number;
  consent: ReactNode;
}

export function AreaRoom({
  conversationId,
  locale,
  userId,
  initial,
  members,
  archived,
  canWrite,
  labels,
  memberLabels,
  pollMs,
  consent,
}: AreaRoomProps) {
  const transport = useMemo(() => createHttpRoomTransport(conversationId), [conversationId]);
  return (
    <AnnouncerProvider>
      <div className={styles.layout}>
        <div className={styles.chat}>
          <RoomView
            zone="area"
            locale={locale}
            currentUserId={userId}
            initial={initial}
            members={members}
            archived={archived}
            canWrite={canWrite}
            labels={labels}
            transport={transport}
            pollMs={pollMs}
          />
        </div>
        <aside className={styles.side}>
          {consent}
          <MemberList members={members} headingLevel={2} labels={memberLabels} />
        </aside>
      </div>
    </AnnouncerProvider>
  );
}
