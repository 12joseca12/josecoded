import { describe, expect, it } from 'vitest';

import { impliedSales, initial, progress, reduce } from './machine';

import type { MachineState, NeedChip } from './machine';

const label = (chip: NeedChip) => ({ presence: 'presencia', bookings: 'reservas', orders: 'pedidos', management: 'gestión', automation: 'automatización', app: 'app' })[chip];

describe('proposal machine', () => {
  it('skips the sales question when the needs already say orders or bookings', () => {
    let state: MachineState = initial({ preselectedPack: 'P2' });
    state = reduce(state, { type: 'answer', step: 'business', value: 'restaurante' }, label);
    state = reduce(state, { type: 'answer', step: 'needs', value: { chips: ['bookings'], text: '' } }, label);
    expect(state.step).toBe('timeline');
    expect(state.preselectedPack).toBe('P2');
    expect(progress(state)).toEqual({ current: 3, total: 3 });
  });

  it('asks about sales when the needs are ambiguous and builds the API payload with the visitor words', () => {
    let state = initial();
    state = reduce(state, { type: 'answer', step: 'business', value: 'clínica' }, label);
    state = reduce(state, { type: 'answer', step: 'needs', value: { chips: ['presence'], text: 'quiero que me encuentren' } }, label);
    expect(state.step).toBe('sales');
    expect(progress(state)).toEqual({ current: 3, total: 4 });
    state = reduce(state, { type: 'answer', step: 'sales', value: 'none' }, label);
    state = reduce(state, { type: 'answer', step: 'timeline', value: 'flexible' }, label);
    expect(state.step).toBe('generating');
    expect(state.payload).toEqual({ businessType: 'clínica', needs: 'presencia; quiero que me encuentren', salesMode: 'none', timeline: 'flexible' });
  });

  it('deduces orders, bookings or both from the chips', () => {
    expect(impliedSales(['orders'])).toBe('orders');
    expect(impliedSales(['orders', 'bookings'])).toBe('both');
    expect(impliedSales(['presence'])).toBeUndefined();
  });

  it('ignores an answer for a step that is not the current one, goes back and restarts keeping the pack', () => {
    let state = initial({ preselectedPack: 'P3' });
    expect(reduce(state, { type: 'answer', step: 'timeline', value: 'asap' })).toBe(state);
    state = reduce(state, { type: 'answer', step: 'business', value: 'tienda' });
    expect(reduce(state, { type: 'back' }).step).toBe('business');
    expect(reduce(state, { type: 'restart' })).toEqual({ step: 'business', preselectedPack: 'P3' });
  });

  it('returns to the last question when the generation fails', () => {
    let state = initial();
    state = reduce(state, { type: 'answer', step: 'business', value: 'x' });
    state = reduce(state, { type: 'answer', step: 'needs', value: { chips: ['orders'], text: '' } });
    state = reduce(state, { type: 'answer', step: 'timeline', value: 'asap' });
    expect(reduce(state, { type: 'failed' }).step).toBe('timeline');
    expect(reduce(state, { type: 'generated' }).step).toBe('proposal');
  });
});
