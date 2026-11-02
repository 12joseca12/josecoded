'use client';

import { createContext, useContext } from 'react';

interface SheetContextValue {
  /** The action behind the form answered `ok`: close the sheet and announce `savedMessage`. */
  saved: () => void;
  close: () => void;
}

export const SheetContext = createContext<SheetContextValue | null>(null);

export function useSheet(): SheetContextValue | null {
  return useContext(SheetContext);
}
