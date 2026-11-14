export const contactChooserId = "contact-chooser";

export interface ChooserSnapshot {
  open: boolean;
  opener: HTMLElement | null;
}

type OpenListener = (opener: HTMLElement) => void;

const openListeners = new Set<OpenListener>();
const stateListeners = new Set<() => void>();
let snapshot: ChooserSnapshot = { open: false, opener: null };

export function openContactChooser(opener: HTMLElement): boolean {
  if (openListeners.size === 0) return false;
  for (const listener of [...openListeners]) listener(opener);
  return true;
}

export function onOpenContactChooser(listener: OpenListener): () => void {
  openListeners.add(listener);
  return () => {
    openListeners.delete(listener);
  };
}

export function publishChooserState(open: boolean, opener: HTMLElement | null): void {
  if (snapshot.open === open && snapshot.opener === opener) return;
  snapshot = { open, opener };
  for (const listener of [...stateListeners]) listener();
}

export function subscribeChooserState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

export function getChooserSnapshot(): ChooserSnapshot {
  return snapshot;
}

const closedSnapshot: ChooserSnapshot = { open: false, opener: null };

export function getServerChooserSnapshot(): ChooserSnapshot {
  return closedSnapshot;
}
