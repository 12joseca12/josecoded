import type { StaffRole } from '@/lib/auth/staff';

/**
 * The previews of `/dev/crm`: which screen, for which role. `admin` (C1) and `conflictos` (the admin's queue of K4)
 * exist for the admin only. The three `importar-*` are the steps of K4: the file, the columns with the preview, and the result.
 */
export const PREVIEW_SCREENS = [
  'resumen',
  'contactos',
  'contacto-lead',
  'contacto-cliente',
  'importar-archivo',
  'importar-columnas',
  'importar-resultado',
  'conflictos',
  'comisiones',
  'admin',
] as const;
export type PreviewScreen = (typeof PREVIEW_SCREENS)[number];

export const PREVIEW_ROLES = ['closer', 'admin'] as const satisfies readonly StaffRole[];

const ADMIN_ONLY: readonly PreviewScreen[] = ['admin', 'conflictos'];

/** Every `[screen]/[role]` pair that has a preview, in the order of the index. */
export const PREVIEWS: readonly { screen: PreviewScreen; role: StaffRole }[] =
  PREVIEW_SCREENS.flatMap((screen) =>
    PREVIEW_ROLES.filter((role) => !ADMIN_ONLY.includes(screen) || role === 'admin').map(
      (role) => ({ screen, role }),
    ),
  );

export function findPreview(
  screen: string,
  role: string,
): { screen: PreviewScreen; role: StaffRole } | null {
  return PREVIEWS.find((preview) => preview.screen === screen && preview.role === role) ?? null;
}
