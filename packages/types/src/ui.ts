import type { Href } from './i18n.ts';

/** State returned by a Server Action driven by `useActionState` (working-agreements §17.3). */
export type FormState<T> = {
  status: 'idle' | 'ok' | 'error';
  fieldErrors?: Partial<Record<keyof T, string>>;
  formError?: string;
};

// --- Variant contract of the `components/ui` primitives (working-agreements §15) -----------------
// Each union is spilled to a `data-variant` / `data-size` / `data-tone` attribute and selected in the
// component's CSS Module by attribute. No CVA, no clsx.

export type ButtonVariant = 'solid' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconTileSize = 'sm' | 'md';
export type IconTileTone = 'soft' | 'solid';
/** Corner radius family of a glass surface: bento cell or project card. */
export type SurfaceRadius = 'cell' | 'tcard';
/** `card` is the resting glass sheet; `overlay` floats above everything (open cell, menu, palette). */
export type SurfaceLayer = 'card' | 'overlay';
export type ArrowLinkEmphasis = 'regular' | 'strong';
export type TwoToneHeadingLevel = 'h1' | 'h2';
export type TwoToneHeadingSize = 'headline' | 'display-closing';
export type LangSwitchVariant = 'inline' | 'segmented';

/**
 * Lucide icons the interface may name (the registry in `components/ui/icon` maps each to its
 * component by named import, so only these end up in the bundle). Add a name here and there.
 */
export type IconName =
  | 'arrow-right'
  | 'briefcase'
  | 'clock'
  | 'download'
  | 'log-in'
  | 'log-out'
  | 'maximize'
  | 'menu'
  | 'message-circle'
  | 'message-square'
  | 'package-check'
  | 'search'
  | 'store'
  | 'user'
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
