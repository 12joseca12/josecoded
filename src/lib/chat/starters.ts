import type { ChatStarterTopic } from "@/types/chat";

const topicByPrefix: [string, ChatStarterTopic][] = [
  ["/servicios/freelance", "freelance"],
  ["/servicios", "services"],
  ["/sobre-mi", "about"],
  ["/contacto", "contact"],
];

const localePrefix = /^\/(es|en)(?=\/|$)/;

export function starterTopicFor(pathname: string): ChatStarterTopic {
  const path = pathname.replace(localePrefix, "") || "/";
  for (const [prefix, topic] of topicByPrefix) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return topic;
  }
  return "default";
}
