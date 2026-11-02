// English counterpart of messages/es.ts. `satisfies` makes a key missing in English a type error.
import about from './en/about.json';
import area from './en/area.json';
import auth from './en/auth.json';
import blog from './en/blog.json';
import common from './en/common.json';
import contact from './en/contact.json';
import crm from './en/crm.json';
import dev from './en/dev.json';
import home from './en/home.json';
import lab from './en/lab.json';
import newsletter from './en/newsletter.json';
import partners from './en/partners.json';
import projects from './en/projects.json';
import proposal from './en/proposal.json';
import seo from './en/seo.json';
import services from './en/services.json';

import type es from './es';

const messages = {
  ...common,
  ...home,
  ...services,
  ...partners,
  ...lab,
  ...about,
  ...projects,
  ...blog,
  ...contact,
  ...crm,
  ...dev,
  ...proposal,
  ...auth,
  ...area,
  ...newsletter,
  ...seo,
} satisfies typeof es;

export default messages;
