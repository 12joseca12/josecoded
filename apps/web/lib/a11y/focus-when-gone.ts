/** How long to wait for the page to re-render before giving up on moving the focus. */
const WAIT_MS = 4000;

/**
 * After an action the page re-renders a moment later with the new state. When the control that opened the dialog is
 * gone by then (its row or card changed), the element `targetId` takes the focus, so a keyboard user does not land on
 * `<body>`; if the control is still there (nothing changed), the browser has already given the focus back and there is
 * nothing to do. Returns `cancel`.
 */
export function focusWhenGone(from: Element | null, targetId: string): () => void {
  const started = Date.now();
  const timer = setInterval(() => {
    if (from?.isConnected && Date.now() - started < WAIT_MS) return;
    clearInterval(timer);
    if (!from?.isConnected) document.getElementById(targetId)?.focus();
  }, 60);
  return () => clearInterval(timer);
}
