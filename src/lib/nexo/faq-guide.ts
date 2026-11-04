import type { FaqItem } from "@/types/services";

import type { NexoGuide, NexoGuideReply } from "./guide";

const stopWords = new Set([
  "los",
  "las",
  "del",
  "una",
  "unos",
  "unas",
  "que",
  "con",
  "por",
  "para",
  "como",
  "cual",
  "cuales",
  "cuanto",
  "cuanta",
  "cuantos",
  "donde",
  "cuando",
  "quien",
  "pero",
  "sin",
  "sobre",
  "hay",
  "son",
  "soy",
  "eres",
  "tengo",
  "tienes",
  "puedo",
  "puedes",
  "quiero",
  "necesito",
  "hola",
  "gracias",
  "the",
  "and",
  "you",
  "your",
  "are",
  "can",
  "how",
  "what",
  "which",
  "when",
  "where",
  "who",
  "does",
  "have",
  "with",
  "for",
  "this",
  "that",
  "from",
  "hello",
  "thanks",
]);

const minLength = 3;
const stemLength = 5;
const questionWeight = 2;
const answerWeight = 1;
const minScore = 2;

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stems(text: string): Set<string> {
  const out = new Set<string>();
  for (const word of normalise(text).split(" ")) {
    if (word.length < minLength || stopWords.has(word)) continue;
    out.add(word.slice(0, stemLength));
  }
  return out;
}

function score(input: Set<string>, item: FaqItem): number {
  const question = stems(item.question);
  const answer = stems(item.answer);
  let total = 0;
  for (const stem of input) {
    if (question.has(stem)) total += questionWeight;
    else if (answer.has(stem)) total += answerWeight;
  }
  return total;
}

export function matchFaq(items: readonly FaqItem[], input: string): FaqItem | null {
  const exact = normalise(input);
  const same = items.find((item) => normalise(item.question) === exact);
  if (same) return same;
  const words = stems(input);
  let best: FaqItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const value = score(words, item);
    if (value > bestScore) {
      best = item;
      bestScore = value;
    }
  }
  return bestScore >= minScore ? best : null;
}

export function createFaqGuide(items: readonly FaqItem[]): NexoGuide {
  return {
    suggestions: items.map((item) => ({ id: item.id, text: item.question })),
    reply(input: string): Promise<NexoGuideReply> {
      const found = matchFaq(items, input);
      return Promise.resolve(
        found ? { kind: "answer", id: found.id, text: found.answer } : { kind: "handoff" },
      );
    },
  };
}
