import type { Href } from './i18n.ts';

/** State returned by a Server Action driven by `useActionState` (working-agreements §17.3). */
export type FormState<T> = {
  status: 'idle' | 'ok' | 'error';
  fieldErrors?: Partial<Record<keyof T, string>>;
  formError?: string;
  /**
   * What the visitor typed, handed back on an error so the form does not empty itself (WCAG 3.3.7).
   * Only non-secret fields: never the Turnstile token, a password or a one-time code.
   */
  values?: Partial<Record<keyof T, string>>;
};

// --- Variant contract of the `components/ui` primitives (working-agreements §15) -----------------
// Each union is spilled to a `data-variant` / `data-size` / `data-tone` attribute and selected in the
// component's CSS Module by attribute. No CVA, no clsx.

export type ButtonVariant = 'solid' | 'ghost' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
/** `sm` is the tag of a data card (a contact's labels); `md` the pill of a marquee. */
export type ChipSize = 'md' | 'sm';
export type IconTileSize = 'sm' | 'md';
export type IconTileTone = 'soft' | 'solid';
/** Corner radius family of a glass surface: bento cell or project card. */
export type SurfaceRadius = 'cell' | 'tcard';
/** `card` is the resting glass sheet; `overlay` floats above everything (open cell, menu, palette). */
export type SurfaceLayer = 'card' | 'overlay';
export type ArrowLinkEmphasis = 'regular' | 'strong';
/** `inherit` takes the size of its context (the public site); `label` and `sm` are the sizes of a staff screen. */
export type ArrowLinkSize = 'inherit' | 'label' | 'sm';
export type TwoToneHeadingLevel = 'h1' | 'h2';
/** `crm` is the title of a staff screen (`--font-crm-title-*`). */
export type TwoToneHeadingSize = 'headline' | 'display-closing' | 'crm';
export type LangSwitchVariant = 'inline' | 'segmented';

// CRM contacts (task 6.2).
/** `side` rises from the right (bottom sheet on a phone); `dialog` is the small centred one for a decision. */
export type SheetVariant = 'side' | 'dialog';
/** `unassigned` is a contact nobody owns yet; `off` belongs to a deactivated closer. */
export type OwnerBadgeState = 'assigned' | 'unassigned' | 'off';
/** `attention` waits for a decision, `live` is alive or done, `overdue` is the urgency, `active` the current one. */
export type StatusBadgeTone = 'neutral' | 'active' | 'live' | 'attention' | 'overdue' | 'muted';

// Staff screens (`components/staff`).
export type SummaryCardTone = 'default' | 'hero';
/** Columns of the twelve of K1 a summary cell spans from 60rem. */
export type SummaryCardCols = 4 | 5 | 7 | 12;
export type SummaryCardRows = 1 | 2;
export type FigureSize = 'lg' | 'sm';
export type FigureTone = 'default' | 'overdue';
export type StaffLinksSize = 'rail' | 'sheet';

/**
 * Lucide icons the interface may name (the registry in `components/ui/icon` maps each to its
 * component by named import, so only these end up in the bundle). Add a name here and there.
 */
export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bell'
  | 'book-open'
  | 'briefcase'
  | 'briefcase-business'
  | 'building-2'
  | 'calendar'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'circle-alert'
  | 'circle-check'
  | 'circle-dashed'
  | 'circle-x'
  | 'clock'
  | 'copy'
  | 'download'
  | 'ellipsis'
  | 'euro'
  | 'file-text'
  | 'file-up'
  | 'flask-conical'
  | 'folder-kanban'
  | 'git-merge'
  | 'globe'
  | 'handshake'
  | 'house'
  | 'inbox'
  | 'info'
  | 'key-round'
  | 'layers'
  | 'layout-grid'
  | 'link'
  | 'list-checks'
  | 'log-in'
  | 'log-out'
  | 'mail'
  | 'maximize'
  | 'menu'
  | 'message-circle'
  | 'message-square'
  | 'package'
  | 'package-check'
  | 'pen-line'
  | 'pencil'
  | 'phone'
  | 'plus'
  | 'receipt'
  | 'route'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield-check'
  | 'smartphone'
  | 'sparkles'
  | 'store'
  | 'trash-2'
  | 'triangle-alert'
  | 'upload'
  | 'user'
  | 'user-check'
  | 'user-cog'
  | 'user-round'
  | 'users'
  | 'wallet'
  | 'x';

// --- Polymorphism by `href` (working-agreements §15.3) -------------------------------------------
// With `href` the component renders a link and cannot take `onClick`, `type` or `disabled`; without it
// it renders `<button>`. A "disabled link" is `aria-disabled` without `href`, decided case by case.

/** Props only a link takes. */
export type LinkOnlyProps = {
  href: Href;
  type?: never;
  onClick?: never;
  disabled?: never;
};

/** Props only a button takes. `E` is the click event type (`React.MouseEvent<HTMLButtonElement>`). */
export type ButtonOnlyProps<E = unknown> = {
  href?: never;
  type?: 'button' | 'submit';
  onClick?: (event: E) => void;
  disabled?: boolean;
};

/** Discriminated union by `href`: `onClick` together with `href` does not compile. */
export type LinkOrButtonProps<E = unknown> = LinkOnlyProps | ButtonOnlyProps<E>;
