import openNext from "../.open-next/worker.js";
import { buildCronRequest } from "../src/lib/outbox/schedule.ts";

export * from "../.open-next/worker.js";

const worker = {
  fetch: openNext.fetch,
  scheduled(_controller, env, ctx) {
    const request = buildCronRequest(env);
    if (request === null) return;
    ctx.waitUntil(openNext.fetch(request, env, ctx));
  },
};

export default worker;
