import { z } from 'zod';

// What the contact and partner forms send to their Server Action. The gateway validates the lead again
// (`leadRequestSchema`); this is the first, friendlier check that gives each field its own message key.

export const LEAD_KINDS = ['contact', 'partner'] as const;
export const CONTACT_VIAS = ['client', 'partner', 'recruiter', 'other'] as const;
export type ContactVia = (typeof CONTACT_VIAS)[number];

const text = (max: number) => z.string().trim().min(1).max(max);

export const leadFormSchema = z.object({
  kind: z.enum(LEAD_KINDS),
  locale: z.enum(['es', 'en']),
  name: text(120),
  email: z.email().max(320),
  /** Agency or company: asked in the partner form only. */
  company: z.string().trim().max(120).optional(),
  message: text(2000),
  via: z.enum(CONTACT_VIAS).optional(),
  turnstileToken: z.string().min(1).max(2048),
});

export type LeadFormFields = Pick<z.input<typeof leadFormSchema>, 'name' | 'email' | 'company' | 'message'> & { turnstileToken: string };

/** The visitor's `?via=` or the remembered audience: the old `negocio`/`empresa` map to the new four. */
export function resolveVia(search: string, remembered: string | null): ContactVia {
  const wanted = new URLSearchParams(search).get('via') ?? remembered ?? '';
  const mapped = wanted === 'negocio' || wanted === 'business' ? 'client' : wanted === 'empresa' || wanted === 'company' ? 'client' : wanted;
  return CONTACT_VIAS.find((via) => via === mapped) ?? 'client';
}
