"use client";

import { useMemo, useState } from "react";

import { AiSwitch } from "@/components/chat/AiSwitch/AiSwitch";
import { ConsentBadge } from "@/components/chat/ConsentBadge/ConsentBadge";
import { MemberList } from "@/components/chat/MemberList/MemberList";
import { RoomView } from "@/components/chat/RoomView/RoomView";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import type {
  AiSwitchLabels,
  ConsentBadgeLabels,
  MemberListLabels,
  RoomActionResult,
  RoomLabels,
  RoomMember,
  RoomMessage,
  RoomTransport,
} from "@/types/room";

import styles from "./page.module.css";

interface DevLabels {
  incoming: string;
  incomingBody: string;
  switchSection: string;
  ownName: string;
  otherName: string;
}

interface RoomDemoProps {
  locale: string;
  room: RoomLabels;
  members: MemberListLabels;
  ai: AiSwitchLabels;
  consent: ConsentBadgeLabels;
  dev: DevLabels;
}

const roomId = "11111111-1111-4111-8111-111111111111";
const ownId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const candidateId = "44444444-4444-4444-8444-444444444444";

function stamp(offsetMinutes: number): string {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

function sample(fields: Partial<RoomMessage> & { body: string }): RoomMessage {
  return {
    id: crypto.randomUUID(),
    conversation_id: roomId,
    author_kind: "human",
    author_id: null,
    kind: "text",
    system_event: null,
    sources: [],
    auto: false,
    created_at: new Date().toISOString(),
    ...fields,
  };
}

function seedMessages(): RoomMessage[] {
  return [
    sample({
      author_id: otherId,
      body: "Hola, ¿puedes mirar el presupuesto?",
      created_at: stamp(30),
    }),
    sample({ author_id: ownId, body: "Claro, ahora lo reviso.", created_at: stamp(25) }),
    sample({
      author_kind: "nexo",
      body: "Puedo ayudar con las tarifas.",
      auto: true,
      sources: ["tarifas"],
      created_at: stamp(20),
    }),
    sample({
      author_kind: "system",
      system_event: "member_added",
      body: "Cleo (prueba)",
      created_at: stamp(15),
    }),
  ];
}

function roster(dev: DevLabels): RoomMember[] {
  const base = { can_write: true, joined_at: stamp(600), left_at: null };
  return [
    { ...base, user_id: ownId, role: "owner", full_name: dev.ownName },
    { ...base, user_id: otherId, role: "closer", full_name: dev.otherName },
  ];
}

export function RoomDemo({ locale, room, members, ai, consent, dev }: RoomDemoProps) {
  const [queue] = useState<RoomMessage[]>([]);
  const [count, setCount] = useState(0);
  const [initial] = useState(seedMessages);

  const transport = useMemo<RoomTransport>(() => {
    const delivered = new Set<string>();
    return {
      poll(since) {
        const fresh = queue.filter(
          (entry) => !delivered.has(entry.id) && (since === null || entry.created_at > since),
        );
        for (const entry of fresh) delivered.add(entry.id);
        return Promise.resolve({ status: "done", messages: fresh });
      },
      send(body) {
        if (body.includes("[forbidden]")) {
          return Promise.resolve({ status: "failed", problem: "forbidden" });
        }
        if (body.includes("[fail]")) {
          return Promise.resolve({ status: "failed", problem: "error" });
        }
        return Promise.resolve({
          status: "done",
          message: sample({ author_id: ownId, body }),
        });
      },
      markRead: () => Promise.resolve(),
    };
  }, [queue]);

  const incoming = () => {
    const next = count + 1;
    setCount(next);
    queue.push(sample({ author_id: otherId, body: dev.incomingBody.replace("{n}", String(next)) }));
  };

  const toggle = (): Promise<RoomActionResult> => Promise.resolve({ status: "done" });
  const fail = (): Promise<RoomActionResult> =>
    Promise.resolve({ status: "failed", code: "forbidden" });
  const people = roster(dev);

  return (
    <AnnouncerProvider>
      <div className={styles.layout}>
        <div className={styles.room}>
          <RoomView
            zone="admin"
            locale={locale}
            currentUserId={ownId}
            initial={initial}
            members={people}
            archived={false}
            canWrite
            labels={room}
            transport={transport}
            pollMs={400}
          />
        </div>
        <div className={styles.side}>
          <Button type="button" variant="light" onClick={incoming}>
            {dev.incoming}
          </Button>
          <section className={styles.section} aria-label={dev.switchSection}>
            <AiSwitch enabled offReason={null} labels={ai} onChange={toggle} />
            <AiSwitch enabled={false} offReason="takeover" labels={ai} onChange={fail} />
            <div className={styles.consents}>
              <ConsentBadge state="granted" labels={consent} />
              <ConsentBadge state="revoked" labels={consent} />
              <ConsentBadge state="pending" labels={consent} />
              <ConsentBadge state="n/a" labels={consent} />
            </div>
          </section>
          <div className={styles.section}>
            <MemberList
              members={people}
              labels={members}
              editor={{
                candidates: [{ userId: candidateId, name: "Dani (prueba)", role: "closer" }],
                onAdd: toggle,
                onRemove: toggle,
                onChanged: () => undefined,
              }}
            />
          </div>
        </div>
      </div>
    </AnnouncerProvider>
  );
}
