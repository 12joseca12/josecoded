import { headers } from "next/headers";

import { ChatInvite } from "@/components/chat/ChatInvite/ChatInvite";
import { RouteSuggestion } from "@/components/site/RouteSuggestion/RouteSuggestion";
import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { features } from "@/config/features";
import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";
import { getTranslator } from "@/i18n/messages";
import { requestPathHeader } from "@/lib/auth/guards";
import { suggestRoute } from "@/lib/errors/suggest-route";
import { getFeatures } from "@/lib/settings/features";

export default async function NotFound() {
  const pathname = (await headers()).get(requestPathHeader) ?? "";
  const [t, { chat }] = await Promise.all([getTranslator(defaultLocale), getFeatures()]);
  const suggestion = suggestRoute(pathname, { projects: features.projects });

  return (
    <ErrorPage variant="notFound" copy={getErrorCopy(defaultLocale)}>
      {suggestion ? <RouteSuggestion locale={defaultLocale} suggestion={suggestion} /> : null}
      {chat ? (
        <ChatInvite locale={defaultLocale} label={t("chat.openChat")} hint="" variant="action" />
      ) : null}
    </ErrorPage>
  );
}
