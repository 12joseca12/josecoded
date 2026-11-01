import { describe, expect, it } from 'vitest';

import { COMMAND_IDS, COMMAND_SPECS, availableCommands } from './commands';

describe('commands of ⌘K', () => {
  it('lists «Ir a» Sobre mí · Servicios · Proyectos · Lab · Blog · Para agencias and then the actions', () => {
    expect(COMMAND_SPECS.map((c) => c.id)).toEqual([...COMMAND_IDS]);
    expect(COMMAND_SPECS.filter((c) => c.group === 'goTo').map((c) => c.id)).toEqual([
      'about',
      'services',
      'projects',
      'lab',
      'blog',
      'partners',
    ]);
    expect(COMMAND_SPECS.find((c) => c.id === 'packs')?.href).toBe('/servicios#packs');
    expect(COMMAND_SPECS.find((c) => c.id === 'hourly')?.href).toBe('/servicios#por-hora');
    expect(COMMAND_SPECS.find((c) => c.id === 'cv')?.href).toBe('/servicios#contratacion');
  });

  it('drops Lab and Blog when they have no content', () => {
    expect(availableCommands({ lab: false, blog: false }).map((c) => c.id)).not.toContain('lab');
    expect(availableCommands({ lab: false, blog: false }).map((c) => c.id)).not.toContain('blog');
    expect(availableCommands({ lab: true, blog: false }).map((c) => c.id)).toContain('lab');
    expect(availableCommands({ lab: true, blog: true })).toHaveLength(COMMAND_SPECS.length);
  });
});
