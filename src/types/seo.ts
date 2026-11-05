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

const idRef = z.strictObject({ "@id": z.url() });

export const blogJsonLdSchema = z.strictObject({
  "@type": z.literal("Blog"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  description: z.string().min(1),
  inLanguage: z.string().min(2),
  publisher: idRef,
  author: idRef,
});

export const itemListSchema = z.strictObject({
  "@type": z.literal("ItemList"),
  "@id": z.url(),
  itemListElement: z.array(
    z.strictObject({
      "@type": z.literal("ListItem"),
      position: z.number().int().positive(),
      url: z.url(),
      name: z.string().min(1),
    }),
  ),
});

export const blogPostingSchema = z.strictObject({
  "@type": z.literal("BlogPosting"),
  "@id": z.url(),
  url: z.url(),
  headline: z.string().min(1),
  description: z.string().min(1),
  inLanguage: z.string().min(2),
  datePublished: z.iso.date(),
  dateModified: z.iso.date(),
  articleSection: z.string().min(1),
  wordCount: z.number().int().positive(),
  mainEntityOfPage: z.strictObject({ "@type": z.literal("WebPage"), "@id": z.url() }),
  author: idRef,
  publisher: idRef,
  isPartOf: idRef,
});

export const jsonLdNodeSchema = z.discriminatedUnion("@type", [
  personSchema,
  profilePageSchema,
  webSiteSchema,
  breadcrumbListSchema,
  faqPageSchema,
  blogJsonLdSchema,
  itemListSchema,
  blogPostingSchema,
]);

export const jsonLdGraphSchema = z.strictObject({
  "@context": z.literal("https://schema.org"),
  "@graph": z.array(jsonLdNodeSchema).min(1),
});

export type PersonJsonLd = z.infer<typeof personSchema>;
export type WebSiteJsonLd = z.infer<typeof webSiteSchema>;
export type ProfilePageJsonLd = z.infer<typeof profilePageSchema>;
export type BreadcrumbListJsonLd = z.infer<typeof breadcrumbListSchema>;
export type FaqPageJsonLd = z.infer<typeof faqPageSchema>;
export type BlogJsonLd = z.infer<typeof blogJsonLdSchema>;
export type ItemListJsonLd = z.infer<typeof itemListSchema>;
export type BlogPostingJsonLd = z.infer<typeof blogPostingSchema>;
export type JsonLdNode = z.infer<typeof jsonLdNodeSchema>;
export type JsonLdGraph = z.infer<typeof jsonLdGraphSchema>;
