// Composes the per-screen catalogs (one JSON per screen, messages/es/<screen>.json) into the
// single object next-intl consumes. Top-level groups (`nav`, `home`, `facts`…) live inside each
// screen file; `i18n:check` (task 2.1) compares them file by file.
import about from './es/about.json';
import area from './es/area.json';
import auth from './es/auth.json';
import blog from './es/blog.json';
import business from './es/business.json';
import common from './es/common.json';
import companies from './es/companies.json';
import contact from './es/contact.json';
import home from './es/home.json';
import newsletter from './es/newsletter.json';
import projects from './es/projects.json';
import proposal from './es/proposal.json';

const messages = {
  ...common,
  ...home,
  ...business,
  ...companies,
  ...about,
  ...projects,
  ...blog,
  ...contact,
  ...proposal,
  ...auth,
  ...area,
  ...newsletter,
};

export default messages;
