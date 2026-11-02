// Composes the per-screen catalogs (one JSON per screen, messages/es/<screen>.json) into the
// single object next-intl consumes. Top-level groups (`nav`, `home`, `facts`…) live inside each
// screen file; `i18n:check` (task 2.1) compares them file by file.
import about from './es/about.json';
import adminPricing from './es/admin-pricing.json';
import adminTeam from './es/admin-team.json';
import area from './es/area.json';
import auth from './es/auth.json';
import blog from './es/blog.json';
import chat from './es/chat.json';
import common from './es/common.json';
import contact from './es/contact.json';
import crmClients from './es/crm-clients.json';
import crmCommissions from './es/crm-commissions.json';
import crmContacts from './es/crm-contacts.json';
import crm from './es/crm.json';
import dev from './es/dev.json';
import home from './es/home.json';
import lab from './es/lab.json';
import legal from './es/legal.json';
import newsletter from './es/newsletter.json';
import partners from './es/partners.json';
import projects from './es/projects.json';
import proposal from './es/proposal.json';
import seo from './es/seo.json';
import services from './es/services.json';
import stories from './es/stories.json';

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
  ...adminPricing,
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
};

export default messages;
