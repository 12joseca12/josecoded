import { getTranslations } from 'next-intl/server';

import { navLabel } from '@/lib/content/nav';
import { getSectionAvailability } from '@/lib/content/sections';

import { PagedScroll } from './paged-scroll';
import { SectionIndicator } from './section-indicator';

import type { IndicatorSection } from './section-indicator';

/**
 * What the home adds around its scenes: the paging hook (an island with no markup) and the section
 * indicator, one line per scene after the hero. The Lab/Blog line is named after what exists
 * («Lab», «Blog» or «Lab/Blog») and is absent when that scene is.
 */
export async function HomeChrome() {
  const nav = await getTranslations('nav');
  const t = await getTranslations('home');
  const label = navLabel(getSectionAvailability());

  const sections: IndicatorSection[] = [
    { id: 'sobre-mi', name: nav('about') },
    { id: 'servicios', name: nav('services') },
    { id: 'proyectos', name: nav('projects') },
    ...(label ? [{ id: 'lab-blog', name: nav(label) }] : []),
    { id: 'hablamos', name: nav('contact') },
  ];

  return (
    <>
      <PagedScroll />
      <SectionIndicator label={t('sectionIndicator')} sections={sections} />
    </>
  );
}
