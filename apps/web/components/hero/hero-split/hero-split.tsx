import { getTranslations } from 'next-intl/server';

import { FallText } from '@/components/hero/fall-text';
import { HeroStage } from '@/components/hero/hero-stage';
import { IntroGateScript } from '@/components/hero/intro-gate-script';
import { Button } from '@/components/ui/button';
import { isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

import styles from './hero-split.module.css';

/**
 * Scene 0 of the home (UX v4.0 §4.1, home-v7): the name as the one `h1` in two lines, the
 * subtitle, the two exits and the stage. Server Component; the only islands are the intro gate
 * (inline script, first child so it runs before the letters are parsed) and the scene gate inside
 * the stage. `data-intro-root` is where `IntroFall` looks for the falling letters.
 *
 * `{{DATO}}`: name and subtitle are still pending in `messages`. They show as markers in
 * development and previews (`FallText` does not split them); in production a pending line is left
 * out and, if both are, the `h1` falls back to the site name so the page never has an empty or
 * missing `h1`. Messages that hold a marker are read with `t.raw`: the marker is not ICU syntax.
 *
 * A11y: the `h1` reads "Jose Carlos Sánchez" (each line is a block; the space between them keeps
 * the words apart in the accessible name and in copy-paste); the two exits are a solid and a ghost
 * link, one violet action in the view.
 */
export async function HeroSplit() {
  const t = await getTranslations();
  const given = String(t.raw('facts.givenNames'));
  const surnames = String(t.raw('facts.surnames'));
  const subtitle = String(t.raw('hero.subtitle'));

  const lines = [
    isPendingDato(given) ? given : t('hero.title.line1', { givenNames: given, surnames }),
    isPendingDato(surnames) ? surnames : t('hero.title.line2', { givenNames: given, surnames }),
  ].filter((line) => !isPendingDato(line) || isPendingVisible());
  const title = lines.length > 0 ? lines : [t('site.name')];

  return (
    <section className={styles.hero} id="top" data-intro-root>
      <IntroGateScript />
      <div className={styles.copy}>
        <h1 className={styles.title}>
          {title.map((line, i) => (
            <span key={i}>
              {i > 0 ? ' ' : null}
              <FallText text={line} />
            </span>
          ))}
        </h1>
        <FallText as="p" text={isPendingDato(subtitle) ? subtitle : t('hero.subtitle')} />
        <div className={styles.ctas}>
          <Button href="/servicios">
            <FallText text={t('hero.cta.services')} />
          </Button>
          <Button href="/proyectos" variant="ghost">
            <FallText text={t('hero.cta.projects')} />
          </Button>
        </div>
      </div>
      <div className={styles.stageCell}>
        <HeroStage label={t('hero.stageLabel')} />
      </div>
    </section>
  );
}
