/** The states of `/dev/area/historias/<state>` (block B15): the client home with its cell, and the four stories screens. */
export const AREA_STORY_STATES = ['inicio', 'vacio', 'lista', 'nueva', 'detalle'] as const;
export type AreaStoryState = (typeof AREA_STORY_STATES)[number];

export function findAreaStoryState(state: string): AreaStoryState | null {
  return AREA_STORY_STATES.find((id) => id === state) ?? null;
}

/** The logical path each state stands for, so the area navigation marks its destination as on the real page. */
export const AREA_STORY_PATH: Record<AreaStoryState, string> = {
  inicio: '/area-clientes',
  vacio: '/area-clientes/historias',
  lista: '/area-clientes/historias',
  nueva: '/area-clientes/historias',
  detalle: '/area-clientes/historias',
};
