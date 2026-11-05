import { z } from "zod";

export const personSchema = z.strictObject({
  "@type": z.literal("Person"),
  "@id": z.url(),
  name: z.string().min(1),
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  alternateName: z.array(z.string().min(1)).min(1),
  email: z.email().optional(),
  jobTitle: z.string().min(1),
  description: z.string().min(1),
  url: z.url(),
  address: z.strictObject({
    "@type": z.literal("PostalAddress"),
    addressLocality: z.string().min(1),
    addressCountry: z.string().length(2),
  }),
  areaServed: z.array(
    z.strictObject({ "@type": z.enum(["Country", "Place"]), name: z.string().min(1) }),
  ),
  sameAs: z.array(z.url()).optional(),
  knowsAbout: z.array(z.string().min(1)).min(1).optional(),
  knowsLanguage: z.array(z.string().min(2)).min(1).optional(),
  worksFor: z
    .strictObject({ "@type": z.literal("Organization"), name: z.string().min(1) })
    .optional(),
  alumniOf: z
    .array(
      z.strictObject({ "@type": z.literal("EducationalOrganization"), name: z.string().min(1) }),
    )
    .optional(),
  hasCredential: z
    .array(
      z.strictObject({
        "@type": z.literal("EducationalOccupationalCredential"),
        name: z.string().min(1),
        recognizedBy: z
          .strictObject({ "@type": z.literal("Organization"), name: z.string().min(1) })
          .optional(),
      }),
    )
    .optional(),
});

export const webSiteSchema = z.strictObject({
  "@type": z.literal("WebSite"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  inLanguage: z.string().min(2),
  publisher: z.strictObject({ "@id": z.url() }),
});

export const breadcrumbListSchema = z.strictObject({
  "@type": z.literal("BreadcrumbList"),
  itemListElement: z
    .array(
      z.strictObject({
        "@type": z.literal("ListItem"),
        position: z.number().int().positive(),
        name: z.string().min(1),
        item: z.url(),
      }),
    )
    .min(1),
});

export const faqPageSchema = z.strictObject({
  "@type": z.literal("FAQPage"),
  mainEntity: z
    .array(
      z.strictObject({
        "@type": z.literal("Question"),
        name: z.string().min(1),
        acceptedAnswer: z.strictObject({
          "@type": z.literal("Answer"),
          text: z.string().min(1),
        }),
      }),
    )
    .min(1),
});

export const serviceSchema = z.strictObject({
  "@type": z.literal("Service"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  description: z.string().min(1),
  serviceType: z.string().min(1),
  inLanguage: z.string().min(2),
  provider: z.strictObject({ "@id": z.url() }),
});

export const profilePageSchema = z.strictObject({
  "@type": z.literal("ProfilePage"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  description: z.string().min(1),
  inLanguage: z.string().min(2),
  dateModified: z.iso.date().optional(),
  isPartOf: z.strictObject({ "@id": z.url() }),
  mainEntity: z.strictObject({ "@id": z.url() }),
});

export const offerSchema = z.strictObject({
  "@type": z.literal("Offer"),
  name: z.string().min(1),
  description: z.string().min(1),
  itemOffered: z.strictObject({
    "@type": z.literal("Service"),
    name: z.string().min(1),
  }),
});

export const professionalServiceSchema = z.strictObject({
  "@type": z.literal("ProfessionalService"),
  "@id": z.url(),
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.url(),
  inLanguage: z.string().min(2),
  provider: z.strictObject({ "@id": z.url() }),
  areaServed: z.array(
    z.strictObject({ "@type": z.enum(["Country", "Place"]), name: z.string().min(1) }),
  ),
  hasOfferCatalog: z.strictObject({
    "@type": z.literal("OfferCatalog"),
    name: z.string().min(1),
    itemListElement: z.array(offerSchema).min(1),
  }),
});

export const contactPageSchema = z.strictObject({
  "@type": z.literal("ContactPage"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  description: z.string().min(1),
  inLanguage: z.string().min(2),
  isPartOf: z.strictObject({ "@id": z.url() }),
  about: z.strictObject({ "@id": z.url() }),
});

export const jsonLdNodeSchema = z.discriminatedUnion("@type", [
  personSchema,
  profilePageSchema,
  webSiteSchema,
  breadcrumbListSchema,
  faqPageSchema,
  professionalServiceSchema,
  contactPageSchema,
  serviceSchema,
]);

export const jsonLdGraphSchema = z.strictObject({
  "@context": z.literal("https://schema.org"),
  "@graph": z.array(jsonLdNodeSchema).min(1),
});

export type PersonJsonLd = z.infer<typeof personSchema>;
export type WebSiteJsonLd = z.infer<typeof webSiteSchema>;
export type ServiceJsonLd = z.infer<typeof serviceSchema>;
export type ProfilePageJsonLd = z.infer<typeof profilePageSchema>;
export type BreadcrumbListJsonLd = z.infer<typeof breadcrumbListSchema>;
export type FaqPageJsonLd = z.infer<typeof faqPageSchema>;
export type OfferJsonLd = z.infer<typeof offerSchema>;
export type ProfessionalServiceJsonLd = z.infer<typeof professionalServiceSchema>;
export type ContactPageJsonLd = z.infer<typeof contactPageSchema>;
export type JsonLdNode = z.infer<typeof jsonLdNodeSchema>;
export type JsonLdGraph = z.infer<typeof jsonLdGraphSchema>;
