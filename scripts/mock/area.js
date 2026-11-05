import { bearer, extendAuthState, personById, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";

const clientId = "00000000-0000-4000-8000-0000000000d1";
const firstId = "10000000-0000-4000-8000-000000000001";
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
      task("t3", firstId, "design", "Aprobar la maqueta de la portada", "todo", clientId, 0),
      task("t4", firstId, "build", "Catálogo de productos", "doing", null, 0),
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
      ),
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
      {
        id: id("d", 1),
        project_id: firstId,
        name: "Presupuesto.pdf",
        visibility: "client",
        deleted_at: null,
        created_at: "2026-10-30T10:00:00+00:00",
      },
      {
        id: id("d", 2),
        project_id: firstId,
        name: "Notas internas.txt",
        visibility: "team",
        deleted_at: null,
        created_at: "2026-11-02T10:00:00+00:00",
      },
    ],
  };
}

function id(prefix, n) {
  const hex = { t: "21", s: "22", l: "23", d: "24" }[prefix];
  return `${hex}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function task(key, projectId, phase, title, status, assignee, sort, doneAt = null) {
  return {
    id: id("t", Number(key.slice(1))),
    project_id: projectId,
    phase,
    title,
    status,
    assignee_id: assignee,
    sort,
    done_at: doneAt,
  };
}

function story(key, projectId, title, status, hours, amount, note, decidedAt) {
  return {
    id: id("s", Number(key.slice(1))),
    project_id: projectId,
    author_id: clientId,
    title,
    status,
    estimate_hours: hours,
    estimate_amount: amount,
    decision_note: note,
    decided_at: decidedAt,
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
  state.area = { mode: "none", error: null, rpcError: null, links: true, ...seedData() };
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
  const visible = person?.role === "client" ? modes[area.mode] : [];
  return { session, area, visible };
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

route("GET", "/rest/v1/projects", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped) return;
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

route("GET", "/rest/v1/project_progress", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped || fail(response, scoped.area, "progress")) return;
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

route("GET", "/rest/v1/tasks", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped || fail(response, scoped.area, "tasks")) return;
  return send(response, 200, query(inProjects(scoped, scoped.area.tasks), url));
});

route("GET", "/rest/v1/stories", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped || fail(response, scoped.area, "stories")) return;
  return send(response, 200, query(inProjects(scoped, scoped.area.stories), url));
});

route("GET", "/rest/v1/project_links", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped || fail(response, scoped.area, "links")) return;
  const rows = scoped.area.links ? inProjects(scoped, scoped.area.linkRows) : [];
  return send(response, 200, query(rows, url));
});

route("GET", "/rest/v1/documents", ({ request, response, url }) => {
  const scoped = scope(request, response);
  if (!scoped || fail(response, scoped.area, "documents")) return;
  return send(response, 200, query(inProjects(scoped, scoped.area.documents), url));
});

route("POST", "/rest/v1/rpc/complete_my_task", async ({ request, response }) => {
  const scoped = scope(request, response);
  if (!scoped) return;
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

route("POST", "/rest/v1/rpc/confirm_story", async ({ request, response }) => {
  const scoped = scope(request, response);
  if (!scoped) return;
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
