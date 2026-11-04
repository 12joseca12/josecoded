export interface NavItem {
  slug: string;
  label: string;
}

export interface ContactChooserLabels {
  title: string;
  close: string;
  whatsapp: string;
  whatsappHint: string;
  chat: string;
  chatHint: string;
}

export interface ChatButtonLabels {
  label: string;
  online: string;
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
