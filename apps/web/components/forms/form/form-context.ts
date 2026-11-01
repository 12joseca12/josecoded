'use client';

import { createContext, useContext } from 'react';

import type { FormState } from '@josecoded/types';

export interface FormContextValue {
  state: FormState<Record<string, unknown>>;
  pending: boolean;
}

export const FormContext = createContext<FormContextValue | null>(null);

/** State of the enclosing `Form` (null outside one): `Field` reads its error from here. */
export function useFormContext(): FormContextValue | null {
  return useContext(FormContext);
}
