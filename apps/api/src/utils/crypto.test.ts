import { describe, expect, it } from 'vitest';

import { deriveKey, hashIp, normalizeIp } from './crypto';

describe('normalizeIp', () => {
  it.each([
    ['1.2.3.4', '1.2.3.4'],
    ['unknown', 'unknown'],
    ['2001:db8:1:2::1', '2001:db8:1:2::/64'],
    ['2001:0db8:0001:0002:aaaa:bbbb:cccc:dddd', '2001:db8:1:2::/64'],
    ['2001:DB8:1:2:ffff:ffff:ffff:ffff', '2001:db8:1:2::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['::ffff:1.2.3.4', '1.2.3.4'],
    ['not:an:ip', 'not:an:ip'],
  ])('%s -> %s', (ip, expected) => expect(normalizeIp(ip)).toBe(expected));
});

describe('hashIp', () => {
  it('is the same for every address of a /64 and different across /64s and across IPv4s', async () => {
    const a = await hashIp('2001:db8:1:2::1', 'pepper');
    expect(await hashIp('2001:db8:1:2:9999:8888:7777:6666', 'pepper')).toBe(a);
    expect(await hashIp('2001:db8:1:3::1', 'pepper')).not.toBe(a);
    expect(await hashIp('1.2.3.4', 'pepper')).not.toBe(await hashIp('1.2.3.5', 'pepper'));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it('peppers with a derived key, not with the secret itself', async () => {
    expect(await hashIp('1.2.3.4', 'pepper')).not.toBe(await hashIp('1.2.3.4', 'other'));
    expect(await hashIp('1.2.3.4')).not.toBe(await hashIp('1.2.3.4', 'pepper'));
  });
});

describe('deriveKey', () => {
  it('gives a different, stable subkey per purpose and per master key', async () => {
    const proposal = await deriveKey('master', 'proposal-token');
    expect(await deriveKey('master', 'proposal-token')).toBe(proposal);
    expect(await deriveKey('master', 'chat-cookie')).not.toBe(proposal);
    expect(await deriveKey('master', 'ip-pepper')).not.toBe(proposal);
    expect(await deriveKey('other', 'proposal-token')).not.toBe(proposal);
    expect(proposal).not.toContain('master');
  });
});
