import { describe, expectTypeOf, it } from 'vitest';

import type { useTranslations } from 'next-intl';

// Keys are typed from messages/es.ts through the AppConfig in global.d.ts. (The root-level
// `t('site.name')` of getTranslations() is exercised by app/[locale]/page.tsx itself, which fails
// to compile on an unknown key.)
type SiteT = ReturnType<typeof useTranslations<'site'>>;
type NotFoundT = ReturnType<typeof useTranslations<'notFound'>>;

describe('typed message keys', () => {
  it('accepts an existing key and rejects an unknown one', () => {
    const site = (() => '') as unknown as SiteT;
    site('name');
    // @ts-expect-error unknown key must not compile
    site('nope');

    const notFound = (() => '') as unknown as NotFoundT;
    notFound('title');
    // @ts-expect-error a key of another namespace must not compile
    notFound('name');
  });

  it('rejects an unknown namespace', () => {
    // @ts-expect-error `nav` does not exist yet (it arrives with task 2.1)
    expectTypeOf<ReturnType<typeof useTranslations<'nav'>>>().toBeFunction();
  });
});
