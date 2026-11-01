import { getTranslations } from 'next-intl/server';

import { Closing } from '@/components/scenes';
import { Button } from '@/components/ui/button';
import { KeyCap } from '@/components/ui/key-cap';

import { bookingHref, whatsappHref } from './links';

/**
 * Scene 6, the closing: «¿Empezamos? Cuéntame qué necesitas.», a solid WhatsApp and a ghost call
 * (one violet action), and, where there is a keyboard, the hint to ⌘K with the real key caps. The
 * hint message holds the position of the keys as `<keys></keys>`.
 */
export async function ClosingScene() {
  const t = await getTranslations('home.scenes.closing');
  const actions = await getTranslations('actions');

  return (
    <Closing
      id="hablamos"
      lead={t('title')}
      tail={t('accent')}
      actions={
        <>
          <Button size="lg" icon="message-circle" href={whatsappHref('')}>
            {actions('whatsapp')}
          </Button>
          <Button size="lg" variant="ghost" icon="calendar" href={bookingHref()}>
            {actions('book20')}
          </Button>
        </>
      }
      hint={t.rich('hint', {
        keys: () => (
          <>
            <KeyCap keyId="mod" />
            <KeyCap keyId="k" />
          </>
        ),
      })}
    />
  );
}
