import { describe, expect, it } from 'vitest';

import {
  assignColumn,
  fieldOfColumn,
  guessMapping,
  mappingSchema,
  normalizeLinkedin,
  normalizeRow,
  splitTags,
} from './import-mapping';

const headers = ['Nombre', 'Email', 'LinkedIn', 'Empresa', 'Tipo'];

describe('guessMapping', () => {
  it('maps spanish and english headers', () => {
    expect(guessMapping(['Nombre', 'E-mail', 'LinkedIn', 'Empresa', 'Tipo'])).toMatchObject({
      display_name: 0,
      email: 1,
      linkedin_url: 2,
      organization: 3,
      kind: 4,
    });
    expect(
      guessMapping(['Full name', 'Mobile', 'Company', 'Job title', 'City', 'Notes', 'Tags']),
    ).toEqual({
      display_name: 0,
      phone: 1,
      organization: 2,
      role: 3,
      city: 4,
      notes: 5,
      tags: 6,
    });
  });

  it('ignores accents, case and punctuation, uses a column once and leaves unknown ones out', () => {
    const mapping = guessMapping(['TELÉFONO', 'Teléfono 2', 'Fuente', 'nombre']);
    expect(mapping.phone).toBe(0);
    expect(mapping.display_name).toBe(3);
    expect(Object.values(mapping)).not.toContain(2);
    expect(Object.values(mapping).filter((i) => i === 0)).toHaveLength(1);
  });
});

describe('mappingSchema', () => {
  it('accepts known fields with a column index and nothing else', () => {
    expect(mappingSchema.safeParse({ display_name: 0, email: 3 }).success).toBe(true);
    expect(mappingSchema.safeParse({ display_name: -1 }).success).toBe(false);
    expect(mappingSchema.safeParse({ display_name: 1.5 }).success).toBe(false);
    expect(mappingSchema.safeParse({ owner_id: 1 }).success).toBe(false);
  });
});

describe('normalizeLinkedin', () => {
  it('drops the query, the www and the trailing slash', () => {
    expect(normalizeLinkedin('https://www.linkedin.com/in/Ana/?x=1')).toBe(
      'https://linkedin.com/in/ana',
    );
    expect(normalizeLinkedin('linkedin.com/in/ana#top')).toBe('https://linkedin.com/in/ana');
    expect(normalizeLinkedin('http://es.linkedin.com/in/ana/')).toBe('https://linkedin.com/in/ana');
  });
  it('refuses what is not a linkedin address', () => {
    expect(normalizeLinkedin('https://evil.test/in/ana')).toBeNull();
    expect(normalizeLinkedin('https://linkedin.com.evil.test/in/ana')).toBeNull();
    expect(normalizeLinkedin('javascript:alert(1)')).toBeNull();
    expect(normalizeLinkedin('ana')).toBeNull();
  });
});

describe('splitTags', () => {
  it('splits by semicolon or comma, trims and removes duplicates', () => {
    expect(splitTags('feria; Madrid ,feria,,  ')).toEqual(['feria', 'Madrid']);
    expect(splitTags('')).toEqual([]);
  });
});

describe('normalizeRow', () => {
  const mapping = guessMapping(headers);
  it('normalizes linkedin and requires a reachable field', () => {
    expect(
      normalizeRow(['Ana', '', 'https://www.linkedin.com/in/ana/?x=1', '', 'lead'], mapping).data
        ?.linkedin_url,
    ).toBe('https://linkedin.com/in/ana');
    expect(normalizeRow(['Ana', '', '', '', 'lead'], mapping).error).toBe('unreachable');
  });

  it('requires a name', () => {
    expect(normalizeRow(['  ', 'a@x.es', '', '', ''], mapping).error).toBe('name_required');
  });

  it('turns an empty kind into lead and understands spanish kinds', () => {
    expect(normalizeRow(['Ana', 'a@x.es', '', '', ''], mapping).data?.kind).toBe('lead');
    expect(normalizeRow(['Ana', 'a@x.es', '', '', 'Agencia'], mapping).data?.kind).toBe('agency');
    expect(normalizeRow(['Ana', 'a@x.es', '', '', 'Reclutador'], mapping).data?.kind).toBe(
      'recruiter',
    );
    expect(normalizeRow(['Ana', 'a@x.es', '', '', 'cliente'], mapping).error).toBe('kind_invalid');
  });

  it('names the first field that is wrong', () => {
    expect(normalizeRow(['Ana', 'no-es-un-email', '', '', ''], mapping).error).toBe(
      'email_invalid',
    );
    expect(normalizeRow(['Ana', '', 'https://evil.test/in/a', '', ''], mapping).error).toBe(
      'linkedin_url_invalid',
    );
    expect(normalizeRow(['Ana', 'a@x.es', '', 'x'.repeat(201), ''], mapping).error).toBe(
      'organization_invalid',
    );
  });

  it('lowercases the email and keeps a formula as plain text', () => {
    const row = normalizeRow(['=HYPERLINK("http://x.test")', 'ANA@X.ES', '', '', ''], mapping);
    expect(row.data?.email).toBe('ana@x.es');
    expect(row.data?.display_name).toBe('=HYPERLINK("http://x.test")');
  });

  it('ignores columns that are not mapped and cells beyond the row', () => {
    const only = { display_name: 0, email: 5 };
    expect(normalizeRow(['Ana'], only).error).toBe('unreachable');
    expect(normalizeRow(['Ana', 'a@x.es'], { display_name: 0 }).error).toBe('unreachable');
  });

  it('turns tags into a list', () => {
    const tagged = normalizeRow(['Ana', 'a@x.es', 'feria;madrid'], {
      display_name: 0,
      email: 1,
      tags: 2,
    });
    expect(tagged.data?.tags).toEqual(['feria', 'madrid']);
  });
});

describe('assignColumn', () => {
  const base = { display_name: 0, email: 1, phone: 2 };
  it('gives a field to a column and takes it from the one that had it', () => {
    expect(assignColumn(base, 3, 'email')).toEqual({ display_name: 0, phone: 2, email: 3 });
  });
  it('lets go of the field the column fed before', () => {
    expect(assignColumn(base, 1, 'phone')).toEqual({ display_name: 0, phone: 1 });
  });
  it('«No importar» frees the column and leaves the rest alone', () => {
    expect(assignColumn(base, 2, null)).toEqual({ display_name: 0, email: 1 });
    expect(base).toEqual({ display_name: 0, email: 1, phone: 2 });
  });
  it('finds the field of a column', () => {
    expect(fieldOfColumn(base, 1)).toBe('email');
    expect(fieldOfColumn(base, 7)).toBeNull();
  });
});
