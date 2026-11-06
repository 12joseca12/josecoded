import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { pass, readBody, route, send } from "./registry.js";

const clientId = "00000000-0000-4000-8000-0000000000d1";
const joseId = "00000000-0000-4000-8000-0000000000a1";
const freelanceId = "00000000-0000-4000-8000-0000000000f2";
const firstId = "d0000000-0000-4000-8000-000000000001";
const secondId = "10000000-0000-4000-8000-000000000002";

const projects = {
  [firstId]: {
    id: firstId,
    name: "Web de la panadería",
    phase: "build",
    status: "active",
    offer_slug: "web-negocio",
    due_at: "2026-12-15",
    created_at: "2026-10-20T09:00:00+00:00",
  },
  [secondId]: {
    id: secondId,
    name: "Tienda de cerámica",
    phase: "discover",
    status: "active",
    offer_slug: null,
    due_at: null,
    created_at: "2026-09-01T09:00:00+00:00",
  },
};

const modes = { none: [], one: [firstId], two: [firstId, secondId] };

function seedData() {
  return {
    tasks: [
      task(
        "t1",
        firstId,
        "discover",
        "Reunión de arranque",
        "done",
        null,
        0,
        "2026-10-21T10:00:00+00:00",
      ),
      task(
        "t2",
        firstId,
        "discover",
        "Enviar logotipo y textos",
        "done",
        clientId,
        1,
        "2026-10-25T10:00:00+00:00",
      ),
      task("t3", firstId, "design", "Aprobar la maqueta de la portada", "todo", clientId, 0, null, {
        description: "Revisa la maqueta y dime si te encaja.\nPuedes dejar comentarios en el chat.",
        story_id: id("s", 2),
      }),
      task("t4", firstId, "build", "Catálogo de productos", "doing", freelanceId, 0),
      task("t5", firstId, "publish", "Conectar el dominio", "todo", clientId, 0),
    ],
    stories: [
      story(
        "s1",
        firstId,
        "Área de pedidos",
        "in_review",
        12,
        480,
        "Queda fuera del alcance acordado.",
        "2026-11-03T10:00:00+00:00",
      ),
      story(
        "s2",
        firstId,
        "Página de contacto",
        "in_tasks",
        null,
        null,
        null,
        "2026-11-01T10:00:00+00:00",
        { task_id: id("t", 3) },
      ),
      story("s3", firstId, "Buscador de productos", "proposed", null, null, null, null, {
        created_at: "2026-11-04T09:00:00+00:00",
      }),
    ],
    linkRows: [
      link(
        "l1",
        firstId,
        "Versión de pruebas",
        "https://staging.example.com/panaderia",
        "Aquí ves el avance antes de publicar.",
        0,
      ),
      link("l2", firstId, "Diseño en Figma", "https://www.figma.com/file/abc", null, 1),
    ],
    documents: [
      document(1, "Presupuesto.pdf", "client", joseId, "2026-10-30T10:00:00+00:00"),
      document(2, "Notas internas.txt", "team", joseId, "2026-11-02T10:00:00+00:00"),
      document(3, "Logotipo.png", "client", clientId, "2026-11-01T10:00:00+00:00"),
      document(4, "Maqueta de la portada.pdf", "client", freelanceId, "2026-11-04T10:00:00+00:00"),
    ],
    updates: [
      {
        id: id("u", 1),
        project_id: firstId,
        task_id: null,
        body: "Hemos terminado el catálogo de productos.",
        created_at: "2026-11-05T10:00:00+00:00",
        author_label: "team",
      },
      {
        id: id("u", 2),
        project_id: firstId,
        task_id: null,
        body: "Esta semana cerramos el diseño de la portada.",
        created_at: "2026-11-03T10:00:00+00:00",
        author_label: "jose",
      },
    ],
  };
}

function document(n, name, visibility, uploadedBy, createdAt) {
  return {
    id: id("d", n),
    project_id: firstId,
    uploaded_by: uploadedBy,
    name,
    mime: name.endsWith(".png")
      ? "image/png"
      : name.endsWith(".pdf")
        ? "application/pdf"
        : "text/plain",
    size_bytes: 2048 * n,
    storage_path: `projects/${firstId}/${id("d", n)}`,
    visibility,
    created_at: createdAt,
    deleted_at: null,
  };
}

function id(prefix, n) {
  const hex = { t: "21", s: "22", l: "23", d: "24", u: "25" }[prefix];
  return `${hex}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function task(key, projectId, phase, title, status, assignee, sort, doneAt = null, extra = {}) {
  return {
    description: null,
    story_id: null,
    id: id("t", Number(key.slice(1))),
    project_id: projectId,
    phase,
    title,
    status,
    assignee_id: assignee,
    sort,
    done_at: doneAt,
    ...extra,
  };
}

function story(key, projectId, title, status, hours, amount, note, decidedAt, extra = {}) {
  return {
    id: id("s", Number(key.slice(1))),
    project_id: projectId,
    author_id: clientId,
    title,
    status,
    as_a: "dueña de la panadería",
    i_want: `poder usar ${title.toLowerCase()}`,
    so_that: "ahorrar tiempo cada día",
    criteria: ["Funciona en móvil", "Es fácil de entender"],
    estimate_hours: hours,
    estimate_amount: amount,
    decision_note: note,
    decided_at: decidedAt,
    task_id: null,
    created_at: "2026-10-28T09:00:00+00:00",
    ...extra,
  };
}

function link(key, projectId, name, url, usage, sort) {
  return {
    id: id("l", Number(key.slice(1))),
    project_id: projectId,
    name,
    url,
    usage,
    sort,
    created_at: "2026-10-22T09:00:00+00:00",
  };
}

extendAuthState((state) => {
  state.area = {
    mode: "none",
    error: null,
    rpcError: null,
    storyError: null,
    links: true,
    ...seedData(),
  };
  state.calls.projects = 0;
  state.calls.areaRpc = [];
});

route("POST", "/__area/mode", async ({ request, response, url }) => {
  Object.assign(
    stateFor(url.searchParams.get("tag") ?? "").area,
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
  const area = session.auth.area;
  const person = personById(session.userId)?.[1];
  if (person?.role !== "client") return pass;
  return { session, area, visible: modes[area.mode] };
}

function areaRoute(method, path, handler) {
  route(method, path, (context) => {
    const scoped = scope(context.request, context.response);
    if (scoped === null) return undefined;
    if (scoped === pass) return pass;
    return handler({ ...context, scoped });
  });
}

function fail(response, area, table) {
  if (area.error !== table && area.error !== "all") return false;
  send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  return true;
}

function matches(row, key, raw) {
  const [operator, ...rest] = raw.split(".");
  const value = rest.join(".");
  const actual = row[key];
  if (operator === "eq") return String(actual) === value;
  if (operator === "neq") return String(actual) !== value;
  if (operator === "is") return value === "null" ? actual === null || actual === undefined : true;
  if (operator === "not") {
    const [inner, ...tail] = rest;
    return inner === "is" && tail.join(".") === "null"
      ? actual !== null && actual !== undefined
      : true;
  }
  return true;
}

function query(rows, url) {
  const reserved = new Set(["select", "order", "limit"]);
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

areaRoute("GET", "/rest/v1/projects", ({ response, url, scoped }) => {
  scoped.session.auth.calls.projects += 1;
  if (fail(response, scoped.area, "projects")) return;
  return send(
    response,
    200,
    query(
      scoped.visible.map((projectId) => projects[projectId]),
      url,
    ),
  );
});

function inProjects(scoped, rows) {
  return rows.filter((row) => scoped.visible.includes(row.project_id));
}

areaRoute("GET", "/rest/v1/project_progress", ({ response, url, scoped }) => {
  if (fail(response, scoped.area, "progress")) return undefined;
  const rows = scoped.visible.map((projectId) => {
    const tasks = scoped.area.tasks.filter((entry) => entry.project_id === projectId);
    const done = tasks.filter((entry) => entry.status === "done").length;
    return {
      project_id: projectId,
      done,
      total: tasks.length,
      percent: tasks.length === 0 ? 0 : Math.round((100 * done) / tasks.length),
    };
  });
  return send(response, 200, query(rows, url));
});

areaRoute("GET", "/rest/v1/project_tasks", ({ response, url, scoped }) => {
  if (fail(response, scoped.area, "tasks")) return undefined;
  const me = scoped.session.userId;
  const rows = inProjects(scoped, scoped.area.tasks).map((row) => {
    const assignee = row.assignee_id;
    const visible = { ...row, assigned_to_me: assignee === me };
    delete visible.assignee_id;
    visible.assignee_kind = assignee === null ? "none" : assignee === me ? "me" : "team";
    return visible;
  });
  return send(response, 200, query(rows, url));
});

areaRoute("GET", "/rest/v1/stories", ({ response, url, scoped }) => {
  if (fail(response, scoped.area, "stories")) return undefined;
  return send(response, 200, query(inProjects(scoped, scoped.area.stories), url));
});

areaRoute("GET", "/rest/v1/project_links", ({ response, url, scoped }) => {
  if (fail(response, scoped.area, "links")) return undefined;
  const rows = scoped.area.links ? inProjects(scoped, scoped.area.linkRows) : [];
  return send(response, 200, query(rows, url));
});

const uploads = [];
let uploadMode = "ok";

route("POST", "/__area/uploads", async ({ request, response }) => {
  uploadMode = JSON.parse(await readBody(request)).mode;
  uploads.length = 0;
  return send(response, 200, { ok: true });
});

function visibleDocuments(scoped) {
  return inProjects(scoped, [...scoped.area.documents, ...uploads]).filter(
    (row) => row.visibility === "client" && row.deleted_at === null,
  );
}

areaRoute("GET", "/rest/v1/project_documents", ({ url, response, scoped }) => {
  if (fail(response, scoped.area, "documents")) return undefined;
  const me = scoped.session.userId;
  const rows = visibleDocuments(scoped).map((row) => {
    const uploader = row.uploaded_by;
    return {
      ...row,
      uploaded_by: null,
      uploaded_by_me: uploader === me,
      uploader: uploader === me ? "me" : uploader === joseId ? "jose" : "team",
    };
  });
  return send(response, 200, query(rows, url));
});

areaRoute("GET", "/rest/v1/client_project_updates", ({ url, response, scoped }) => {
  if (fail(response, scoped.area, "updates")) return undefined;
  return send(response, 200, query(inProjects(scoped, scoped.area.updates), url));
});

route("POST", "/rest/v1/rpc/register_document", async ({ request, response }) => {
  if (request.headers.authorization !== "Bearer test-service-role-key") return pass;
  const args = JSON.parse(await readBody(request));
  if (!Object.keys(projects).includes(args.p_project_id)) return pass;
  if (uploadMode === "quota") {
    return send(response, 400, {
      code: "P0001",
      message: "project_quota_exceeded",
      details: null,
      hint: null,
    });
  }
  const stored = {
    id: args.p_path.split("/")[2],
    project_id: args.p_project_id,
    uploaded_by: args.p_uploaded_by,
    name: args.p_name,
    mime: args.p_mime,
    size_bytes: args.p_size,
    storage_path: args.p_path,
    visibility: args.p_visibility,
    created_at: new Date().toISOString(),
    deleted_at: null,
  };
  uploads.push(stored);
  return send(response, 200, JSON.stringify(stored.id));
});

areaRoute("POST", "/rest/v1/rpc/delete_document", async ({ request, response, scoped }) => {
  const body = JSON.parse(await readBody(request));
  const found = [...scoped.area.documents, ...uploads].find((row) => row.id === body.p_id);
  if (!found || found.deleted_at !== null) {
    return send(response, 400, {
      code: "P0001",
      message: "document_not_found",
      details: null,
      hint: null,
    });
  }
  if (found.uploaded_by !== scoped.session.userId) {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  found.deleted_at = new Date().toISOString();
  scoped.session.auth.calls.areaRpc.push({ name: "delete_document", args: body });
  return send(response, 200, JSON.stringify(found.storage_path));
});

areaRoute("POST", "/rest/v1/rpc/complete_my_task", async ({ request, response, scoped }) => {
  const body = JSON.parse(await readBody(request));
  scoped.session.auth.calls.areaRpc.push({ name: "complete_my_task", args: body });
  if (scoped.area.rpcError === "forbidden") {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  if (scoped.area.rpcError === "stale") {
    return send(response, 400, {
      code: "P0001",
      message: "task_not_found",
      details: null,
      hint: null,
    });
  }
  if (scoped.area.rpcError === "error") {
    return send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
  }
  const found = scoped.area.tasks.find((entry) => entry.id === body.p_id);
  if (!found) {
    return send(response, 400, {
      code: "P0001",
      message: "task_not_found",
      details: null,
      hint: null,
    });
  }
  found.status = "done";
  found.done_at = new Date().toISOString();
  return send(response, 204, "");
});

areaRoute("POST", "/rest/v1/rpc/confirm_story", async ({ request, response, scoped }) => {
  const body = JSON.parse(await readBody(request));
  scoped.session.auth.calls.areaRpc.push({ name: "confirm_story", args: body });
  if (scoped.area.rpcError === "forbidden") {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  if (scoped.area.rpcError === "stale") {
    return send(response, 400, {
      code: "P0001",
      message: "story_not_in_review",
      details: null,
      hint: null,
    });
  }
  const found = scoped.area.stories.find((entry) => entry.id === body.p_id);
  if (!found || found.status !== "in_review") {
    return send(response, 400, {
      code: "P0001",
      message: "story_not_in_review",
      details: null,
      hint: null,
    });
  }
  found.status = body.p_accept === false ? "rejected" : "accepted";
  return send(response, 200, JSON.stringify(found.status));
});

function storyFailure(response, area) {
  if (area.storyError === "forbidden") {
    send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
    return true;
  }
  if (area.storyError === "error") {
    send(response, 500, { code: "XX000", message: "boom", details: null, hint: null });
    return true;
  }
  return false;
}

function applyFilter(rows, url) {
  return rows.filter((row) =>
    [...url.searchParams.entries()].every(
      ([key, raw]) => ["select", "order", "limit"].includes(key) || matches(row, key, raw),
    ),
  );
}

areaRoute("POST", "/rest/v1/stories", async ({ request, response, scoped }) => {
  if (storyFailure(response, scoped.area)) return undefined;
  const body = JSON.parse(await readBody(request));
  scoped.session.auth.calls.areaRpc.push({ name: "stories.insert", args: body });
  if (!scoped.visible.includes(body.project_id)) {
    return send(response, 403, { code: "42501", message: "forbidden", details: null, hint: null });
  }
  const number = scoped.area.stories.length + 1;
  const created = story(
    `s${number}`,
    body.project_id,
    body.title,
    "proposed",
    null,
    null,
    null,
    null,
    {
      as_a: body.as_a,
      i_want: body.i_want,
      so_that: body.so_that,
      criteria: body.criteria,
      created_at: new Date().toISOString(),
    },
  );
  scoped.area.stories.push(created);
  return send(response, 201, { id: created.id });
});

areaRoute("PATCH", "/rest/v1/stories", async ({ request, response, url, scoped }) => {
  if (storyFailure(response, scoped.area)) return undefined;
  const body = JSON.parse(await readBody(request));
  scoped.session.auth.calls.areaRpc.push({ name: "stories.update", args: body });
  const rows = applyFilter(inProjects(scoped, scoped.area.stories), url);
  for (const row of rows) Object.assign(row, body);
  return send(
    response,
    200,
    rows.map((row) => ({ id: row.id })),
  );
});

areaRoute("DELETE", "/rest/v1/stories", ({ response, url, scoped }) => {
  if (storyFailure(response, scoped.area)) return undefined;
  const rows = applyFilter(inProjects(scoped, scoped.area.stories), url);
  scoped.session.auth.calls.areaRpc.push({ name: "stories.delete", args: {} });
  scoped.area.stories = scoped.area.stories.filter((row) => !rows.includes(row));
  return send(
    response,
    200,
    rows.map((row) => ({ id: row.id })),
  );
});
