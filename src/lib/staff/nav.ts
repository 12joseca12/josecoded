import type { MessageKey } from "@/i18n/keys.generated";
import type { StaffZone } from "@/types/staff";

export interface StaffNavEntry {
  key: string;
  path: string;
  ready: boolean;
  label: MessageKey;
}

export const staffNav: Record<StaffZone, readonly StaffNavEntry[]> = {
  admin: [
    { key: "overview", path: "", ready: true, label: "admin.nav.overview" },
    { key: "leads", path: "/interesados", ready: true, label: "admin.nav.leads" },
    { key: "projects", path: "/proyectos", ready: true, label: "admin.nav.projects" },
    { key: "users", path: "/usuarios", ready: true, label: "admin.nav.users" },
    { key: "prices", path: "/precios", ready: true, label: "admin.nav.prices" },
    { key: "system", path: "/sistema", ready: true, label: "admin.nav.system" },
    { key: "audit", path: "/auditoria", ready: true, label: "admin.nav.audit" },
    {
      key: "notifications",
      path: "/notificaciones",
      ready: true,
      label: "admin.nav.notifications",
    },
    { key: "receivables", path: "/cobros", ready: true, label: "admin.nav.receivables" },
    { key: "payouts", path: "/liquidaciones", ready: true, label: "admin.nav.payouts" },
  ],
  crm: [
    { key: "overview", path: "", ready: true, label: "crm.nav.overview" },
    { key: "contacts", path: "/contactos", ready: true, label: "crm.nav.contacts" },
    { key: "leads", path: "/interesados", ready: true, label: "crm.nav.leads" },
    { key: "commissions", path: "/comisiones", ready: true, label: "crm.nav.commissions" },
    { key: "chat", path: "/chat", ready: false, label: "crm.nav.chat" },
    { key: "start", path: "/empezar", ready: true, label: "crm.nav.start" },
    { key: "settings", path: "/ajustes", ready: true, label: "crm.nav.settings" },
  ],
  area: [
    { key: "overview", path: "", ready: true, label: "area.nav.overview" },
    { key: "tasks", path: "/tareas", ready: true, label: "area.nav.tasks" },
    { key: "documents", path: "/documentos", ready: true, label: "area.nav.documents" },
    { key: "stories", path: "/historias", ready: true, label: "area.nav.stories" },
    { key: "chat", path: "/chat", ready: true, label: "area.nav.chat" },
  ],
  freelance: [],
};

export const barSlots = 3;

export function isCurrentPath(pathname: string, href: string, root: string): boolean {
  if (href === root) return pathname === root;
  return pathname === href || pathname.startsWith(`${href}/`);
}
