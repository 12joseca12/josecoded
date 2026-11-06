import { bearer, extendAuthState, people, personById, stateFor } from "./auth.js";
import { pass, readBody, route, send } from "./registry.js";

export const freelanceProjectIds = {
  shop: "70000000-0000-4000-8000-000000000001",
  landing: "70000000-0000-4000-8000-000000000002",
  closed: "70000000-0000-4000-8000-000000000003",
};

function projectRow(overrides) {
  return {
    brief: null,
    phase: "discover",
    status: "active",
    started_at: null,
    due_at: null,
    archived_at: null,
    created_at: "2026-10-01T09:00:00+00:00",
    done: 0,
    total: 0,
    percent: 0,
    ...overrides,
  };
}

const shop = projectRow({
  id: freelanceProjectIds.shop,
  name: "Tienda de Carla",
  brief: "Tienda pequeña con catálogo y contacto.",
  phase: "build",
  due_at: "2026-12-15",
  done: 2,
  total: 8,
  percent: 25,
});

const landing = projectRow({
  id: freelanceProjectIds.landing,
  name: "Landing de la academia",
  phase: "design",
  created_at: "2026-10-20T09:00:00+00:00",
});

const closed = projectRow({
  id: freelanceProjectIds.closed,
  name: "Prueba: landing cerrada",
  phase: "maintain",
  status: "closed",
  archived_at: "2026-09-30T09:00:00+00:00",
  created_at: "2026-08-01T09:00:00+00:00",
  done: 4,
  total: 4,
  percent: 100,
});

const modes = {
  none: [],
  one: [shop],
  two: [shop, landing],
  history: [shop, closed],
  closedOnly: [closed],
};

const freelanceId = people["freelance@example.com"].id;
const clientId = people["client@example.com"].id;
const joseId = people["enrolled@example.com"].id;

function taskRow(n, title, phase, status, kind, extra = {}) {
  return {
    id: `71000000-0000-4000-8000-00000000000${n}`,
    project_id: freelanceProjectIds.shop,
    phase,
    title,
    description: null,
    status,
    story_id: null,
    sort: n,
    done_at: status === "done" ? "2026-10-20T09:00:00+00:00" : null,
    created_at: "2026-10-01T09:00:00+00:00",
    updated_at: "2026-10-01T09:00:00+00:00",
    assigned_to_me: kind === "me",
    assignee_kind: kind,
    assignee_id: null,
    done_by: null,
    ...extra,
  };
}

function documentRow(n, name, visibility, uploader, uploadedBy) {
  return {
    id: `73000000-0000-4000-8000-00000000000${n}`,
    project_id: freelanceProjectIds.shop,
    name,
    mime: name.endsWith(".png")
      ? "image/png"
      : name.endsWith(".pdf")
        ? "application/pdf"
        : "text/plain",
    size_bytes: 2048 * n,
    storage_path: `projects/${freelanceProjectIds.shop}/73000000-0000-4000-8000-00000000000${n}`,
    visibility,
    created_at: `2026-10-0${n}T09:00:00+00:00`,
    uploaded_by: null,
    uploaded_by_me: uploader === "me",
    uploader,
    deleted_at: null,
    owner: uploadedBy,
  };
}

function seedData() {
  return {
    tasks: [
      taskRow(1, "Maquetar la portada", "design", "doing", "me"),
      taskRow(2, "Preparar el catálogo", "build", "todo", "me"),
      taskRow(3, "Enviar el logotipo", "build", "todo", "client"),
      taskRow(4, "Revisar textos", "build", "todo", "none"),
    ],
    documents: [
      documentRow(1, "Notas del equipo.txt", "team", "jose", joseId),
      documentRow(2, "Entrega portada.pdf", "client", "me", freelanceId),
    ],
    hiddenDocuments: [
      documentRow(3, "Contrato firmado.pdf", "client", "jose", joseId),
      documentRow(4, "Logotipo del cliente.png", "client", "team", clientId),
    ],
    links: [
      {
        id: "72000000-0000-4000-8000-000000000001",
        project_id: freelanceProjectIds.shop,
        name: "Versión de pruebas",
        url: "https://staging.example.com/tienda",
        usage: "Aquí ves el avance.",
        sort: 0,
        created_at: "2026-10-02T09:00:00+00:00",
      },
    ],
  };
}

extendAuthState((state) => {
  state.freelance = { mode: "none", error: null, taskError: null, ...seedData() };
  state.calls.freelanceRpc = [];
});

route("POST", "/__freelance/mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").freelance,
    JSON.parse(await readBody(request)),
  );
  return send(response, 200, { ok: true });
});

function scope(request, response) {
  const session = bearer(request);
  if (!session) {
    send(response, 401, { code: "PGRST301", message: "JWT invalid" });
    return null;
  }
  const person = personById(session.userId)?.[1];
  if (person?.role !== "freelance") return pass;
  if (session.level !== "aal2") {
    send(response, 200, []);
    return null;
  }
  return { session, state: session.auth.freelance };
}

export function freelanceRoute(method, path, handler) {
  route(method, path, (context) => {
    const scoped = scope(context.request, context.response);
    if (scoped === null) return undefined;
    if (scoped === pass) return pass;
    return handler({ ...context, scoped });
  });
}

export function failing(response, state, table) {
  if (state.error !== table && state.error !== "all") return false;
  send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  return true;
}

export function visibleProjects(state) {
  return modes[state.mode] ?? [];
}

export function matches(row, key, raw) {
  const [operator, ...rest] = raw.split(".");
  const value = rest.join(".");
  const actual = row[key];
  if (operator === "eq") return String(actual) === value;
  if (operator === "neq") return String(actual) !== value;
  if (operator === "is") return value === "null" ? actual === null || actual === undefined : true;
  if (operator === "in") {
    return value
      .replace(/^\(|\)$/g, "")
      .split(",")
      .includes(String(actual));
  }
  return true;
}

export function query(rows, url) {
  const reserved = new Set(["select", "order", "limit", "offset"]);
  let result = rows.filter((row) =>
    [...url.searchParams.entries()].every(
      ([key, raw]) => reserved.has(key) || matches(row, key, raw),
    ),
  );
  const order = url.searchParams.getAll("order").flatMap((spec) => spec.split(","));
  for (const spec of [...order].reverse()) {
    const [column, direction = "asc"] = spec.split(".");
    const factor = direction === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const left = a[column] ?? "";
      const right = b[column] ?? "";
      return left < right ? -factor : left > right ? factor : 0;
    });
  }
  const limit = Number(url.searchParams.get("limit") ?? 0);
  return limit > 0 ? result.slice(0, limit) : result;
}

freelanceRoute("GET", "/rest/v1/freelance_projects", ({ response, url, scoped }) => {
  if (failing(response, scoped.state, "projects")) return undefined;
  return send(response, 200, query(visibleProjects(scoped.state), url));
});

freelanceRoute("GET", "/rest/v1/project_tasks", ({ response, url, scoped }) => {
  if (failing(response, scoped.state, "tasks")) return undefined;
  const open = visibleProjects(scoped.state).some((entry) => entry.id === freelanceProjectIds.shop);
  return send(response, 200, query(open ? scoped.state.tasks : [], url));
});

freelanceRoute("GET", "/rest/v1/project_documents", ({ response, url, scoped }) => {
  if (failing(response, scoped.state, "documents")) return undefined;
  const open = visibleProjects(scoped.state).some((entry) => entry.id === freelanceProjectIds.shop);
  const rows = open ? [...scoped.state.documents, ...uploads] : [];
  return send(
    response,
    200,
    query(
      rows.filter((row) => row.deleted_at === null),
      url,
    ),
  );
});

freelanceRoute("GET", "/rest/v1/project_links", ({ response, url, scoped }) => {
  if (failing(response, scoped.state, "links")) return undefined;
  const open = visibleProjects(scoped.state).some((entry) => entry.id === freelanceProjectIds.shop);
  return send(response, 200, query(open ? scoped.state.links : [], url));
});

freelanceRoute("GET", "/rest/v1/stories", ({ response }) => send(response, 200, []));

freelanceRoute("POST", "/rest/v1/rpc/set_my_task_status", async ({ request, response, scoped }) => {
  const body = JSON.parse(await readBody(request));
  scoped.session.auth.calls.freelanceRpc.push({ name: "set_my_task_status", args: body });
  const found = scoped.state.tasks.find((entry) => entry.id === body.p_id);
  if (scoped.state.taskError === "stale" || !found) {
    return send(response, 400, {
      code: "P0001",
      message: "task_not_found",
      details: null,
      hint: null,
    });
  }
  if (scoped.state.taskError === "error") {
    return send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  }
  if (found.assignee_kind !== "me") {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  found.status = body.p_status;
  found.done_at = body.p_status === "done" ? new Date().toISOString() : null;
  return send(response, 204, "");
});

const uploads = [];

route("POST", "/__freelance/uploads", ({ response }) => {
  uploads.length = 0;
  return send(response, 200, { ok: true });
});

route("POST", "/rest/v1/rpc/register_document", async ({ request, response }) => {
  if (request.headers.authorization !== "Bearer test-service-role-key") return pass;
  const args = JSON.parse(await readBody(request));
  if (!Object.values(freelanceProjectIds).includes(args.p_project_id)) return pass;
  if (args.p_uploaded_by === freelanceId && args.p_visibility !== "client") {
    return send(response, 400, {
      code: "P0001",
      message: "visibility_not_allowed",
      details: null,
      hint: null,
    });
  }
  const id = args.p_path.split("/")[2];
  uploads.push({
    id,
    project_id: args.p_project_id,
    name: args.p_name,
    mime: args.p_mime,
    size_bytes: args.p_size,
    storage_path: args.p_path,
    visibility: args.p_visibility,
    created_at: new Date().toISOString(),
    uploaded_by: null,
    uploaded_by_me: true,
    uploader: "me",
    deleted_at: null,
    owner: null,
    registeredVisibility: args.p_visibility,
  });
  return send(response, 200, JSON.stringify(id));
});

freelanceRoute("POST", "/rest/v1/rpc/delete_document", async ({ request, response, scoped }) => {
  const body = JSON.parse(await readBody(request));
  const found = [...scoped.state.documents, ...uploads].find((row) => row.id === body.p_id);
  if (!found || found.deleted_at !== null) {
    return send(response, 400, {
      code: "P0001",
      message: "document_not_found",
      details: null,
      hint: null,
    });
  }
  if (!found.uploaded_by_me) {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  found.deleted_at = new Date().toISOString();
  return send(response, 200, JSON.stringify(found.storage_path));
});

route("GET", "/__freelance/uploads", ({ response }) => send(response, 200, uploads));
