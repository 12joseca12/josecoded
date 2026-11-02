import type { ChatState } from './chat-previews';
import type { ChatCase, ChatThreadItem, ChatViewData, Locale } from '@josecoded/types';

// Example data of the chat screen (block B02). The real thread comes from the gateway in B03; the
// first line of the assistant comes from the context published per case (CRM), so here it is made up.

const GREETING: Record<Locale, Record<ChatCase, string>> = {
  es: {
    client: 'Hola, soy el asistente de Jose. Cuéntame qué necesitas para tu web o app y te oriento: plazos, forma de trabajar y por dónde empezar.',
    partner: 'Hola, soy el asistente de Jose. Si sois una agencia o consultora, puedo contarte cómo encaja Jose en vuestros proyectos: marca blanca, por horas o por feature.',
    recruiter: 'Hola, soy el asistente de Jose. Pregúntame por su experiencia, su stack o su disponibilidad y te respondo con lo que él ha publicado.',
    curious: 'Hola, soy el asistente de Jose. Pregunta lo que quieras sobre su trabajo, los proyectos o cómo lo hace.',
  },
  en: {
    client: "Hi, I'm Jose's assistant. Tell me what you need for your website or app and I'll point you the right way: timing, how he works and where to start.",
    partner: "Hi, I'm Jose's assistant. If you're an agency or consultancy, I can tell you how Jose fits into your projects: white label, hourly or per feature.",
    recruiter: "Hi, I'm Jose's assistant. Ask about his experience, his stack or his availability and I'll answer with what he has published.",
    curious: "Hi, I'm Jose's assistant. Ask anything about his work, his projects or how he does it.",
  },
};

const TALK: Record<Locale, readonly [string, string, string, string]> = {
  es: [
    'Tengo una tienda pequeña y quiero vender online. ¿Cuánto tarda y cómo se trabaja con Jose?',
    'Para una tienda pequeña suele bastar con unas semanas, según el catálogo y los pagos. Jose te propone un alcance cerrado antes de empezar y trabajáis con entregas cortas que puedes ver funcionando.',
    '¿Y el precio?\nNo quiero sorpresas.',
    'Los precios salen de la página de servicios, que es la fuente única. Si me cuentas qué necesitas, te digo qué pack se parece más; para una cifra exacta lo mejor es hablar 20 minutos con Jose.',
  ],
  en: [
    'I run a small shop and want to sell online. How long does it take and how does it work with Jose?',
    "For a small shop a few weeks is usually enough, depending on the catalogue and payments. Jose proposes a fixed scope before starting and you work in short deliveries you can see running.",
    "And the price?\nI don't want surprises.",
    "Prices come from the services page, the single source. Tell me what you need and I'll say which pack is closest; for an exact figure the best is a 20-minute call with Jose.",
  ],
};

const HANDOVER: Record<Locale, string> = {
  es: 'Hola, soy Jose. Acabo de leer la conversación; cuéntame un poco más de la tienda y vemos si encaja.',
  en: "Hi, it's Jose. I just read the conversation; tell me a bit more about the shop and we'll see if it fits.",
};

const DAILY_LIMIT = 20;

/** The `ChatViewData` of a state of `/dev/chat/<state>`, in the case and language asked. */
export function chatFixture(state: ChatState, chatCase: ChatCase, locale: Locale): ChatViewData {
  const greeting: ChatThreadItem = { id: 'm0', kind: 'message', from: 'assistant', text: GREETING[locale][chatCase] };
  if (state === 'vacio') {
    return { case: chatCase, thread: [greeting], quota: { used: 0, limit: DAILY_LIMIT }, handover: false, signedIn: false };
  }
  const [ask, answer, price, priceAnswer] = TALK[locale];
  const thread: ChatThreadItem[] = [
    greeting,
    { id: 'm1', kind: 'message', from: 'visitor', text: ask },
    { id: 'm2', kind: 'message', from: 'assistant', text: answer },
    { id: 'm3', kind: 'message', from: 'visitor', text: price },
    { id: 'm4', kind: 'message', from: 'assistant', text: priceAnswer },
    { id: 'm5', kind: 'quick_contact' },
  ];
  if (state === 'jose') {
    thread.push({ id: 'm6', kind: 'message', from: 'jose', text: HANDOVER[locale] });
  }
  return {
    case: chatCase,
    thread,
    quota: { used: state === 'cuota' ? DAILY_LIMIT : 2, limit: DAILY_LIMIT },
    handover: state === 'jose',
    signedIn: false,
  };
}
