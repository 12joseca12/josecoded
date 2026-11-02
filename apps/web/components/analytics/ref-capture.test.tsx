import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RefCapture } from './ref-capture';

afterEach(() => {
  document.cookie = 'ref=; Max-Age=0; Path=/';
  window.history.replaceState(null, '', '/');
});

describe('RefCapture', () => {
  it('stores a valid code from the URL', () => {
    window.history.replaceState(null, '', '/?ref=ana-ab12cd');
    render(<RefCapture />);
    expect(document.cookie).toContain('ref=ANA-AB12CD');
  });

  it('ignores an invalid code and leaves an earlier one alone', () => {
    document.cookie = 'ref=OLD-AB12CD; Path=/';
    window.history.replaceState(null, '', '/?ref=nonsense');
    render(<RefCapture />);
    expect(document.cookie).toContain('ref=OLD-AB12CD');
  });
});
