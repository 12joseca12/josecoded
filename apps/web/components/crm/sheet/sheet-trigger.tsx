'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { Sheet } from './sheet';

import type { ButtonSize, ButtonVariant, IconName, SheetVariant } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * A button that opens a `Sheet` with the form it is given. The sheet is controlled here; use `Sheet` itself when
 * several buttons share one (the rows of the inbox).
 */
export function SheetTrigger({
  label,
  ariaLabel,
  icon,
  iconOnly = false,
  variant = 'ghost',
  size = 'md',
  defaultOpen = false,
  title,
  description,
  sheetVariant,
  closeLabel,
  savedMessage,
  children,
}: {
  label: string;
  /** Names the object when the visible label alone is not enough (an icon-only button always needs it). */
  ariaLabel?: string;
  icon?: IconName;
  iconOnly?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  defaultOpen?: boolean;
  title: string;
  description?: string;
  sheetVariant?: SheetVariant;
  closeLabel: string;
  savedMessage: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const button =
    iconOnly && icon ? (
      <Button iconOnly icon={icon} variant={variant} size={size} aria-label={ariaLabel ?? label} aria-haspopup="dialog" onClick={() => setOpen(true)} />
    ) : (
      <Button icon={icon} variant={variant} size={size} aria-label={ariaLabel} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <>
      {button}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        variant={sheetVariant}
        closeLabel={closeLabel}
        savedMessage={savedMessage}
      >
        {children}
      </Sheet>
    </>
  );
}
