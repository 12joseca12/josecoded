import type { MemberListLabels, RoomLabels, RoomMember, RoomMessage, RoomSummary } from "./room";
import type { ConsentBadgeLabels } from "./room";

export type CrmChatResult =
  | { status: "error" }
  | {
      status: "ok";
      ownRoomId: string;
      rooms: RoomSummary[];
      selected: {
        summary: RoomSummary;
        messages: RoomMessage[];
        members: RoomMember[];
      };
    };

export interface RoomPickerLabels {
  label: string;
  jose: string;
  clients: string;
  emptyClients: string;
  joseRoom: string;
  clientRoom: string;
  current: string;
  unread: string;
  noMessages: string;
}

export interface CrmChatLabels {
  room: RoomLabels;
  members: MemberListLabels;
  consent: ConsentBadgeLabels;
  picker: RoomPickerLabels;
}
