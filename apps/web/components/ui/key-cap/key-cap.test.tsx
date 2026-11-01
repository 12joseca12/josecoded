import { act, render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { KeyCap } from '.';

it('is a kbd that sinks while its real key is held and rises when it is released', () => {
  const { container } = render(
    <>
      <KeyCap keyId="mod" />
      <KeyCap keyId="k" />
    </>,
  );
  const [mod, k] = [...container.querySelectorAll('kbd')];
  expect(k?.textContent).toBe('K');
  expect(mod?.hasAttribute('data-down')).toBe(false);
  act(() => {
    dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
  });
  expect(k?.hasAttribute('data-down')).toBe(true);
  expect(mod?.hasAttribute('data-down')).toBe(false);
  act(() => {
    dispatchEvent(new KeyboardEvent('keyup', { key: 'k' }));
  });
  expect(k?.hasAttribute('data-down')).toBe(false);
});
