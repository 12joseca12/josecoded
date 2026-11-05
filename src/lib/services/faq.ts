import type { MessageKey } from "@/i18n/keys.generated";
import { withResponseTime } from "@/lib/common/response-time";
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
    { id: "nda", question: "services.faq.hub.q5", answer: "services.faq.hub.a5" },
    { id: "overlap", question: "services.faq.hub.q6", answer: "services.faq.hub.a6" },
    { id: "dislike", question: "services.faq.hub.q7", answer: "services.faq.hub.a7" },
  ],
  freelance: [
    { id: "minimum", question: "services.faq.freelance.q1", answer: "services.faq.freelance.a1" },
    { id: "model", question: "services.faq.freelance.q2", answer: "services.faq.freelance.a2" },
    { id: "progress", question: "services.faq.freelance.q3", answer: "services.faq.freelance.a3" },
    { id: "scope", question: "services.faq.freelance.q4", answer: "services.faq.freelance.a4" },
    { id: "nda", question: "services.faq.freelance.q5", answer: "services.faq.freelance.a5" },
    { id: "overlap", question: "services.faq.freelance.q6", answer: "services.faq.freelance.a6" },
  ],
  offers: [
    { id: "cost", question: "services.faq.offers.q1", answer: "services.faq.offers.a1" },
    { id: "included", question: "services.faq.offers.q2", answer: "services.faq.offers.a2" },
    { id: "publishing", question: "services.faq.offers.q3", answer: "services.faq.offers.a3" },
    { id: "warranty", question: "services.faq.offers.q4", answer: "services.faq.offers.a4" },
    { id: "client", question: "services.faq.offers.q5", answer: "services.faq.offers.a5" },
    { id: "outside", question: "services.faq.offers.q6", answer: "services.faq.offers.a6" },
    { id: "continuity", question: "services.faq.offers.q7", answer: "services.faq.offers.a7" },
    { id: "ownership", question: "services.faq.offers.q8", answer: "services.faq.offers.a8" },
    { id: "phases", question: "services.faq.offers.q9", answer: "services.faq.offers.a9" },
    { id: "midway", question: "services.faq.offers.q10", answer: "services.faq.offers.a10" },
  ],
  audit: [
    { id: "cost", question: "services.faq.audit.q1", answer: "services.faq.audit.a1" },
    { id: "tools", question: "services.faq.audit.q2", answer: "services.faq.audit.a2" },
    { id: "fixing", question: "services.faq.audit.q3", answer: "services.faq.audit.a3" },
    { id: "accessibility", question: "services.faq.audit.q4", answer: "services.faq.audit.a4" },
    { id: "access", question: "services.faq.audit.q5", answer: "services.faq.audit.a5" },
    { id: "ai", question: "services.faq.audit.q6", answer: "services.faq.audit.a6" },
    { id: "app", question: "services.faq.audit.q7", answer: "services.faq.audit.a7" },
  ],
};

export function buildFaqItems(t: (key: MessageKey) => string, page: ServicePageId): FaqItem[] {
  return faqKeys[page].map((entry) => ({
    id: entry.id,
    question: t(entry.question),
    answer: withResponseTime(t, t(entry.answer)),
  }));
}
