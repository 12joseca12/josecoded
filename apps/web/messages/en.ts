// English counterpart of messages/es.ts. `satisfies` makes a key missing in English a type error.
import about from './en/about.json';
import adminNotifications from './en/admin-notifications.json';
import adminPricing from './en/admin-pricing.json';
import adminTexts from './en/admin-texts.json';
import adminTexts from './en/admin-texts.json';
import adminTeam from './en/admin-team.json';
import area from './en/area.json';
import auth from './en/auth.json';
import blog from './en/blog.json';
import chat from './en/chat.json';
import common from './en/common.json';
import contact from './en/contact.json';
import crmClients from './en/crm-clients.json';
import crmCommissions from './en/crm-commissions.json';
import crmContacts from './en/crm-contacts.json';
import crm from './en/crm.json';
import dev from './en/dev.json';
import home from './en/home.json';
import lab from './en/lab.json';
import legal from './en/legal.json';
import newsletter from './en/newsletter.json';
import partners from './en/partners.json';
import projects from './en/projects.json';
import proposal from './en/proposal.json';
import seo from './en/seo.json';
import services from './en/services.json';
import stories from './en/stories.json';

import type es from './es';

const messages = {
  ...common,
  ...home,
  ...services,
  ...partners,
  ...lab,
  ...legal,
  ...about,
  ...projects,
  ...blog,
  ...chat,
  ...contact,
  ...crm,
  ...adminNotifications,
  ...adminPricing,
  ...adminTexts,
  ...adminTexts,
  ...adminTeam,
  ...crmClients,
  ...crmCommissions,
  ...crmContacts,
  ...dev,
  ...proposal,
  ...auth,
  ...area,
  ...newsletter,
  ...seo,
  ...stories,
} satisfies typeof es;

export default messages;
