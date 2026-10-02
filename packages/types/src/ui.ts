/** State returned by a Server Action driven by `useActionState` (working-agreements §17). */
export type FormState<T = undefined> =
  | { status: 'idle' }
  | { status: 'success'; data: T }
  | { status: 'error'; message?: string; fieldErrors?: Partial<Record<string, string[]>> };
