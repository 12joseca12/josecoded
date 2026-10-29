import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

// vitest-axe: `expect(await axe(container)).toHaveNoViolations()` (working-agreements §16.3)
expect.extend(axeMatchers);

// Testing Library only cleans up on its own when vitest globals are on; they are not
afterEach(cleanup);
