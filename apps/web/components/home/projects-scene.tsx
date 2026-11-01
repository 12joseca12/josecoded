import { getTranslations } from 'next-intl/server';

import { ProjectCard, ProjectsTour } from '@/components/scenes';
import { ArrowLink } from '@/components/ui/arrow-link';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { env } from '@/lib/env';

import { datoText } from './dato';
import { HOME_PROJECTS, projectArt, projectHref } from './projects-data';

/**
 * Scene 4 of the home: the projects in use as a pinned tour (3cat, 3catinfo and this site). The
 * names come from the project data (`projects-data.ts`), the art from the glyph scene of 2.6. The
 * sentence of each project is still `{{DATO}}`: in development it shows as a marker, in production
 * the sentence is left out and the card keeps its name, kind and link.
 */
export async function ProjectsScene() {
  const t = await getTranslations('home.scenes.projects');
  const version = env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION;

  const items = HOME_PROJECTS.map((project) => ({
    ...project,
    name: t(`items.${project.slug}.name`),
    lead: datoText(String(t.raw(`items.${project.slug}.lead`))),
  }));

  return (
    <ProjectsTour
      titleId="proyectos-title"
      names={items.map((item) => item.name)}
      head={
        <>
          <TwoToneHeading id="proyectos-title" lead={t('title.lead')} tail={t('title.accent')} />
          <ArrowLink href="/proyectos" emphasis="strong">
            {t('viewAll')}
          </ArrowLink>
        </>
      }
    >
      {items.map((item) => (
        <ProjectCard
          key={item.slug}
          slug={item.slug}
          name={item.name}
          lead={item.lead}
          kind={item.kind}
          kindLabel={t(`kind.${item.kind}`)}
          art={projectArt(item.art, version)}
          href={projectHref(item.slug)}
          linkLabel={t('viewProject')}
          linkName={t('viewProjectNamed', { name: item.name })}
        />
      ))}
    </ProjectsTour>
  );
}
