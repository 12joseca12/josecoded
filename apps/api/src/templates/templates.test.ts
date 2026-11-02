import { describe, expect, it } from 'vitest';

import { EMAIL_TEMPLATE_IDS, isEmailTemplateId, renderEmail } from './index';

describe('email catalogue (fixed text, no free body)', () => {
  it('lists exactly the three templates of the plan', () => {
    expect([...EMAIL_TEMPLATE_IDS].sort()).toEqual(['client-invited', 'staff-invited', 'story-decided']);
  });

  it.each(
    EMAIL_TEMPLATE_IDS.flatMap((id) => (['es', 'en'] as const).map((locale) => [id, locale] as const)),
  )('%s renders in %s with a subject, text, html and the login link', (id, locale) => {
    const vars: Record<string, string> = id === 'staff-invited' ? { role: 'closer' } : id === 'story-decided' ? { status: 'accepted' } : {};
    const mail = renderEmail(id, locale, vars);
    expect(mail.subject.length).toBeGreaterThan(5);
    expect(mail.text).toContain(locale === 'en' ? 'https://josecoded.com/en/auth/login' : 'https://josecoded.com/auth/login');
    expect(mail.html).toContain('<a href="https://josecoded.com');
    // no template leaves a placeholder or an undefined behind
    expect(`${mail.subject}${mail.text}${mail.html}`).not.toMatch(/undefined|\{\{|\$\{/);
  });

  it('the staff invitation says that the first sign-in asks for an authenticator (Q24)', () => {
    expect(renderEmail('staff-invited', 'es', { role: 'closer' }).text).toMatch(/autenticador/);
    expect(renderEmail('staff-invited', 'en', { role: 'admin' }).text).toMatch(/authenticator/);
  });

  it('the story email follows the decision', () => {
    expect(renderEmail('story-decided', 'es', { status: 'rejected' }).text).toMatch(/no la vamos a llevar/);
    expect(renderEmail('story-decided', 'en', { status: 'converted' }).subject).toMatch(/accepted/);
  });

  it('refuses an id outside the catalogue', () => {
    expect(isEmailTemplateId('staff-invited')).toBe(true);
    expect(isEmailTemplateId('toString')).toBe(false);
    expect(() => renderEmail('free-text', 'es')).toThrow('unknown_email_template');
    expect(() => renderEmail('__proto__', 'es')).toThrow('unknown_email_template');
  });

  it('refuses variables outside the enums, so no text of anyone reaches the body', () => {
    expect(() => renderEmail('story-decided', 'es', { status: 'accepted<script>' })).toThrow('invalid_email_variables');
    expect(() => renderEmail('staff-invited', 'es', { role: 'closer', body: 'hola' })).toThrow('invalid_email_variables');
    expect(() => renderEmail('client-invited', 'es', { name: 'x' })).toThrow('invalid_email_variables');
  });
});
