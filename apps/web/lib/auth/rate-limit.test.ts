import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: mocks.context }));

import { allowAttempt, networkKey } from './rate-limit';

describe('networkKey', () => {
  it('keeps an IPv4 whole and reduces an IPv6 to its /64', () => {
    expect(networkKey('203.0.113.9')).toBe('203.0.113.9');
    expect(networkKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:0db8:0001:0002::/64');
    expect(networkKey('2001:db8:1:2:1::1')).toBe(networkKey('2001:DB8:1:2:ffff::2'));
    expect(networkKey('2001:db8::1')).toBe('2001:0db8:0000:0000::/64');
    expect(networkKey('::1')).toBe('0000:0000:0000:0000::/64');
    expect(networkKey(null)).toBe('unknown');
  });
});

describe('allowAttempt', () => {
  const limiter = (success: boolean) => ({ limit: vi.fn(async () => ({ success })) });
  beforeEach(() => vi.clearAllMocks());

  it('allows outside a Worker, where there is nothing to count with', async () => {
    mocks.context.mockImplementation(() => {
      throw new Error('no context');
    });
    expect(await allowAttempt('otp', { ip: '1.1.1.1', subject: 'a@b.co' })).toBe(true);
  });

  it('fails closed when the worker lacks the bindings', async () => {
    mocks.context.mockReturnValue({ env: {} });
    expect(await allowAttempt('otp', { ip: '1.1.1.1', subject: 'a@b.co' })).toBe(false);
  });

  it('counts the network and the account separately and needs both to pass', async () => {
    const ip = limiter(true);
    const subject = limiter(true);
    mocks.context.mockReturnValue({ env: { AUTH_IP_RATE_LIMITER: ip, AUTH_SUBJECT_RATE_LIMITER: subject } });
    expect(await allowAttempt('totp', { ip: '2001:db8:1:2::9', subject: 'U1' })).toBe(true);
    expect(ip.limit).toHaveBeenCalledWith({ key: 'totp:ip:2001:0db8:0001:0002::/64' });
    expect(subject.limit).toHaveBeenCalledWith({ key: 'totp:subject:u1' });

    const blocked = limiter(false);
    mocks.context.mockReturnValue({ env: { AUTH_IP_RATE_LIMITER: ip, AUTH_SUBJECT_RATE_LIMITER: blocked } });
    expect(await allowAttempt('otp', { ip: '1.1.1.1', subject: 'a@b.co' })).toBe(false);
  });
});
