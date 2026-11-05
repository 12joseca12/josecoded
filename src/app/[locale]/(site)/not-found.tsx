import { headers } from "next/headers";

import { RouteSuggestion } from "@/components/site/RouteSuggestion/RouteSuggestion";
import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { features } from "@/config/features";
import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";
import { requestPathHeader } from "@/lib/auth/guards";
import { suggestRoute } from "@/lib/errors/suggest-route";

export default async function NotFound() {
  const pathname = (await headers()).get(requestPathHeader) ?? "";
  const suggestion = suggestRoute(pathname, { projects: features.projects });

  return (
    <ErrorPage variant="notFound" copy={getErrorCopy(defaultLocale)}>
      {suggestion ? <RouteSuggestion locale={defaultLocale} suggestion={suggestion} /> : null}
    </ErrorPage>
  );
}
