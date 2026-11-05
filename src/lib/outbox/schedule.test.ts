import { describe, expect, it } from "vitest";

import { buildCronRequest, cronHeader, cronPath } from "./schedule";

describe("buildCronRequest", () => {
  it("builds nothing while sending is off or the secret is missing", () => {
    expect(buildCronRequest({})).toBeNull();
    expect(buildCronRequest({ OUTBOX_DRAIN: "off", CRON_SECRET: "s" })).toBeNull();
    expect(buildCronRequest({ OUTBOX_DRAIN: "on" })).toBeNull();
    expect(buildCronRequest({ OUTBOX_DRAIN: "on", CRON_SECRET: "  " })).toBeNull();
  });

  it("posts to the cron route of the site with the secret header", () => {
    const request = buildCronRequest({
      OUTBOX_DRAIN: "on",
      CRON_SECRET: "s3cret",
      NEXT_PUBLIC_SITE_URL: "https://josecoded-preview.josecoded-api.workers.dev/es",
    });
    expect(request?.method).toBe("POST");
    expect(request?.url).toBe(`https://josecoded-preview.josecoded-api.workers.dev${cronPath}`);
    expect(request?.headers.get(cronHeader)).toBe("s3cret");
  });

  it("falls back to the production origin without a valid site url", () => {
    const request = buildCronRequest({
      OUTBOX_DRAIN: "on",
      CRON_SECRET: "s",
      NEXT_PUBLIC_SITE_URL: "nope",
    });
    expect(request?.url).toBe(`https://josecoded.com${cronPath}`);
  });
});
