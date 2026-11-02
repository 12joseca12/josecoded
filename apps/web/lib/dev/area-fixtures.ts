import { CLIENT_STORIES } from '@/lib/dev/crm-fixtures';

import type { AreaClient, AreaComment, AreaStory, AreaTask } from '@/lib/area/queries';

// Fixtures of the client area previews (block B15, names of the seed): Ana, the bakery «La Espiga». The stories are
// the ones the CRM preview shows for her, so both sides of the same client agree; the accepted one is turned into a
// task with an indicative amount so the detail shows the whole verdict.

const DAY = 86_400_000;
const inDays = (days: number): string => new Date(Date.now() + days * DAY).toISOString();

export const PREVIEW_USER_ID = '00000000-0000-4000-8000-0000000000a1';

export const PREVIEW_AREA_CLIENT: AreaClient = {
  id: '60000000-0000-4000-8000-000000000001',
  pack_code: 'P2',
  pack_option: null,
  project_phase: 'build',
  starts_at: inDays(-38),
  delivered_at: null,
  created_at: inDays(-40),
};

/** Ana's four stories, one in each status; the third is the accepted one that became a task. */
export function previewStories(): AreaStory[] {
  return CLIENT_STORIES.map((story) =>
    story.status === 'converted'
      ? { ...story, estimate_hours: 2, estimate_amount: 80, estimate_note: 'Va junto con la carta de productos.' }
      : story,
  );
}

/** The accepted story of the detail preview, or the one named by `?id=`. */
export function previewStory(id?: string): AreaStory {
  const stories = previewStories();
  return stories.find((story) => story.id === id) ?? stories.find((story) => story.status === 'converted') ?? stories[0]!;
}

const task = (n: number, title: string, status: AreaTask['status']): AreaTask => ({
  id: `71000000-0000-4000-8000-00000000000${n}`,
  title,
  description: null,
  status,
  sort: n,
  due_at: null,
});

export const PREVIEW_AREA_TASKS: AreaTask[] = [
  task(1, 'Carta de productos con fotos', 'done'),
  task(2, 'Pagos con Bizum en la recogida', 'in_progress'),
  task(3, 'Ocultar agotados en la carta', 'pending'),
];

export const PREVIEW_AREA_NEWS: AreaComment[] = [
  {
    id: '73000000-0000-4000-8000-000000000001',
    task_id: PREVIEW_AREA_TASKS[1]!.id,
    author_user_id: '00000000-0000-4000-8000-000000000001',
    body: 'Ya tienes el Bizum en la versión de pruebas; dime si el texto del botón te encaja.',
    created_at: inDays(-2),
  },
];
