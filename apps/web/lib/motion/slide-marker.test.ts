import { expect, it } from 'vitest';

import { markerFor } from './slide-marker';

it('computes marker offset and size from the target rect relative to the list', () => {
  expect(markerFor({ left: 100, top: 40, width: 400, height: 200 }, { left: 220, top: 40, width: 80, height: 200 }, 'x', 6)).toEqual({ offset: 120, size: 80, gap: 6 });
});

it('measures along y for a vertical list', () => {
  expect(markerFor({ left: 0, top: 100, width: 300, height: 300 }, { left: 0, top: 160, width: 300, height: 44 }, 'y', 0)).toEqual({ offset: 60, size: 44, gap: 0 });
});
