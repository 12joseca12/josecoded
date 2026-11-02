/** The previews of `/dev/admin`: which admin screen. They exist for the admin only (`/dev/admin/<screen>/admin`). */
export const ADMIN_PREVIEW_SCREENS = ['equipo', 'precios', 'notificaciones', 'contenido-textos'] as const;
export type AdminPreviewScreen = (typeof ADMIN_PREVIEW_SCREENS)[number];
