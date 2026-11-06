import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const stamp = "2026-11-05T09:00:00+00:00";

const defaults = {
  "availability.from": null,
  "availability.next_project_month": null,
  "availability.weekly_hours": null,
  "billing.vat_rate": 21,
  blog: true,
  cv_download: true,
  google_sign_in: false,
  lab: false,
  maintenance: { on: false },
  "nexo.reply_delay_min": 10,
  "payout.default_cadence": "biweekly",
  projects: true,
  public_chat: false,
  search: false,
  show_prices: true,
};

const longError = `Prueba: la fuente no responde. ${"timeout tras 30 s. ".repeat(12)}`;

const seededJobs = [
  {
    id: "50000000-0000-4000-8000-000000000003",
    kind: "notify.send",
    status: "queued",
    attempts: 0,
    max_attempts: 3,
    run_after: "2026-11-05T12:05:00+00:00",
    error: null,
    created_at: "2026-11-05T11:59:00+00:00",
    finished_at: null,
  },
  {
    id: "50000000-0000-4000-8000-000000000005",
    kind: "radar.draft",
    status: "failed",
    attempts: 3,
    max_attempts: 3,
    run_after: "2026-11-05T11:30:00+00:00",
    error: "Prueba: respuesta del modelo vacía",
    created_at: "2026-11-05T11:20:00+00:00",
    finished_at: "2026-11-05T11:40:00+00:00",
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    kind: "radar.scan",
    status: "failed",
    attempts: 3,
    max_attempts: 3,
    run_after: "2026-11-05T10:00:00+00:00",
    error: longError,
    created_at: "2026-11-05T10:00:00+00:00",
    finished_at: "2026-11-05T10:10:00+00:00",
  },
  {
    id: "50000000-0000-4000-8000-000000000001",
    kind: "rag.index",
    status: "done",
    attempts: 1,
    max_attempts: 3,
    run_after: "2026-11-05T09:00:00+00:00",
    error: null,
    created_at: "2026-11-05T09:00:00+00:00",
    finished_at: "2026-11-05T09:01:00+00:00",
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    kind: "chat.summary",
    status: "cancelled",
    attempts: 0,
    max_attempts: 3,
    run_after: "2026-11-04T09:00:00+00:00",
    error: null,
    created_at: "2026-11-04T09:00:00+00:00",
    finished_at: "2026-11-04T09:00:00+00:00",
  },
];

const heartbeatAgeMinutes = { live: 0.5, slow: 5, down: 30 };

function freshSystem() {
  return {
    settings: "data",
    omen: "none",
    jobs: "data",
    save: "ok",
    jobAction: "ok",
    values: structuredClone(defaults),
    stamps: {},
    list: structuredClone(seededJobs),
  };
}

extendAuthState((state) => {
  state.calls.system = [];
  state.system = freshSystem();
});

export function admin(request) {
  const session = bearer(request);
  if (!session) return { denied: "unauthenticated" };
  const allowed = personById(session.userId)?.[1].role === "admin" && session.level === "aal2";
  return allowed ? { session } : { session, denied: "forbidden" };
}

export function deny(response, who) {
  if (who.denied === "unauthenticated") {
    return send(response, 401, { code: "PGRST301", message: "JWT invalid" });
  }
  return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
}

export function failure(response, code = "XX000", message = "internal") {
  const status = code === "XX000" ? 500 : 404;
  return send(response, status, { code, message, details: null, hint: null });
}

route("POST", "/__auth/system-mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").system,
    JSON.parse(await readBody(request)),
  );
  return send(response, 200, { ok: true });
});

route("GET", "/rest/v1/site_settings", ({ request, response, url }) => {
  const who = admin(request);
  if (who.denied === "unauthenticated") return deny(response, who);
  const { auth } = who.session;
  const system = auth.system;
  auth.calls.system.push({ name: "site_settings", level: who.session.level });
  if (system.settings === "error") return failure(response);
  if (system.settings === "missing") return failure(response, "PGRST205", "no table");
  if (who.denied) return send(response, 200, []);
  const rows = Object.entries(system.values).map(([key, value]) => ({
    key,
    value,
    updated_at: system.stamps[key] ?? stamp,
  }));
  const wanted = /^eq\.(.+)$/.exec(url.searchParams.get("key") ?? "")?.[1];
  return send(response, 200, wanted ? rows.filter((row) => row.key === wanted) : rows);
});

route("POST", "/rest/v1/rpc/omen_status", ({ request, response }) => {
  const who = admin(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const system = auth.system;
  auth.calls.system.push({ name: "omen_status", level: who.session.level });
  if (system.omen === "error") return failure(response);
  if (system.omen === "missing") return failure(response, "PGRST202", "no function");
  const counts = {
    queued: system.list.filter((job) => job.status === "queued").length,
    running: system.list.filter((job) => job.status === "running").length,
    failed: system.list.filter((job) => job.status === "failed").length,
  };
  const age = heartbeatAgeMinutes[system.omen];
  if (age === undefined) {
    return send(response, 200, { seen_at: null, version: null, models: [], ...counts });
  }
  return send(response, 200, {
    seen_at: new Date(Date.now() - age * 60_000).toISOString(),
    version: "1.4.2",
    models: ["qwen2.5", "llama3.2"],
    ...counts,
  });
});

route("POST", "/rest/v1/rpc/admin_jobs", async ({ request, response }) => {
  const who = admin(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const system = auth.system;
  const args = JSON.parse((await readBody(request)) || "{}");
  auth.calls.system.push({ name: "admin_jobs", args, level: who.session.level });
  if (system.jobs === "error") return failure(response);
  if (system.jobs === "missing") return failure(response, "PGRST202", "no function");
  if (system.jobs === "empty") return send(response, 200, []);
  const rows = system.list.filter((job) => !args.p_status || job.status === args.p_status);
  return send(response, 200, rows);
});

route("POST", "/rest/v1/rpc/set_setting", async ({ request, response }) => {
  const who = admin(request);
  if (who.denied) return deny(response, who);
  const { auth } = who.session;
  const system = auth.system;
  const args = JSON.parse(await readBody(request));
  auth.calls.system.push({ name: "set_setting", args, level: who.session.level });
  if (system.save === "error") return failure(response);
  if (system.save === "invalid" || !(args.p_key in system.values)) {
    const message =
      args.p_key in system.values ? "setting_value_invalid" : "setting_key_not_allowed";
    return send(response, 400, { code: "P0001", message, details: null, hint: null });
  }
  const updated = new Date().toISOString();
  system.values[args.p_key] = args.p_value;
  system.stamps[args.p_key] = updated;
  return send(response, 200, JSON.stringify(updated));
});

for (const name of ["retry_job", "cancel_job"]) {
  route("POST", `/rest/v1/rpc/${name}`, async ({ request, response }) => {
    const who = admin(request);
    if (who.denied) return deny(response, who);
    const { auth } = who.session;
    const system = auth.system;
    const args = JSON.parse(await readBody(request));
    auth.calls.system.push({ name, args, level: who.session.level });
    if (system.jobAction === "error") return failure(response);
    const job = system.list.find((entry) => entry.id === args.p_id);
    const allowed = name === "retry_job" ? ["failed", "cancelled"] : ["queued"];
    if (system.jobAction === "stale" || !job || !allowed.includes(job.status)) {
      const message = !job
        ? "job_not_found"
        : name === "retry_job"
          ? "job_not_retryable"
          : "job_not_cancellable";
      return send(response, 400, { code: "P0001", message, details: null, hint: null });
    }
    job.status = name === "retry_job" ? "queued" : "cancelled";
    job.error = null;
    if (name === "retry_job") job.attempts = 0;
    return send(response, 200, JSON.stringify(job.status));
  });
}
