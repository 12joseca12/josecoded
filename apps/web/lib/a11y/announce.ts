// One polite live region for the whole page (working-agreements §16.2). Components that need to
// say something that is not already in the DOM (a page that changed, an item added) call
// `announce`; nobody creates their own region.
const REGION_ID = 'a11y-announcer';
/** The region is emptied first so that repeating the same message is announced again. */
const ANNOUNCE_DELAY_MS = 60;

let timer: ReturnType<typeof setTimeout> | undefined;

function region(): HTMLElement {
  const existing = document.getElementById(REGION_ID);
  if (existing) return existing;
  const el = document.createElement('div');
  el.id = REGION_ID;
  el.className = 'sr-only';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  document.body.append(el);
  return el;
}

/** Announces `message` politely through the single live region. */
export function announce(message: string): void {
  const el = region();
  el.textContent = '';
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.textContent = message;
  }, ANNOUNCE_DELAY_MS);
}

/** Removes the region (tests; the app never needs it). */
export function resetAnnouncer(): void {
  clearTimeout(timer);
  document.getElementById(REGION_ID)?.remove();
}
