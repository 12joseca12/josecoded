import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';


// vitest-axe: `expect(await axe(container)).toHaveNoViolations()` (working-agreements §16.3)
expect.extend(axeMatchers);

// Motion code reads durations and distances with readToken(): give the document the real tokens
// (a few suites run in the node environment, where there is no document).
if (typeof document !== 'undefined') {
  const tokens = document.createElement('style');
  tokens.textContent = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles/tokens.css'), 'utf8');
  document.head.append(tokens);
}

// Testing Library only cleans up on its own when vitest globals are on; they are not
afterEach(cleanup);
