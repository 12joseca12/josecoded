import { HeroSplit } from '@/components/hero/hero-split';
import { IntroFall } from '@/components/hero/intro-fall';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

// The home. Scene 0 (the hero) is task 2.8; the bento scenes follow in 2.10 onwards.
export default async function HomePage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);

  return (
    <>
      <HeroSplit />
      {/* waits for the live scene on desktop (it asks the hero gate), falls alone elsewhere */}
      <IntroFall awaitScene="auto" />
    </>
  );
}
