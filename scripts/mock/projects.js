import { randomUUID } from "node:crypto";

import { extendAuthState, people, stateFor } from "./auth.js";
import { readBody, route, send, sendEmpty } from "./registry.js";
import { admin, deny } from "./system.js";

const clientId = people["client@example.com"].id;
const freelanceId = "00000000-0000-4000-8000-0000000000f2";
const wonDealId = "30000000-0000-4000-8000-0000000000a2";

export const projectIds = {
  shop: "60000000-0000-4000-8000-000000000001",
  landing: "60000000-0000-4000-8000-000000000002",
  closed: "60000000-0000-4000-8000-000000000003",
};

const offers = [
  { slug: "web-presencia", name_es: "Web de presencia" },
  { slug: "web-negocio", name_es: "Web de negocio" },
];

function project(overrides) {
  return {
    client_id: null,
    client_name: null,
    contact_id: null,
    deal_id: null,
    offer_slug: null,
    brief: null,
    phase: "discover",
    status: "active",
    freelance_id: null,
    freelance_name: null,
    started_at: null,
    due_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    tasks: [],
    stories: [],
    documents: [],
    links: [],
    ...overrides,
  };
}

export function taskRow(overrides) {
  return {
    description: null,
    status: "todo",
    assignee_id: null,
    story_id: null,
    sort: 0,
    done_at: null,
    done_by: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function storyRow(overrides) {
  return {
    author_id: clientId,
    status: "proposed",
    out_of_scope: false,
    estimate_hours: null,
    estimate_amount: null,
    decision_note: null,
    decided_at: null,
    confirmed_at: null,
    task_id: null,
    created_at: "2026-10-15T09:00:00+00:00",
    ...overrides,
  };
}

function documentRow(overrides) {
  return {
    uploaded_by: people["enrolled@example.com"].id,
    mime: "application/pdf",
    visibility: "client",
    deleted_at: null,
    ...overrides,
    storage_path: `projects/${overrides.project_id}/${overrides.id}`,
  };
}

function seededProjects() {
  const tasks = Array.from({ length: 8 }, (_, index) =>
    taskRow({
      id: `61000000-0000-4000-8000-00000000000${index + 1}`,
      project_id: projectIds.shop,
      phase: index < 2 ? "discover" : index < 5 ? "design" : "build",
      title: `Tarea ${index + 1}`,
      status: index < 2 ? "done" : "todo",
      sort: index < 2 ? index : index < 5 ? index - 2 : index - 5,
    }),
  );
  return [
    project({
      id: projectIds.shop,
      name: "Tienda de Carla",
      client_id: clientId,
      client_name: "Carla Client",
      contact_id: "20000000-0000-4000-8000-0000000000a2",
      deal_id: wonDealId,
      offer_slug: "web-negocio",
      brief: "Tienda pequeña con catálogo y contacto.",
      phase: "build",
      freelance_id: freelanceId,
      freelance_name: "Fran Freelance",
      started_at: "2026-10-01",
      due_at: "2026-12-15",
      created_at: "2026-10-01T09:00:00+00:00",
      tasks,
      documents: [
        documentRow({
          id: "63000000-0000-4000-8000-000000000001",
          project_id: projectIds.shop,
          name: "Contrato firmado.pdf",
          size_bytes: 482000,
          created_at: "2026-10-02T09:00:00+00:00",
        }),
        documentRow({
          id: "63000000-0000-4000-8000-000000000002",
          project_id: projectIds.shop,
          name: "Notas internas.txt",
          mime: "text/plain",
          size_bytes: 1200,
          visibility: "team",
          created_at: "2026-10-03T09:00:00+00:00",
        }),
      ],
      stories: [
        storyRow({
          id: "62000000-0000-4000-8000-000000000001",
          project_id: projectIds.shop,
          title: "Buscador de productos",
          as_a: "clienta de la tienda",
          i_want: "buscar productos por nombre",
          so_that: "encontrar lo que quiero rápido",
          criteria: ["Busca por nombre", "Avisa si no hay resultados"],
        }),
        storyRow({
          id: "62000000-0000-4000-8000-000000000002",
          project_id: projectIds.shop,
          title: "Área de pedidos",
          as_a: "clienta de la tienda",
          i_want: "ver mis pedidos anteriores",
          so_that: "repetir una compra",
          criteria: ["Lista de pedidos"],
          status: "in_review",
          out_of_scope: true,
          estimate_hours: 12,
          estimate_amount: 480,
          decision_note: "Queda fuera del alcance acordado.",
          decided_at: "2026-11-02T10:00:00+00:00",
        }),
        storyRow({
          id: "62000000-0000-4000-8000-000000000003",
          project_id: projectIds.shop,
          title: "Página de contacto",
          as_a: "visitante",
          i_want: "enviar un mensaje desde la web",
          so_that: "preguntar antes de comprar",
          criteria: [],
          status: "in_tasks",
          decided_at: "2026-10-20T10:00:00+00:00",
          task_id: "61000000-0000-4000-8000-000000000008",
        }),
      ],
    }),
    project({
      id: projectIds.landing,
      name: "Landing sin cuenta",
      offer_slug: "web-presencia",
      created_at: "2026-10-10T09:00:00+00:00",
    }),
    project({
      id: projectIds.closed,
      name: "Proyecto entregado",
      client_id: clientId,
      client_name: "Carla Client",
      phase: "maintain",
      status: "closed",
      archived_at: "2026-10-20T09:00:00+00:00",
      created_at: "2026-08-01T09:00:00+00:00",
    }),
  ];
}

extendAuthState((state) => {
  state.projects = seededProjects();
  state.projectsMode = "data";
  state.projectsRpcError = null;
  state.calls.projects = [];
});

route("POST", "/__auth/projects-mode", async ({ request, response, url }) => {
  Object.assign(stateFor(url.searchParams.get("tag") ?? ""), {
    projectsMode: JSON.parse(await readBody(request)).mode,
  });
  return send(response, 200, { ok: true });
});

route("POST", "/__auth/projects-rpc-error", async ({ request, response, url }) => {
  stateFor(url.searchParams.get("tag") ?? "").projectsRpcError = JSON.parse(
    await readBody(request),
  ).error;
  return send(response, 200, { ok: true });
});

export function overviewRow(entry) {
  const done = entry.tasks.filter((task) => task.status === "done").length;
  const total = entry.tasks.length;
  const { tasks, stories, documents, links, brief, ...visible } = entry;
  void [tasks, stories, documents, links, brief];
  return {
    ...visible,
    done,
    total,
    percent: total === 0 ? 0 : Math.round((100 * done) / total),
    stories_to_decide: entry.stories.filter((story) => story.status === "proposed").length,
  };
}

export function adminCall(request, response) {
  const who = admin(request);
  if (who.denied) {
    deny(response, who);
    return null;
  }
  return who.session.auth;
}

function failure(response, code, message) {
  return send(response, 400, { code, message, details: null, hint: null });
}

function eq(url, field) {
  return /^eq\.(.+)$/.exec(url.searchParams.get(field) ?? "")?.[1];
}

route("GET", "/rest/v1/project_overview", ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const only = eq(url, "id");
  if (auth.projectsMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (auth.projectsMode === "empty") return send(response, 200, []);
  return send(
    response,
    200,
    [...auth.projects]
      .filter((entry) => !only || entry.id === only)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(overviewRow),
  );
});

route("GET", "/rest/v1/offers", ({ request, response }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  return send(response, 200, offers);
});

route("GET", "/rest/v1/team_profiles", ({ request, response }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  return send(response, 200, [{ id: freelanceId, full_name: "Fran Freelance" }]);
});

route("POST", "/rest/v1/rpc/create_project", async ({ request, response }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const args = JSON.parse(await readBody(request));
  auth.calls.projects.push({ name: "create_project", args });
  if (auth.projectsRpcError) {
    return send(response, 400, { details: null, hint: null, ...auth.projectsRpcError });
  }
  if (args.p_deal_id && args.p_deal_id !== wonDealId) {
    return failure(response, "P0001", "deal_not_found");
  }
  const entry = project({
    id: randomUUID(),
    name: args.p_name,
    deal_id: args.p_deal_id ?? null,
    contact_id: args.p_deal_id ? "20000000-0000-4000-8000-0000000000a2" : null,
    offer_slug: args.p_offer_slug ?? null,
    brief: args.p_brief ?? null,
    freelance_id: args.p_freelance_id ?? null,
    freelance_name: args.p_freelance_id ? "Fran Freelance" : null,
    started_at: args.p_started_at ?? null,
    due_at: args.p_due_at ?? null,
  });
  auth.projects.push(entry);
  return send(response, 200, JSON.stringify(entry.id));
});

route("PATCH", "/rest/v1/projects", async ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const body = JSON.parse(await readBody(request));
  auth.calls.projects.push({ name: "update-project", body });
  if (auth.projectsRpcError) {
    return send(response, 400, { details: null, hint: null, ...auth.projectsRpcError });
  }
  const id = (url.searchParams.get("id") ?? "").replace("eq.", "");
  const entry = auth.projects.find((item) => item.id === id);
  if (!entry) return send(response, 200, []);
  Object.assign(entry, body);
  return send(response, 200, [{ id }]);
});

route("GET", "/rest/v1/projects", ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  if (auth.projectsMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  const only = eq(url, "id");
  return send(
    response,
    200,
    auth.projects.filter((entry) => entry.id === only).map((entry) => ({ brief: entry.brief })),
  );
});

route("GET", "/rest/v1/tasks", ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const only = eq(url, "project_id");
  const entry = auth.projects.find((item) => item.id === only);
  return send(
    response,
    200,
    [...(entry?.tasks ?? [])].sort((a, b) => a.sort - b.sort),
  );
});

function projectOf(auth, id) {
  return auth.projects.find((entry) => entry.id === id);
}

function taskOf(auth, id) {
  for (const entry of auth.projects) {
    const task = entry.tasks.find((item) => item.id === id);
    if (task) return { entry, task };
  }
  return null;
}

function rpc(name, handler) {
  route("POST", `/rest/v1/rpc/${name}`, async ({ request, response }) => {
    const auth = adminCall(request, response);
    if (!auth) return;
    const args = JSON.parse(await readBody(request));
    auth.calls.projects.push({ name, args });
    if (auth.projectsRpcError) {
      return send(response, 400, { details: null, hint: null, ...auth.projectsRpcError });
    }
    return handler({ auth, args, response });
  });
}

rpc("set_project_phase", ({ auth, args, response }) => {
  const entry = projectOf(auth, args.p_id);
  if (!entry) return failure(response, "P0001", "project_not_found");
  if (entry.archived_at) return failure(response, "P0001", "project_archived");
  entry.phase = args.p_phase;
  return sendEmpty(response);
});

rpc("archive_project", ({ auth, args, response }) => {
  const entry = projectOf(auth, args.p_id);
  if (!entry) return failure(response, "P0001", "project_not_found");
  entry.archived_at = args.p_archived === false ? null : new Date().toISOString();
  entry.status = args.p_archived === false ? "active" : "closed";
  return sendEmpty(response);
});

rpc("upsert_task", ({ auth, args, response }) => {
  const entry = projectOf(auth, args.p_project_id);
  if (!entry) return failure(response, "P0001", "project_not_found");
  if (!String(args.p_title ?? "").trim()) return failure(response, "P0001", "invalid_title");
  const assignee = args.p_assignee_id ?? null;
  if (assignee !== null && assignee !== entry.client_id && assignee !== entry.freelance_id) {
    return failure(response, "P0001", "invalid_assignee");
  }
  const status = args.p_status ?? "todo";
  if (args.p_id) {
    const task = entry.tasks.find((item) => item.id === args.p_id);
    if (!task) return failure(response, "P0001", "task_not_found");
    Object.assign(task, {
      title: args.p_title,
      phase: args.p_phase,
      description: args.p_description ?? null,
      status,
      assignee_id: assignee,
      done_at: status === "done" ? (task.done_at ?? new Date().toISOString()) : null,
    });
    return send(response, 200, JSON.stringify(task.id));
  }
  const sort = entry.tasks.filter((item) => item.phase === args.p_phase).length;
  const task = taskRow({
    id: randomUUID(),
    project_id: entry.id,
    phase: args.p_phase,
    title: args.p_title,
    description: args.p_description ?? null,
    status,
    assignee_id: assignee,
    sort,
    done_at: status === "done" ? new Date().toISOString() : null,
  });
  entry.tasks.push(task);
  return send(response, 200, JSON.stringify(task.id));
});

rpc("move_task", ({ auth, args, response }) => {
  const found = taskOf(auth, args.p_id);
  if (!found) return failure(response, "P0001", "task_not_found");
  const others = found.entry.tasks
    .filter((item) => item !== found.task && item.phase === args.p_phase)
    .sort((a, b) => a.sort - b.sort);
  const position = Math.min(Math.max(args.p_sort, 0), others.length);
  others.splice(position, 0, found.task);
  found.task.phase = args.p_phase;
  others.forEach((item, index) => {
    item.sort = index;
  });
  return sendEmpty(response);
});

rpc("delete_task", ({ auth, args, response }) => {
  const found = taskOf(auth, args.p_id);
  if (!found) return failure(response, "P0001", "task_not_found");
  if (found.task.status !== "todo" || found.task.story_id) {
    return failure(response, "P0001", "task_not_deletable");
  }
  found.entry.tasks = found.entry.tasks.filter((item) => item !== found.task);
  return sendEmpty(response);
});

route("GET", "/rest/v1/stories", ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  if (auth.projectsMode === "storiesError") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  const only = eq(url, "project_id");
  const entry = auth.projects.find((item) => item.id === only);
  return send(response, 200, entry?.stories ?? []);
});

rpc("decide_story", ({ auth, args, response }) => {
  const story = auth.projects
    .flatMap((entry) => entry.stories)
    .find((item) => item.id === args.p_id);
  if (!story) return failure(response, "P0001", "story_not_found");
  if (!["accept", "reject", "out_of_scope"].includes(args.p_decision)) {
    return failure(response, "P0001", "invalid_decision");
  }
  if (story.status !== "proposed") return failure(response, "P0001", "story_not_proposed");
  if (args.p_decision === "reject" && !String(args.p_note ?? "").trim()) {
    return failure(response, "P0001", "note_required");
  }
  if (args.p_decision === "out_of_scope" && !(args.p_hours > 0 && args.p_amount > 0)) {
    return failure(response, "P0001", "estimate_required");
  }
  const entry = auth.projects.find((item) => item.id === story.project_id);
  let status = "in_review";
  if (args.p_decision === "reject") status = "rejected";
  if (args.p_decision === "accept") {
    status = "accepted";
    if (args.p_create_task) {
      const task = taskRow({
        id: randomUUID(),
        project_id: entry.id,
        phase: entry.phase,
        title: story.title,
        description: story.i_want,
        story_id: story.id,
        sort: entry.tasks.filter((item) => item.phase === entry.phase).length,
      });
      entry.tasks.push(task);
      story.task_id = task.id;
      status = "in_tasks";
    }
  }
  Object.assign(story, {
    status,
    out_of_scope: args.p_decision === "out_of_scope",
    estimate_hours: args.p_hours ?? null,
    estimate_amount: args.p_amount ?? null,
    decision_note: args.p_note ?? null,
    decided_at: new Date().toISOString(),
  });
  return send(response, 200, JSON.stringify(status));
});

let documentsStorageMode = "ok";
const documentStorage = [];
const registeredDocuments = [];

route("POST", "/__auth/documents-storage-mode", async ({ request, response }) => {
  documentsStorageMode = JSON.parse(await readBody(request)).mode;
  documentStorage.length = 0;
  registeredDocuments.length = 0;
  return send(response, 200, { ok: true });
});

route("GET", "/__auth/documents-storage", ({ response }) => send(response, 200, documentStorage));

const allowedMimes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/zip",
  "text/plain",
  "text/csv",
]);

function serviceOnly(request, response) {
  if (request.headers.authorization === "Bearer test-service-role-key") return true;
  send(response, 401, { code: "PGRST301", message: "JWT invalid", details: null, hint: null });
  return false;
}

route("GET", "/rest/v1/documents", ({ request, response, url }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const byProject = eq(url, "project_id");
  const byId = eq(url, "id");
  const rows = [...auth.projects.flatMap((entry) => entry.documents), ...registeredDocuments]
    .filter((doc) => doc.deleted_at === null)
    .filter((doc) => (byProject ? doc.project_id === byProject : true))
    .filter((doc) => (byId ? doc.id === byId : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return send(response, 200, rows);
});

route("POST", "/rest/v1/rpc/register_document", async ({ request, response }) => {
  if (!serviceOnly(request, response)) return;
  const args = JSON.parse(await readBody(request));
  if (!Object.values(projectIds).includes(args.p_project_id)) {
    return failure(response, "P0001", "project_not_found");
  }
  if (documentsStorageMode === "quota") {
    return failure(response, "P0001", "project_quota_exceeded");
  }
  if (!allowedMimes.has(args.p_mime)) return failure(response, "P0001", "invalid_mime");
  const id = args.p_path.split("/")[2];
  registeredDocuments.push({
    id,
    project_id: args.p_project_id,
    uploaded_by: args.p_uploaded_by,
    name: args.p_name,
    mime: args.p_mime,
    size_bytes: args.p_size,
    storage_path: args.p_path,
    visibility: args.p_visibility,
    created_at: new Date().toISOString(),
    deleted_at: null,
  });
  return send(response, 200, JSON.stringify(id));
});

route("POST", "/rest/v1/rpc/delete_document", async ({ request, response }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  const args = JSON.parse(await readBody(request));
  const doc = [...auth.projects.flatMap((entry) => entry.documents), ...registeredDocuments].find(
    (item) => item.id === args.p_id && item.deleted_at === null,
  );
  if (!doc) return failure(response, "P0001", "document_not_found");
  doc.deleted_at = new Date().toISOString();
  return send(response, 200, JSON.stringify(doc.storage_path));
});

route(
  "POST",
  /^\/storage\/v1\/object\/project-documents\/(.+)$/,
  async ({ request, response, match }) => {
    if (!serviceOnly(request, response)) return;
    const raw = await readBody(request);
    const path = decodeURIComponent(match[1]);
    documentStorage.push({ kind: "upload", path, size: raw.length });
    if (documentsStorageMode === "upload-error") {
      return send(response, 500, { statusCode: "500", error: "storage", message: "storage" });
    }
    return send(response, 200, { Key: `project-documents/${match[1]}`, Id: randomUUID() });
  },
);

route("DELETE", /^\/storage\/v1\/object\/project-documents$/, async ({ request, response }) => {
  if (!serviceOnly(request, response)) return;
  const body = JSON.parse(await readBody(request));
  documentStorage.push({ kind: "remove", paths: body.prefixes });
  return send(response, 200, []);
});

route(
  "POST",
  /^\/storage\/v1\/object\/sign\/project-documents\/(.+)$/,
  async ({ request, response, match }) => {
    if (!serviceOnly(request, response)) return;
    documentStorage.push({ kind: "sign", path: decodeURIComponent(match[1]) });
    return send(response, 200, {
      signedURL: `/object/sign/project-documents/${match[1]}?token=mock-token`,
    });
  },
);

route("GET", /^\/storage\/v1\/object\/sign\/project-documents\/(.+)$/, ({ response }) =>
  send(response, 200, "%PDF-1.4\n%mock\n", "application/pdf"),
);
