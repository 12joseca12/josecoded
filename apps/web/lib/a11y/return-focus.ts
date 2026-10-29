/**
 * Remembers where focus was (or `trigger`, when the opener is known) and returns `restore`, which
 * gives focus back to it. If the opener has left the document meanwhile, `fallback` gets the focus
 * instead, so the keyboard user never lands on `<body>`.
 */
export function captureFocus(
  trigger: HTMLElement | null = document.activeElement as HTMLElement | null,
  fallback?: HTMLElement | null,
): () => void {
  return () => {
    const target = trigger?.isConnected ? trigger : fallback?.isConnected ? fallback : null;
    target?.focus({ preventScroll: true });
  };
}
