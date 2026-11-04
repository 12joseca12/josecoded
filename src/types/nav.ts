export interface NavItem {
  slug: string;
  label: string;
}

export type NavCurrent = "page" | "location";

export interface NavLink {
  key: string;
  href: string;
  label: string;
  active: boolean;
  current: NavCurrent | undefined;
}

export interface ContactChooserLabels {
  title: string;
  close: string;
  whatsapp: string;
  whatsappHint: string;
  chat: string;
  chatHint: string;
  form: string;
  formHint: string;
}

export interface ChatButtonLabels {
  label: string;
}

export interface SearchLabels {
  label: string;
  shortcut: string;
}

export interface HeaderLabels {
  brandLabel: string;
  brandWord: string;
  navLabel: string;
  home: string;
  cta: string;
  loading: string;
  menuOpen: string;
  menuClose: string;
  menuTitle: string;
  here: string;
  contact: ContactChooserLabels;
  chat: ChatButtonLabels;
  search: SearchLabels;
}
