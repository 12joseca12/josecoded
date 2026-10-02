/** State returned by a Server Action driven by `useActionState` (working-agreements §17.3). */
export type FormState<T> = {
  status: 'idle' | 'ok' | 'error';
  fieldErrors?: Partial<Record<keyof T, string>>;
  formError?: string;
};
