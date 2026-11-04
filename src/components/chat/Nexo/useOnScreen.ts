import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => {
    document.removeEventListener("visibilitychange", notify);
  };
}

export function useTabVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

export function useOnScreen(node: Element | null) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const last = entries.at(-1);
      if (last) setOnScreen(last.isIntersecting);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node]);
  return onScreen;
}
