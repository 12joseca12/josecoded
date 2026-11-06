import type { RoomMember, RoomMessage, RoomSummary } from "./room";

export type FreelanceChatResult =
  | { status: "error" }
  | {
      status: "ok";
      summary: RoomSummary;
      messages: RoomMessage[];
      members: RoomMember[];
    };
