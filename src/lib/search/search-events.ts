import { createSignal } from "@/lib/events/signal";

const searchSignal = createSignal();

export const openSearch = searchSignal.emit;
export const onOpenSearch = searchSignal.subscribe;

export function isSearchShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (
    event.key.toLowerCase() === "k" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}
