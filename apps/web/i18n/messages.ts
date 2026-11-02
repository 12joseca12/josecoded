import type Messages from '../messages/es';
import type { Locale } from '@josecoded/types';


// `content/generated/messages.<locale>.json` is written at prebuild (`pnpm generate`, scripts/merge-overrides.ts):
// the per-screen catalogs (messages/<locale>/<screen>.json) with the published text overrides applied.
// The explicit loaders keep each locale in its own chunk. This is the one door to the catalogs:
// the request config and the test helper both come through here. `messages/<locale>.ts` stays the typed source.
const loaders = {
  es: () => import('../content/generated/messages.es.json'),
  en: () => import('../content/generated/messages.en.json'),
} as const;

export async function loadMessages(locale: Locale) {
  return (await loaders[locale]()).default as unknown as typeof Messages;
}
