/**
 * Which optional sections of the public site exist. Lab needs two real demos and Blog three real
 * guides, otherwise the section vanishes everywhere at once: header, menu, ⌘K, footer and home
 * (pantallas v2.0, P9 and P22). Task 4.5 replaces this constant with the count of published
 * content (and its `navLabel()`); every consumer already goes through this one function.
 */
export interface SectionAvailability {
  lab: boolean;
  blog: boolean;
}

// Placeholder until 4.5: both on, as in the approved prototype (home-v7), so the shell is reviewable.
const AVAILABLE: SectionAvailability = { lab: true, blog: true };

export function getSectionAvailability(): SectionAvailability {
  return AVAILABLE;
}
