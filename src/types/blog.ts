export interface CategoryTabItem {
  id: string;
  label: string;
  href: string;
  current: boolean;
}

export interface PostTeaserData {
  href: string;
  title: string;
  description: string;
  categoryLabel: string;
  kind: "article" | "resource";
  kindLabel: string | null;
  updated: string;
  updatedLabel: string;
  readingLabel: string;
}

export interface PaginationLink {
  href: string;
  label: string;
}

export interface PaginationData {
  label: string;
  status: string;
  previous: PaginationLink | null;
  next: PaginationLink | null;
  previousLabel: string;
  nextLabel: string;
}

export interface AuthorBoxData {
  label: string;
  name: string;
  credential: string;
  published: string;
  publishedPrefix: string;
  publishedLabel: string;
  updated: string;
  updatedPrefix: string;
  updatedLabel: string;
  readingLabel: string;
}

export interface RelatedServiceData {
  title: string;
  text: string;
  cta: string;
  href: string;
}
