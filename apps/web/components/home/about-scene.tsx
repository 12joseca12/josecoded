import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { AboutSummary, Bento, BentoCell, CellText, Marquee, MarqueePause, MiniChat, Scene } from '@/components/scenes';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Pending } from '@/components/ui/pending';

import { readFact } from './facts';

import type { Href } from '@josecoded/types';

/**
 * Scene 1 of the home (home-v7, «Quién hay detrás. Una persona, no una agencia.»): the About cell
 * (7, tall) with photo, name, lead and the exits to the page and the CV; the stack marquee (5) and
 * the direct-contact mini chat (5, tinted). Server Component; the only islands are the cursor light
 * of the bento and the typing of the mini chat.
 *
 * `{{DATO}}`: given names, surnames, city, photo, CV and the lead are still pending. In development
 * and previews they show as markers; in production a pending piece is left out (the photo block,
 * the lead, the CV link) so nothing half-written is published.
 */
export async function AboutScene() {
  const t = await getTranslations('home.scenes.about');
  const actions = await getTranslations('actions');
  const facts = await getTranslations('facts');

  const given = readFact(facts.raw('givenNames'));
  const surnames = readFact(facts.raw('surnames'));
  const city = readFact(facts.raw('city'));
  const photo = readFact(facts.raw('photo'));
  const cv = readFact(facts.raw('cvUrl'));
  const lead = String(t.raw('about.lead'));
  const leadReady = !lead.includes('{{DATO');
  const stack = t.raw('stack.items') as string[];

  const name =
    given.ready && surnames.ready ? (
      t('about.name', { givenNames: given.value, surnames: surnames.value })
    ) : (
      <Pending>{given.ready ? surnames.value : given.value}</Pending>
    );

  return (
    <Scene id="sobre-mi" lead={t('title.lead')} tail={t('title.accent')} fill>
      <Bento>
        <BentoCell span={7} tall icon="user" title={t('about.title')}>
          <AboutSummary
            photo={
              photo.ready ? (
                <Image
                  src={photo.value}
                  alt={t('about.photoAlt')}
                  width={640}
                  height={800}
                  sizes="(min-width: 52rem) 16rem, 8rem"
                />
              ) : (
                <Pending>{photo.value}</Pending>
              )
            }
            name={name}
            role={
              city.ready ? (
                t('about.roleCity', { role: t('about.role'), city: city.value })
              ) : (
                <>
                  {t('about.role')} <Pending>{city.value}</Pending>
                </>
              )
            }
            lead={leadReady ? lead : <Pending>{lead}</Pending>}
            links={
              <>
                <ArrowLink href="/sobre-mi" emphasis="strong">
                  {t('about.meet')}
                </ArrowLink>
                {cv.ready ? (
                  <ArrowLink href={cv.value as Href} emphasis="strong" icon="download">
                    {actions('downloadCv')}
                  </ArrowLink>
                ) : (
                  <Pending>{cv.value}</Pending>
                )}
              </>
            }
          />
        </BentoCell>
        <BentoCell
          span={5}
          icon="layers"
          title={t('stack.title')}
          action={<MarqueePause pauseLabel={t('stack.pause')} resumeLabel={t('stack.resume')} />}
        >
          <Marquee items={stack} label={stack.join(', ')} />
          <Marquee items={stack} reverse />
          <CellText variant="muted">{t('stack.caption')}</CellText>
        </BentoCell>
        <BentoCell span={5} tone="tint" icon="message-circle" title={t('direct.title')}>
          <MiniChat label={t('direct.chatLabel')} visitor={t('direct.visitor')} reply={t('direct.reply')} />
          <CellText>{t('direct.lead')}</CellText>
          <ArrowLink href="/contacto" emphasis="strong">
            {t('direct.cta')}
          </ArrowLink>
        </BentoCell>
      </Bento>
    </Scene>
  );
}
