import { randomUUID } from "node:crypto";

import { extendAuthState, people, stateFor } from "./auth.js";
import { readBody, route, send } from "./registry.js";
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

function seededProjects() {
  const tasks = Array.from({ length: 8 }, (_, index) =>
    taskRow({
      id: `61000000-0000-4000-8000-00000000000${index + 1}`,
      project_id: projectIds.shop,
      phase: index < 2 ? "discover" : index < 5 ? "design" : "build",
      title: `Tarea ${index + 1}`,
      status: index < 2 ? "done" : "todo",
      sort: index,
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
      stories: [
        {
          id: "62000000-0000-4000-8000-000000000001",
          project_id: projectIds.shop,
          status: "proposed",
        },
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

route("GET", "/rest/v1/project_overview", ({ request, response }) => {
  const auth = adminCall(request, response);
  if (!auth) return;
  if (auth.projectsMode === "error") {
    return send(response, 500, { code: "XX000", message: "internal", details: null, hint: null });
  }
  if (auth.projectsMode === "empty") return send(response, 200, []);
  return send(
    response,
    200,
    [...auth.projects].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(overviewRow),
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
