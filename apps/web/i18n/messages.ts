import type { Locale } from '@josecoded/types';

// One module per locale composes the per-screen JSON files (messages/<locale>/<screen>.json).
// The explicit loaders keep each locale in its own chunk. This is the one door to the catalogs:
// the request config and the test helper both come through here.
const loaders = {
  es: () => import('../messages/es'),
  en: () => import('../messages/en'),
} as const;

export async function loadMessages(locale: Locale) {
  return (await loaders[locale]()).default;
}
