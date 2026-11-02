import { getTranslations } from 'next-intl/server';

import { CalEmbed } from '@/components/contact/cal-embed';
import { LeadForm } from '@/components/contact/lead-form';
import { ViaTabs } from '@/components/contact/via-tabs';
import { datoText } from '@/components/home/dato';
import { readFact } from '@/components/home/facts';
import { bookingHref, whatsappHref } from '@/components/home/links';
import { JsonLd } from '@/components/seo';
import { Disclosure } from '@/components/shared/disclosure';
import { FactList } from '@/components/shared/fact-list';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { QuickContact } from '@/components/shared/quick-contact';
import { WhatsAppButton } from '@/components/shared/whatsapp-button';
import { ArrowLink } from '@/components/ui/arrow-link';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { loadFacts } from '@/lib/seo/facts-server';
import { graphOf, ids } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { siteUrl } from '@/lib/seo/urls';

import type { LocaleParams } from '@/lib/locale';
import type { Href } from '@josecoded/types';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact.meta' });
  return pageMetadata({ locale, pathname: '/contacto', title: t('title'), description: t('description') });
}

// P3 (pantallas v2.0): four ways in, the form with Turnstile, the lazy booking and the fast ways. A way
// without data (a pending email, no LinkedIn) is simply not rendered.
export default async function ContactPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const actions = await getTranslations({ locale, namespace: 'actions' });
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const facts = await loadFacts(locale);

  const whatsapp = whatsappHref(String(factsT.raw('whatsappProject')));
  const booking = bookingHref();
  const cv = readFact(factsT.raw('cvUrl'));
  const siteKey = env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const linkedin = facts.linkedinUrl as Href | undefined;

  const quick = {
    group: t('quick.group'),
    whatsapp: t('quick.whatsapp'),
    book: t('quick.book'),
    linkedin: t('quick.linkedin'),
    email: t('quick.email'),
    copy: t('quick.copy'),
    copied: t('quick.copied'),
    failed: t('quick.failed'),
  };
  const formLabels = {
    form: t('form.label'),
    name: t('form.name'),
    email: t('form.email'),
    company: t('form.company'),
    message: t('form.message'),
    messageHelp: t('form.messageHelp'),
    submit: t('form.submit'),
    sent: t('form.sent'),
    fallbackIntro: t('form.fallbackIntro'),
    fallbackMail: t('form.fallbackMail'),
    fallbackWhatsapp: t('form.fallbackWhatsapp'),
    privacy: t('form.privacy'),
    privacyLink: t('form.privacyLink'),
  };

  const response = datoText(String(t.raw('data.response')));
  const facts_ = [
    { id: 'email', term: t('data.terms.email'), value: facts.email },
    { id: 'linkedin', term: t('data.terms.linkedin'), value: linkedin ? <a href={linkedin} rel="me">{linkedin}</a> : null },
    { id: 'github', term: t('data.terms.github'), value: facts.githubUser ? <a href={`https://github.com/${facts.githubUser}`} rel="me">{facts.githubUser}</a> : null },
    { id: 'response', term: t('data.terms.response'), value: response },
  ];

  const vias = [
    {
      id: 'client' as const,
      label: t('tabs.client'),
      panel: (
        <>
          <p>{t('client.text')}</p>
          <div>
            <WhatsAppButton href={whatsapp} label={actions('whatsapp')} origin="contact" />
          </div>
          <ArrowLink href="/propuesta" emphasis="strong">
            {t('client.proposal')}
          </ArrowLink>
        </>
      ),
      live: (
        <Disclosure summary={t('client.leave')}>
          <LeadForm variant="contact" via="client" locale={locale} siteKey={siteKey} labels={formLabels} email={facts.email} whatsapp={whatsapp} />
        </Disclosure>
      ),
    },
    {
      id: 'partner' as const,
      label: t('tabs.partner'),
      panel: (
        <>
          <p>{t('partner.text')}</p>
          <QuickContact page="contact" labels={quick} whatsapp={whatsapp} book={booking} email={facts.email} linkedin={linkedin} />
          <ArrowLink href="/partners" emphasis="strong">
            {t('partner.page')}
          </ArrowLink>
        </>
      ),
      live: (
        <LeadForm
          variant="partner"
          via="partner"
          locale={locale}
          siteKey={siteKey}
          labels={{ ...formLabels, form: t('partnerForm.label'), message: t('partnerForm.message'), messageHelp: t('partnerForm.messageHelp') }}
          email={facts.email}
          whatsapp={whatsapp}
        />
      ),
    },
    {
      id: 'recruiter' as const,
      label: t('tabs.recruiter'),
      panel: (
        <>
          <p>{t('recruiter.text')}</p>
          <QuickContact page="contact" labels={quick} book={booking} email={facts.email} linkedin={linkedin} primary="book" />
          {cv.ready ? (
            <ArrowLink href={cv.value as Href} emphasis="strong" icon="download">
              {t('recruiter.cv')}
            </ArrowLink>
          ) : null}
          <ArrowLink href="/sobre-mi#stack" emphasis="strong">
            {t('recruiter.about')}
          </ArrowLink>
          <ArrowLink href="/chat?case=recruiter" emphasis="strong">
            {t('recruiter.assistant')}
          </ArrowLink>
        </>
      ),
    },
    {
      id: 'other' as const,
      label: t('tabs.other'),
      panel: (
        <>
          <p>{t('other.text')}</p>
          <ArrowLink href="/chat?case=curious" emphasis="strong">
            {t('other.assistant')}
          </ArrowLink>
        </>
      ),
      live: <LeadForm variant="contact" via="other" locale={locale} siteKey={siteKey} labels={formLabels} email={facts.email} whatsapp={whatsapp} />,
    },
  ];

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} citable={t('head.citable')} />
      <PageSection id="vias" lead={t('tabs.label')}>
        <ViaTabs label={t('tabs.label')} vias={vias} />
      </PageSection>
      <PageSection id="reserva" lead={t('booking.title')} tail={t('booking.accent')}>
        <p>{t('booking.text')}</p>
        <CalEmbed
          calLink={env.client.NEXT_PUBLIC_CAL_LINK}
          origin="contact"
          labels={{ open: t('booking.open'), title: t('booking.frame'), external: t('booking.external') }}
        />
      </PageSection>
      <PageSection id="datos" lead={t('data.title')}>
        <FactList facts={facts_} variant="compact" />
      </PageSection>
      <JsonLd
        data={graphOf({
          '@type': 'ContactPage',
          mainEntity: { '@id': ids(siteUrl()).person },
          inLanguage: locale,
        })}
      />
    </>
  );
}
