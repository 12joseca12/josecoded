"use client";

import { type ComponentProps, useMemo } from "react";

import { createHttpRoomTransport } from "@/lib/chat/room-transport";

import { RoomView } from "../RoomView/RoomView";

type RoomLiveProps = Omit<ComponentProps<typeof RoomView>, "transport"> & {
  conversationId: string;
};

export function RoomLive({ conversationId, ...rest }: RoomLiveProps) {
  const transport = useMemo(() => createHttpRoomTransport(conversationId), [conversationId]);
  return <RoomView {...rest} transport={transport} />;
}
