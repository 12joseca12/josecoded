"use client";

import { useRouter } from "next/navigation";

import { AiSwitch } from "@/components/chat/AiSwitch/AiSwitch";
import { ConsentBadge } from "@/components/chat/ConsentBadge/ConsentBadge";
import { MemberList } from "@/components/chat/MemberList/MemberList";
import {
  addRoomMemberAction,
  archiveRoomAction,
  removeRoomMemberAction,
  setConversationAiAction,
} from "@/lib/chat/room-actions";
import type { ChatPanelLabels } from "@/types/admin-chat";
import type { ConsentState, MemberCandidate, RoomMember } from "@/types/room";

import { ConfirmAction } from "../ConfirmAction/ConfirmAction";
import styles from "./ChatRoomPanel.module.css";

interface ChatRoomPanelProps {
  conversationId: string;
  kind: "visitor" | "closer" | "client" | "freelance";
  archived: boolean;
  aiEnabled: boolean;
  aiOffReason: string | null;
  consentState: ConsentState;
  members: RoomMember[];
  candidates: MemberCandidate[];
  labels: ChatPanelLabels;
}

export function ChatRoomPanel({
  conversationId,
  kind,
  archived,
  aiEnabled,
  aiOffReason,
  consentState,
  members,
  candidates,
  labels,
}: ChatRoomPanelProps) {
  const router = useRouter();
  const refresh = () => {
    router.refresh();
  };
  const editable = !archived && kind !== "visitor";

  return (
    <div className={styles.panel}>
      <div className={styles.block}>
        <AiSwitch
          enabled={aiEnabled}
          offReason={aiOffReason}
          disabled={archived}
          labels={labels.ai}
          onChange={(next) => setConversationAiAction(conversationId, next)}
          onChanged={refresh}
        />
        <ConsentBadge state={consentState} labels={labels.consent} />
      </div>
      <MemberList
        members={members}
        labels={labels.members}
        editor={
          editable
            ? {
                candidates,
                onAdd: (userId, role) => addRoomMemberAction(conversationId, userId, role),
                onRemove: (userId) => removeRoomMemberAction(conversationId, userId),
                onChanged: refresh,
              }
            : undefined
        }
      />
      {archived ? null : (
        <ConfirmAction
          triggerText={labels.archive.trigger}
          triggerAria={labels.archive.trigger}
          title={labels.archive.title}
          text={labels.archive.text}
          submitLabel={labels.archive.submit}
          savingLabel={labels.archive.saving}
          closeLabel={labels.archive.close}
          doneMessage={labels.archive.done}
          errors={labels.archive.errors}
          run={async () => {
            const result = await archiveRoomAction(conversationId);
            if (result.status === "done") refresh();
            return result;
          }}
        />
      )}
    </div>
  );
}
