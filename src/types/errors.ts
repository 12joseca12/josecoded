export const errorVariants = ["notFound", "serverError", "rateLimited", "maintenance"] as const;
export type ErrorVariant = (typeof errorVariants)[number];

export const errorCodes: Record<ErrorVariant, string> = {
  notFound: "404",
  serverError: "500",
  rateLimited: "429",
  maintenance: "503",
};

export interface ErrorActionLabels {
  home: string;
  contact: string;
  retry: string;
  retrying: string;
}

export type ErrorCopy = Record<ErrorVariant, { title: string; text: string }> & {
  actions: ErrorActionLabels;
};
