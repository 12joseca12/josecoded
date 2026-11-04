import type { MessageKey } from "@/i18n/keys.generated";
import type { FaqItem, ServicePageId } from "@/types/services";

interface FaqKeys {
  id: string;
  question: MessageKey;
  answer: MessageKey;
}

export const faqKeys: Record<ServicePageId, readonly FaqKeys[]> = {
  hub: [
    { id: "remote", question: "services.faq.hub.q1", answer: "services.faq.hub.a1" },
    { id: "invoicing", question: "services.faq.hub.q2", answer: "services.faq.hub.a2" },
    { id: "languages", question: "services.faq.hub.q3", answer: "services.faq.hub.a3" },
    { id: "reply", question: "services.faq.hub.q4", answer: "services.faq.hub.a4" },
  ],
  freelance: [
    { id: "minimum", question: "services.faq.freelance.q1", answer: "services.faq.freelance.a1" },
    { id: "model", question: "services.faq.freelance.q2", answer: "services.faq.freelance.a2" },
    { id: "progress", question: "services.faq.freelance.q3", answer: "services.faq.freelance.a3" },
    { id: "scope", question: "services.faq.freelance.q4", answer: "services.faq.freelance.a4" },
  ],
  packs: [
    { id: "cost", question: "services.faq.packs.q1", answer: "services.faq.packs.a1" },
    { id: "included", question: "services.faq.packs.q2", answer: "services.faq.packs.a2" },
    { id: "publishing", question: "services.faq.packs.q3", answer: "services.faq.packs.a3" },
    { id: "maintenance", question: "services.faq.packs.q4", answer: "services.faq.packs.a4" },
    { id: "client", question: "services.faq.packs.q5", answer: "services.faq.packs.a5" },
  ],
};

export function buildFaqItems(t: (key: MessageKey) => string, page: ServicePageId): FaqItem[] {
  return faqKeys[page].map((entry) => ({
    id: entry.id,
    question: t(entry.question),
    answer: t(entry.answer),
  }));
}
