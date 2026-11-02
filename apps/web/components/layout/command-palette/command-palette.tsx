import { getLocale, getTranslations } from 'next-intl/server';

import { bookingHref, whatsappHref } from '@/components/home/links';
import { servicePrices } from '@/components/home/services-data';
import { getSectionAvailability } from '@/lib/content/sections';
import { COMMAND_SPECS, availableCommands } from '@/lib/palette/commands';

import { CommandPaletteIsland } from './command-palette-island';

import type { PaletteCopy, PaletteItem } from './command-palette-dialog';
import type { CommandId, CommandSpec } from '@/lib/palette/commands';
import type { Locale } from '@josecoded/types';

/**
 * ⌘K, in the global layout. The server builds the list (labels, hints, keywords and destinations,
 * the prices from `@josecoded/pricing`) and hands it to the island, which only registers the palette
 * with the shell and loads the dialog on first use. Lab and Blog are in the list only while they
 * have content (`getSectionAvailability`).
 */
export async function CommandPalette() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('palette');
  const nav = await getTranslations('nav');
  const actions = await getTranslations('actions');
  const prices = servicePrices(locale);

  const labels: Record<CommandId, string> = {
    about: nav('about'),
    services: nav('services'),
    projects: nav('projects'),
    lab: nav('lab'),
    blog: nav('blog'),
    partners: nav('partners'),
    packs: t('labels.packs'),
    hourly: t('labels.hourly'),
    proposal: actions('requestProposal'),
    cv: actions('downloadCv'),
    book: actions('book20'),
    whatsapp: actions('whatsapp'),
    contact: nav('contact'),
    chat: nav('chatOpen'),
    login: nav('login'),
  };
  const hints = (spec: CommandSpec): string | undefined => {
    if (spec.hint === 'pdf') return t('hints.pdf');
    if (spec.hint === 'from') return t('hints.from', { price: prices.fromPack });
    if (spec.hint === 'perHour') return t('hints.perHour', { price: prices.hourly });
    return undefined;
  };
  // the call and WhatsApp are not pages of this site
  const destination = (spec: CommandSpec) =>
    spec.id === 'book' ? bookingHref() : spec.id === 'whatsapp' ? whatsappHref('') : spec.href;

  const commands: PaletteItem[] = availableCommands(getSectionAvailability(), COMMAND_SPECS).map((spec) => ({
    id: spec.id,
    group: spec.group,
    groupLabel: t(`groups.${spec.group}`),
    label: labels[spec.id],
    hint: hints(spec),
    keywords: String(t.raw(`keywords.${spec.id}`)).split(/\s+/),
    icon: spec.icon,
    href: destination(spec),
  }));

  const copy: PaletteCopy = {
    label: t('label'),
    placeholder: t('placeholder'),
    hintMove: t('hintMove'),
    hintOpen: t('hintOpen'),
    empty: String(t.raw('empty')),
    listLabel: t('label'),
    resultsOne: t('resultsOne'),
    resultsMany: String(t.raw('resultsMany')),
  };

  return <CommandPaletteIsland commands={commands} copy={copy} />;
}
