import { render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';

import { useStickyOffset } from './sticky-offset';

function Bar({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useStickyOffset(ref, 'bottom', active);
  return <div ref={ref}>bar</div>;
}

const read = () => document.documentElement.style.getPropertyValue('--page-sticky-bottom');

describe('useStickyOffset', () => {
  it('publishes the element height while active and removes it when inactive or unmounted', () => {
    const { rerender, unmount } = render(<Bar active />);
    expect(read()).toMatch(/^\d+(\.\d+)?px$/);
    rerender(<Bar active={false} />);
    expect(read()).toBe('');
    rerender(<Bar active />);
    expect(read()).not.toBe('');
    unmount();
    expect(read()).toBe('');
  });
});
