import { z } from "zod";

export const personSchema = z.strictObject({
  "@type": z.literal("Person"),
  "@id": z.url(),
  name: z.string().min(1),
  alternateName: z.string().min(1),
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
});

export const webSiteSchema = z.strictObject({
  "@type": z.literal("WebSite"),
  "@id": z.url(),
  url: z.url(),
  name: z.string().min(1),
  inLanguage: z.string().min(2),
  publisher: z.strictObject({ "@id": z.url() }),
});

export const jsonLdNodeSchema = z.discriminatedUnion("@type", [personSchema, webSiteSchema]);

export const jsonLdGraphSchema = z.strictObject({
  "@context": z.literal("https://schema.org"),
  "@graph": z.array(jsonLdNodeSchema).min(1),
});

export type PersonJsonLd = z.infer<typeof personSchema>;
export type WebSiteJsonLd = z.infer<typeof webSiteSchema>;
export type JsonLdNode = z.infer<typeof jsonLdNodeSchema>;
export type JsonLdGraph = z.infer<typeof jsonLdGraphSchema>;
