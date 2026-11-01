'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useShell } from '@/components/layout/shell-provider';

import type { PaletteCopy, PaletteItem } from './command-palette-dialog';

// a separate chunk, fetched the first time the palette is asked for
const Dialog = dynamic(() => import('./command-palette-dialog'), { ssr: false });

/**
 * The palette's door: it tells the shell a palette exists (that turns on the search button and the
 * ⌘K shortcut) and mounts the dialog, a lazy chunk, the first time the palette opens. Renders no
 * markup of its own until then.
 */
export function CommandPaletteIsland({ commands, copy }: { commands: readonly PaletteItem[]; copy: PaletteCopy }) {
  const { palette, registerPalette } = useShell();
  const [wanted, setWanted] = useState(false);

  useEffect(() => registerPalette(), [registerPalette]);
  // once asked for, the dialog stays mounted (state adjusted while rendering, as React recommends)
  if (palette && !wanted) setWanted(true);

  return wanted ? <Dialog commands={commands} copy={copy} /> : null;
}
