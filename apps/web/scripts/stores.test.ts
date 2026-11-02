import { describe, expect, it } from 'vitest';

import { buildStores } from './stores';

const found = async () => ({ ok: true, json: async () => ({ resultCount: 1, results: [{ trackViewUrl: 'https://apps.apple.com/es/app/x/id1?uo=4' }] }) });

describe('stores script', () => {
  it('builds links from ids and package names, ignoring pending ones', async () => {
    const index = await buildStores(
      [
        { slug: 'a', proofs: { appStoreId: '1', playPackage: 'com.x.a' } },
        { slug: 'b', proofs: { appStoreId: '{{DATO: id}}', playPackage: '{{DATO: paquete}}' } },
      ],
      {},
      found,
    );
    expect(index).toEqual({
      a: { appStoreUrl: 'https://apps.apple.com/es/app/x/id1', playUrl: 'https://play.google.com/store/apps/details?id=com.x.a' },
    });
  });

  it('drops an App Store id that Apple does not know and never stores ratings', async () => {
    const index = await buildStores(
      [{ slug: 'a', proofs: { appStoreId: '999' } }],
      {},
      async () => ({ ok: true, json: async () => ({ resultCount: 0, results: [], averageUserRating: 4.5 }) }),
    );
    expect(index).toEqual({});
  });
});
