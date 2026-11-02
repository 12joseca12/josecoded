import { getTranslations } from 'next-intl/server';

import { LeadForm } from '@/components/contact/lead-form';
import { datoText } from '@/components/home/dato';
import { bookingHref, whatsappHref } from '@/components/home/links';
import { projectArt, projectHref } from '@/components/home/projects-data';
import { FitList } from '@/components/partners/fit-list';
import { Bento, BentoCell, CellText, ProjectCard } from '@/components/scenes';
import { JsonLd } from '@/components/seo';
import { Faq, FaqJsonLd } from '@/components/shared/faq';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { ProcessSteps } from '@/components/shared/process-steps';
import { QuickContact } from '@/components/shared/quick-contact';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { partners } from '@/content';
import { faqEntries } from '@/lib/content/faq';
import { tourProjects } from '@/lib/content/projects';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { loadFacts } from '@/lib/seo/facts-server';
import { graphOf, ids } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl, siteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Href } from '@josecoded/types';
import type { Metadata } from 'next';

type Step = (typeof partners.steps)[number];

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners.meta' });
  return pageMetadata({ locale, pathname: '/partners', title: t('title'), description: t('description') });
}

// P21 (pantallas v2.0): for agencies. No price (Q16): the rate is given in a call.
export default async function PartnersPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners' });
  const contact = await getTranslations({ locale, namespace: 'contact' });
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const projectsT = await getTranslations({ locale, namespace: 'home.scenes.projects' });
  const facts = await loadFacts(locale);

  const whatsapp = whatsappHref(String(factsT.raw('whatsappProject')));
  const booking = bookingHref();
  const linkedin = facts.linkedinUrl as Href | undefined;
  const where = facts.city ? t('head.whereCity', { city: facts.city }) : t('head.whereRemote');
  const faq = faqEntries('partners', locale);

  const steps = partners.steps.map((id) => ({
    id,
    title: t(`process.steps.${id as Step}.title` as 'process.steps.brief.title'),
    text: datoText(String(t.raw(`process.steps.${id as Step}.text` as 'process.steps.brief.text'))),
  }));

  const formLabels = {
    form: contact('partnerForm.label'),
    name: contact('form.name'),
    email: contact('form.email'),
    company: contact('form.company'),
    message: contact('partnerForm.message'),
    messageHelp: contact('partnerForm.messageHelp'),
    submit: contact('form.submit'),
    sent: contact('form.sent'),
    fallbackIntro: contact('form.fallbackIntro'),
    fallbackMail: contact('form.fallbackMail'),
    fallbackWhatsapp: contact('form.fallbackWhatsapp'),
  };

  return (
    <>
      <PageHead
        lead={t('head.lead')}
        tail={t('head.accent')}
        citable={t('head.citable', { where })}
        actions={
          <QuickContact
            page="partners"
            whatsapp={whatsapp}
            book={booking}
            email={facts.email}
            linkedin={linkedin}
            labels={{
              group: t('quick.group'),
              whatsapp: t('quick.whatsapp'),
              book: t('quick.book'),
              linkedin: t('quick.linkedin'),
              email: t('quick.email'),
              copy: t('quick.copy'),
              copied: t('quick.copied'),
              failed: t('quick.failed'),
            }}
          />
        }
      />

      <PageSection id="que-hago" lead={t('what.title')} tail={t('what.accent')}>
        <Bento>
          {partners.cells.map((id, index) => (
            <BentoCell
              key={id}
              span={4}
              icon={index === 0 ? 'smartphone' : index === 1 ? 'globe' : 'sparkles'}
              title={t(`what.cells.${id as 'apps' | 'web' | 'ai'}.title`)}
            >
              <CellText>{t(`what.cells.${id as 'apps' | 'web' | 'ai'}.text`)}</CellText>
            </BentoCell>
          ))}
        </Bento>
      </PageSection>

      <PageSection id="como-encajo" lead={t('process.title')} tail={t('process.accent')}>
        <ProcessSteps steps={steps} />
        <p>{t('process.white')}</p>
      </PageSection>

      <PageSection id="encaje" lead={t('fit.title')} tail={t('fit.accent')}>
        <FitList
          labels={{ yes: t('fit.yesTitle'), no: t('fit.noTitle') }}
          yes={partners.fit.yes.map((id) => ({ id, text: t(`fit.yes.${id as 'peaks' | 'profile' | 'mvp'}`) }))}
          no={partners.fit.no.map((id) => ({ id, text: t(`fit.no.${id as 'team' | 'stack' | 'oncall'}`) }))}
        />
      </PageSection>

      <PageSection id="tarifa" lead={t('rate.title')} tail={t('rate.accent')}>
        <p>{t('rate.text')}</p>
        <div>
          <Button href={booking} icon="calendar">
            {t('rate.book')}
          </Button>
        </div>
      </PageSection>

      <PageSection
        id="casos"
        lead={t('cases.title')}
        tail={t('cases.accent')}
        aside={
          <ArrowLink href="/proyectos" emphasis="strong">
            {t('cases.all')}
          </ArrowLink>
        }
      >
        <p>{t('cases.text')}</p>
        <div className={styles.cases}>
          {tourProjects().map((sheet) => (
            <ProjectCard
              key={sheet.slug}
              slug={sheet.slug}
              name={sheet.name}
              lead={datoText(sheet.texts[locale].oneLiner)}
              kind={sheet.type}
              kindLabel={projectsT(`kind.${sheet.type}`)}
              art={projectArt(sheet.art, env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION)}
              href={projectHref(sheet.slug)}
              linkLabel={projectsT('viewProject')}
              linkName={projectsT('viewProjectNamed', { name: sheet.name })}
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="preguntas" lead={t('faq.title')} tail={t('faq.accent')}>
        <Faq items={faq} />
      </PageSection>

      <PageSection id="escribeme" lead={t('form.title')} tail={t('form.accent')}>
        <div className={styles.form}>
          <LeadForm
            variant="partner"
            via="partner"
            locale={locale}
            siteKey={env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            labels={formLabels}
            email={facts.email}
            whatsapp={whatsapp}
          />
          <ArrowLink href="/chat?case=partner" emphasis="strong">
            {t('form.assistant')}
          </ArrowLink>
        </div>
      </PageSection>

      <FaqJsonLd items={faq} />
      <JsonLd
        data={graphOf({
          '@type': 'Service',
          name: t('seo.service'),
          serviceType: t('seo.service'),
          provider: { '@id': ids(siteUrl()).person },
          areaServed: 'ES',
          audience: { '@type': 'BusinessAudience', audienceType: t('seo.audience') },
          url: absoluteUrl(locale, '/partners'),
        })}
      />
    </>
  );
}
