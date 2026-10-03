import { describe, expect, it } from 'vitest';

import base from '../tsconfig.base.json';
import next from '../tsconfig.next.json';
import worker from '../tsconfig.worker.json';

describe('shared tsconfigs', () => {
  it('base tsconfig is strict', () => {
    expect(base.compilerOptions.strict).toBe(true);
    expect(base.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(base.compilerOptions.moduleResolution).toBe('bundler');
    expect(base.compilerOptions.target).toBe('ES2022');
  });

  it('next and worker presets extend the strict base', () => {
    expect(next.extends).toBe('./tsconfig.base.json');
    expect(worker.extends).toBe('./tsconfig.base.json');
  });

  it('base maps @josecoded/types to its source', () => {
    expect(base.compilerOptions.paths['@josecoded/types']).toEqual(['../types/src/index.ts']);
  });
});
