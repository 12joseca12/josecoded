import type { StaffRole } from '@/lib/auth/staff';

/** The previews of `/dev/crm`: which screen, for which role. `admin` (C1) exists for the admin only. */
export const PREVIEW_SCREENS = ['resumen', 'contactos', 'contacto-lead', 'contacto-cliente', 'admin'] as const;
export type PreviewScreen = (typeof PREVIEW_SCREENS)[number];

export const PREVIEW_ROLES = ['closer', 'admin'] as const satisfies readonly StaffRole[];

/** Every `[screen]/[role]` pair that has a preview, in the order of the index. */
export const PREVIEWS: readonly { screen: PreviewScreen; role: StaffRole }[] = PREVIEW_SCREENS.flatMap((screen) =>
  PREVIEW_ROLES.filter((role) => screen !== 'admin' || role === 'admin').map((role) => ({ screen, role })),
);

export function findPreview(screen: string, role: string): { screen: PreviewScreen; role: StaffRole } | null {
  return PREVIEWS.find((preview) => preview.screen === screen && preview.role === role) ?? null;
}
