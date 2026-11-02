// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { projects } from './index';
import { projectSchema } from './schema';

const dir = fileURLToPath(new URL('.', import.meta.url));
const files = readdirSync(dir).filter((name) => name.endsWith('.json'));

describe('project sheets', () => {
  it('has one valid sheet per JSON file and every file is listed in index.ts', () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
    for (const name of files) {
      const sheet = projectSchema.parse(JSON.parse(readFileSync(`${dir}${name}`, 'utf8')));
      expect(`${sheet.slug}.json`).toBe(name);
    }
    expect(projects.map((project) => project.slug).sort()).toEqual(files.map((name) => name.replace('.json', '')).sort());
  });

  it('are exactly 3cat, 3catinfo and josecoded (HazmeFila and Oportunix are out)', () => {
    expect(projects.map((project) => project.slug).sort()).toEqual(['3cat', '3catinfo', 'josecoded']);
  });

  it('3catinfo is the reduced sheet: no metrics, no stack', () => {
    const sheet = projects.find((project) => project.slug === '3catinfo');
    expect(sheet?.hideMetrics).toBe(true);
    expect(sheet?.hideStack).toBe(true);
    expect(sheet?.stack).toEqual([]);
  });

  it('josecoded.com links the site and never the code (the repository is private)', () => {
    const sheet = projects.find((project) => project.slug === 'josecoded');
    expect(sheet?.proofs.webUrl).toBe('https://josecoded.com');
    expect(sheet?.proofs.repoUrl).toBeUndefined();
    expect(sheet?.self).toBe(true);
  });

  it('carries no figure of any kind in the real texts (the site publishes no metrics)', () => {
    for (const project of projects) {
      for (const locale of ['es', 'en'] as const) {
        const { result } = project.texts[locale];
        expect(result).not.toMatch(/\d+\s?(%|k\b|descargas|downloads|installs|usuarios|users)/i);
      }
    }
  });
});
