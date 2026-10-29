/** Same band as the prototype (`base.js`): the scene crossing the middle of the viewport is "here". */
const ROOT_MARGIN = '-45% 0px -50% 0px';

/**
 * Tells which of the `ids` is in view. Calls `onChange(id)` each time a section enters the middle
 * band and returns the function that stops observing. Missing ids are skipped (a scene that does not
 * exist, as Lab or Blog without content, simply never reports). Shared with the section indicator
 * of task 2.16.
 */
export function observeActiveSection(
  ids: readonly string[],
  onChange: (id: string) => void,
  rootMargin: string = ROOT_MARGIN,
): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) onChange(entry.target.id);
    },
    { rootMargin },
  );
  for (const id of new Set(ids)) {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  }
  return () => observer.disconnect();
}
