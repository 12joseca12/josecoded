import { getTranslations } from 'next-intl/server';

import { whatsappHref } from '@/components/home/links';
import { GuidedChatEntry } from '@/components/proposal';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { ArrowLink } from '@/components/ui/arrow-link';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { loadFacts } from '@/lib/seo/facts-server';
import { pageMetadata } from '@/lib/seo/page-metadata';

import type { GuidedChatLabels } from '@/components/proposal';
import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'proposal.meta' });
  return pageMetadata({ locale, pathname: '/propuesta', title: t('title'), description: t('description') });
}

// P2 (pantallas v2.0): the guided proposal. The page is static; the chat reads `?pack=` and `?q=` in the browser.
export default async function ProposalPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'proposal' });
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const facts = await loadFacts(locale);

  const labels: GuidedChatLabels = {
    progress: t.raw('progress') as string,
    chatLabel: t('chat.label'),
    back: t('back'),
    verify: t('verify.label'),
    generating: t('generating'),
    business: {
      question: t('steps.business.question'),
      chips: {
        restaurant: t('steps.business.chips.restaurant'),
        clinic: t('steps.business.chips.clinic'),
        shop: t('steps.business.chips.shop'),
        services: t('steps.business.chips.services'),
      },
      other: t('steps.business.other'),
      otherHelp: t('steps.business.otherHelp'),
      next: t('steps.business.next'),
    },
    needs: {
      question: t('steps.needs.question'),
      legend: t('steps.needs.legend'),
      chips: {
        presence: t('steps.needs.chips.presence'),
        bookings: t('steps.needs.chips.bookings'),
        orders: t('steps.needs.chips.orders'),
        management: t('steps.needs.chips.management'),
        automation: t('steps.needs.chips.automation'),
        app: t('steps.needs.chips.app'),
      },
      text: t('steps.needs.text'),
      next: t('steps.needs.next'),
    },
    sales: {
      question: t('steps.sales.question'),
      options: {
        none: t('steps.sales.options.none'),
        orders: t('steps.sales.options.orders'),
        bookings: t('steps.sales.options.bookings'),
        both: t('steps.sales.options.both'),
      },
    },
    timeline: {
      question: t('steps.timeline.question'),
      options: {
        asap: t('steps.timeline.options.asap'),
        one_month: t('steps.timeline.options.one_month'),
        three_months: t('steps.timeline.options.three_months'),
        flexible: t('steps.timeline.options.flexible'),
      },
    },
    errors: {
      captcha: t('errors.captcha'),
      rate: t('errors.rate'),
      quota: t('errors.quota'),
      down: t('errors.down'),
      invalid: t('errors.invalid'),
    },
    contact: t('errors.contact'),
    card: {
      title: t('card.title'),
      pack: t.raw('card.pack') as string,
      from: t.raw('card.from') as string,
      vat: t('card.vat'),
      weeksOne: t.raw('card.weeksOne') as string,
      weeksMany: t.raw('card.weeksMany') as string,
      includes: t('card.includes'),
      scope: t('card.scope'),
      extras: t('card.extras'),
      extrasMonthly: t('card.extrasMonthly'),
      questions: t('card.questions'),
      sourceAi: t('card.source.ai'),
      sourceRules: t('card.source.rules'),
      appTitle: t('card.appTitle'),
      appText: t.raw('card.appText') as string,
      send: t('card.send'),
      restart: t('card.restart'),
      packs: t('card.packs'),
    },
    send: {
      title: t('send.title'),
      text: t('send.text'),
      label: t('send.label'),
      name: t('send.name'),
      email: t('send.email'),
      phone: t('send.phone'),
      submit: t('send.submit'),
      sent: t('send.sent'),
      fallbackIntro: t('send.fallbackIntro'),
      fallbackMail: t('send.fallbackMail'),
      fallbackWhatsapp: t('send.fallbackWhatsapp'),
    },
  };

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} citable={t('head.citable')} />
      <PageSection id="propuesta" lead={t('title')}>
        <GuidedChatEntry
          locale={locale}
          apiUrl={env.client.NEXT_PUBLIC_JOSECODED_API_URL}
          siteKey={env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          labels={labels}
          email={facts.email}
          whatsapp={whatsappHref(String(factsT.raw('whatsappProject')))}
        />
        <ArrowLink href="/servicios#packs" emphasis="strong">
          {t('card.packs')}
        </ArrowLink>
      </PageSection>
    </>
  );
}
