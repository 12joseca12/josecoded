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
  offers: [
    { id: "cost", question: "services.faq.offers.q1", answer: "services.faq.offers.a1" },
    { id: "included", question: "services.faq.offers.q2", answer: "services.faq.offers.a2" },
    { id: "publishing", question: "services.faq.offers.q3", answer: "services.faq.offers.a3" },
    { id: "warranty", question: "services.faq.offers.q4", answer: "services.faq.offers.a4" },
    { id: "client", question: "services.faq.offers.q5", answer: "services.faq.offers.a5" },
    { id: "outside", question: "services.faq.offers.q6", answer: "services.faq.offers.a6" },
  ],
};

export function buildFaqItems(t: (key: MessageKey) => string, page: ServicePageId): FaqItem[] {
  return faqKeys[page].map((entry) => ({
    id: entry.id,
    question: t(entry.question),
    answer: t(entry.answer),
  }));
}
