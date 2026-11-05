export interface FilterOption {
  value: string;
  label: string;
}

export type FilterField =
  | { kind: "search"; name: string; label: string; value: string; maxLength: number }
  | { kind: "select"; name: string; label: string; value: string; options: FilterOption[] };

export interface FilterTabItem {
  key: string;
  label: string;
  count: number;
  href: string;
  current: boolean;
}
