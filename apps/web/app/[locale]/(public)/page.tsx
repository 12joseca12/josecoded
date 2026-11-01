import { HeroSplit } from '@/components/hero/hero-split';
import { IntroFall } from '@/components/hero/intro-fall';
import { AboutScene } from '@/components/home/about-scene';
import { LabBlogScene } from '@/components/home/lab-blog-scene';
import { ProjectsScene } from '@/components/home/projects-scene';
import { ServicesScene } from '@/components/home/services-scene';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

// The home: the hero (task 2.8) and the scenes of home-v7 (2.10 onwards), one screen each.
export default async function HomePage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);

  return (
    <>
      <HeroSplit />
      {/* waits for the live scene on desktop (it asks the hero gate), falls alone elsewhere */}
      <IntroFall awaitScene="auto" />
      <AboutScene />
      <ServicesScene />
      <ProjectsScene />
      <LabBlogScene />
    </>
  );
}
