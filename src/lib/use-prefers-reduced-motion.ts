"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const media = matchMedia(query);
  media.addEventListener("change", notify);
  return () => {
    media.removeEventListener("change", notify);
  };
}

const read = () => matchMedia(query).matches;
const readOnServer = () => false;

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, readOnServer);
}
