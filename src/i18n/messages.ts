import type { Locale } from "./config";
import type { MessageKey } from "./keys.generated";

interface Tree {
  [key: string]: string | Tree;
}

const loaders: Record<Locale, () => Promise<{ default: Tree }>> = {
  es: () => import("../../messages/es.json"),
  en: () => import("../../messages/en.json"),
};

export async function getTranslator(locale: Locale) {
  const tree = (await loaders[locale]()).default;
  return (key: MessageKey): string => {
    let node: string | Tree | undefined = tree;
    for (const part of key.split(".")) {
      node = typeof node === "object" ? node[part] : undefined;
    }
    if (typeof node !== "string") {
      throw new Error(`Missing message "${key}" for locale "${locale}"`);
    }
    return node;
  };
}
