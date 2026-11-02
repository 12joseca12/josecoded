import { getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';
import { safeUrl, whatsappHref } from '@/lib/crm/links';

import { CopyButton } from '../copy-button';
import styles from './reach-links.module.css';

import type { ContactRecord } from '@/lib/crm/contact-detail';
import type { IconName, Locale } from '@josecoded/types';

/**
 * How to reach the contact: the email to copy, WhatsApp, LinkedIn, the web of the company and (admin) the Notion
 * page. A link exists only when its value is a real address: whatever was typed or imported is checked first.
 */
export async function ReachLinks({ contact, isAdmin, locale }: { contact: ContactRecord; isAdmin: boolean; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmContacts.reach' });
  const whatsapp = whatsappHref(contact.phone);
  const linkedin = safeUrl(contact.linkedin_url);
  const web = safeUrl(contact.organization?.website);
  const notion = isAdmin ? safeUrl(contact.notion_url) : null;
  const links: { href: string; icon: IconName; label: string }[] = [];
  if (whatsapp) links.push({ href: whatsapp, icon: 'phone', label: t('whatsapp') });
  if (linkedin) links.push({ href: linkedin, icon: 'link', label: t('linkedin') });
  if (web) links.push({ href: web, icon: 'globe', label: t('web') });
  if (notion) links.push({ href: notion, icon: 'book-open', label: t('notion') });

  if (!contact.email && links.length === 0) return null;
  return (
    <div className={styles.reach}>
      {contact.email ? <CopyButton value={contact.email} label={t('copyEmail')} labels={{ copied: t('copied'), failed: t('copyFailed') }} /> : null}
      {links.map((link) => (
        <a key={link.label} className={styles.link} href={link.href} rel="noopener noreferrer" target="_blank">
          <Icon name={link.icon} />
          {link.label}
          <span className="sr-only"> {t('newTab')}</span>
        </a>
      ))}
    </div>
  );
}
