// The steps of the guided proposal as a pure state machine (plan 3.9): no React, no network, so the order of the
// questions and the payload it builds are tested on their own. `GuidedChat` only renders the current step and
// dispatches what the visitor answers.

export const NEED_CHIPS = ['presence', 'bookings', 'orders', 'management', 'automation', 'app'] as const;
export type NeedChip = (typeof NEED_CHIPS)[number];
export const SALES_MODES = ['none', 'orders', 'bookings', 'both'] as const;
export type SalesMode = (typeof SALES_MODES)[number];
export const TIMELINES = ['asap', 'one_month', 'three_months', 'flexible'] as const;
export type Timeline = (typeof TIMELINES)[number];

export type Step = 'business' | 'needs' | 'sales' | 'timeline' | 'generating';
export type Phase = Step | 'proposal' | 'sending' | 'sent' | 'error';

export interface Payload {
  businessType: string;
  needs: string;
  salesMode: SalesMode;
  timeline: Timeline;
}

export interface MachineState {
  step: Phase;
  preselectedPack?: string;
  business?: string;
  needs?: { chips: NeedChip[]; text: string };
  sales?: SalesMode;
  timeline?: Timeline;
  /** The chips, as the labels the visitor saw, filled in by `toPayload`. */
  payload?: Payload;
}

export type Action =
  | { type: 'answer'; step: 'business'; value: string }
  | { type: 'answer'; step: 'needs'; value: { chips: NeedChip[]; text: string } }
  | { type: 'answer'; step: 'sales'; value: SalesMode }
  | { type: 'answer'; step: 'timeline'; value: Timeline }
  | { type: 'back' }
  | { type: 'restart' }
  | { type: 'generated' }
  | { type: 'failed' };

export function initial({ preselectedPack }: { preselectedPack?: string } = {}): MachineState {
  return { step: 'business', ...(preselectedPack ? { preselectedPack } : {}) };
}

/** What the needs already say about selling: orders and bookings settle the third question. */
export function impliedSales(chips: readonly NeedChip[]): SalesMode | undefined {
  const orders = chips.includes('orders');
  const bookings = chips.includes('bookings');
  if (orders && bookings) return 'both';
  if (orders) return 'orders';
  if (bookings) return 'bookings';
  return undefined;
}

/** `labelOf` turns a chip into the words the visitor read (the gateway receives text, in the visitor's language). */
export function toPayload(state: MachineState, labelOf: (chip: NeedChip) => string): Payload | undefined {
  if (!state.business || !state.needs || !state.timeline) return undefined;
  const sales = state.sales ?? impliedSales(state.needs.chips) ?? 'none';
  const needs = [...state.needs.chips.map(labelOf), state.needs.text.trim()].filter(Boolean).join('; ');
  return { businessType: state.business.trim(), needs, salesMode: sales, timeline: state.timeline };
}

export function reduce(state: MachineState, action: Action, labelOf: (chip: NeedChip) => string = (chip) => chip): MachineState {
  switch (action.type) {
    case 'answer': {
      if (action.step === 'business' && state.step === 'business') return { ...state, business: action.value, step: 'needs' };
      if (action.step === 'needs' && state.step === 'needs') {
        const sales = impliedSales(action.value.chips);
        return { ...state, needs: action.value, sales, step: sales ? 'timeline' : 'sales' };
      }
      if (action.step === 'sales' && state.step === 'sales') return { ...state, sales: action.value, step: 'timeline' };
      if (action.step === 'timeline' && state.step === 'timeline') {
        const next = { ...state, timeline: action.value, step: 'generating' as const };
        return { ...next, payload: toPayload(next, labelOf) };
      }
      return state;
    }
    case 'back': {
      if (state.step === 'needs') return { ...state, step: 'business' };
      if (state.step === 'sales') return { ...state, step: 'needs' };
      if (state.step === 'timeline') return { ...state, step: state.needs && impliedSales(state.needs.chips) ? 'needs' : 'sales' };
      return state;
    }
    case 'generated':
      return state.step === 'generating' ? { ...state, step: 'proposal' } : state;
    case 'failed':
      return state.step === 'generating' ? { ...state, step: 'timeline', timeline: undefined, payload: undefined } : state;
    case 'restart':
      return initial({ preselectedPack: state.preselectedPack });
  }
}

/** Position for «1 de 4»: the sales question counts only when it is asked. */
export function progress(state: MachineState): { current: number; total: number } {
  const skipped = state.needs !== undefined && impliedSales(state.needs.chips) !== undefined;
  const total = skipped ? 3 : 4;
  const order: Step[] = skipped ? ['business', 'needs', 'timeline'] : ['business', 'needs', 'sales', 'timeline'];
  const index = order.indexOf(state.step as Step);
  return { current: index === -1 ? total : index + 1, total };
}
