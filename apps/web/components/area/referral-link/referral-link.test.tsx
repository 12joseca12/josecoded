import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

const track = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ track }));

import { ReferralLink } from './referral-link';

const labels = { link: 'Your referral link', copy: 'Copy link', copied: 'Link copied.', failed: 'Select it and copy' };
const url = 'https://josecoded.com/?ref=BOB-TEST01';

let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn(async () => undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.clearAllMocks());

describe('ReferralLink', () => {
  it('shows the URL with the code, copies it on «Copy» and tracks referral_copy', async () => {
    const { container } = render(<ReferralLink url={url} labels={labels} />);
    expect(screen.getByText(url)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    });
    expect(writeText).toHaveBeenCalledWith(url);
    expect(track).toHaveBeenCalledWith('referral_copy');
    expect(screen.getByRole('status').textContent).toBe('Link copied.');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('selects the text when the browser refuses the clipboard', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    render(<ReferralLink url={url} labels={labels} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    });
    expect(screen.getByRole('status').textContent).toBe('Select it and copy');
    expect(window.getSelection()?.toString()).toBe(url);
  });
});
