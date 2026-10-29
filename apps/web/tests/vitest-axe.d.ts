import type { AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe still augments the old `Vi` namespace: declare the matchers on vitest's own types.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmentation only extends
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmentation only extends
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
