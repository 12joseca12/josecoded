import { contactWaysSchema } from "@/types/contact";

export const contact = {
  whatsappNumber: "{{DATO: número de WhatsApp}}",
  ways: contactWaysSchema.parse([
    { way: "contratacion", email: "hola@josecoded.com" },
    { way: "freelance", email: "freelance@josecoded.com" },
    { way: "packs", email: "proyectos@josecoded.com" },
  ]),
} as const;
