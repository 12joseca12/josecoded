/**
 * One delegated `pointermove` listener per bento: it writes the pointer position, relative to the
 * cell under it, in `--mx` / `--my` on that cell. The CSS of the cell turns them into a soft light
 * that says which cell is under the hand. Delegation (not one listener per cell) keeps the cost
 * constant however many cells a scene has. Returns the function that removes the listener.
 */
export function attachCursorLight(bento: HTMLElement): () => void {
  function onMove(event: PointerEvent) {
    if (!(event.target instanceof Element)) return;
    const cell = event.target.closest<HTMLElement>('[data-cell]');
    if (!cell || !bento.contains(cell)) return;
    const rect = cell.getBoundingClientRect();
    cell.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    cell.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
  bento.addEventListener('pointermove', onMove, { passive: true });
  return () => bento.removeEventListener('pointermove', onMove);
}
