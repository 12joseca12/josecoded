import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { focusWhenGone } from './focus-when-gone';

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="opener">Decidir</button><article id="story" tabindex="-1"></article>';
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('focusWhenGone', () => {
  it('moves the focus to the target once the control that opened the dialog has left the page', () => {
    const opener = document.getElementById('opener');
    focusWhenGone(opener, 'story');
    vi.advanceTimersByTime(200);
    expect(document.activeElement).toBe(document.body);
    opener?.remove();
    vi.advanceTimersByTime(200);
    expect(document.activeElement).toBe(document.getElementById('story'));
  });

  it('does nothing while the control is still there, and stops waiting after a few seconds', () => {
    const opener = document.getElementById('opener');
    focusWhenGone(opener, 'story');
    vi.advanceTimersByTime(10_000);
    expect(document.activeElement).toBe(document.body);
  });

  it('can be cancelled', () => {
    const opener = document.getElementById('opener');
    const cancel = focusWhenGone(opener, 'story');
    cancel();
    opener?.remove();
    vi.advanceTimersByTime(500);
    expect(document.activeElement).toBe(document.body);
  });
});
