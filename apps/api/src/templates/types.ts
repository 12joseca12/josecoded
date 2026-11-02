// Fixed transactional emails (DATOS §14.4, Q5). Each template is a pair of plain objects (es / en) with a fixed subject and a
// body built from the SITE address and from enum variables only: no field of a lead, a client or a story ever reaches the
// text, so nobody (a closer, a client, the admin) can make the gateway send words of their own.
export type Locale = 'es' | 'en';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EmailTemplate<V> {
  subject: string | ((vars: V) => string);
  /** Paragraphs, in order. Plain text: the HTML version escapes them. */
  paragraphs: (vars: V) => string[];
  /** The one link of the email (login), with its label. */
  action?: { label: string; path: string };
}

export const SITE_URL = 'https://josecoded.com';

/** The login URL in the language of the email (English pages live under /en). */
export function loginUrl(locale: Locale): string {
  return locale === 'en' ? `${SITE_URL}/en/auth/login` : `${SITE_URL}/auth/login`;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render<V>(template: EmailTemplate<V>, locale: Locale, vars: V): RenderedEmail {
  const subject = typeof template.subject === 'function' ? template.subject(vars) : template.subject;
  const paragraphs = template.paragraphs(vars);
  const url = template.action ? (template.action.path === 'login' ? loginUrl(locale) : `${SITE_URL}${template.action.path}`) : undefined;
  const text = [...paragraphs, ...(template.action && url ? [`${template.action.label}: ${url}`] : [])].join('\n\n');
  const html = [
    '<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">',
    ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    ...(template.action && url ? [`<p><a href="${escapeHtml(url)}">${escapeHtml(template.action.label)}</a></p>`] : []),
    '</body></html>',
  ].join('');
  return { subject, text, html };
}
