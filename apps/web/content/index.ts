
import partnersFaqEn from './faq/partners.en.json';
import partnersFaqEs from './faq/partners.es.json';
import servicesFaqEn from './faq/services.en.json';
import servicesFaqEs from './faq/services.es.json';
import partnersJson from './partners.json';
import { faqFileSchema, partnersContentSchema, servicesContentSchema } from './schema.ts';
import servicesJson from './services.json';

// Versioned content read by the pages (task 3.1). Validated when this module loads: an invalid file fails every
// import, not just one caller. Projects have their own folder (`projects/index.ts`).
export const services = servicesContentSchema.parse(servicesJson);
export const partners = partnersContentSchema.parse(partnersJson);

export const faq = {
  services: { es: faqFileSchema.parse(servicesFaqEs), en: faqFileSchema.parse(servicesFaqEn) },
  partners: { es: faqFileSchema.parse(partnersFaqEs), en: faqFileSchema.parse(partnersFaqEn) },
} as const;
