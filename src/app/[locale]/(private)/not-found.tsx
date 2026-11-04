import { SiteChrome } from "@/components/site/SiteChrome/SiteChrome";
import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";

export default function PrivateNotFound() {
  return (
    <SiteChrome locale={defaultLocale}>
      <ErrorPage variant="notFound" copy={getErrorCopy(defaultLocale)} />
    </SiteChrome>
  );
}
