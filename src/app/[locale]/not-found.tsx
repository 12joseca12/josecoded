import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";

export default function NotFound() {
  return (
    <main>
      <ErrorPage variant="notFound" copy={getErrorCopy(defaultLocale)} />
    </main>
  );
}
