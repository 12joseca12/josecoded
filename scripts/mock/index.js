import "./turnstile.js";
import "./auth.js";
import "./catalog.js";
import "./profiles.js";
import "./account.js";
import "./leads.js";
import "./inbox.js";
import "./users.js";
import "./invitations.js";
import "./crm.js";
import "./crm-import.js";
import "./money.js";
import "./crm-counters.js";
import "./prices.js";
import "./system.js";
import "./notifications.js";
import "./overview.js";
import "./chat-visitor.js";
import "./area.js";
import "./chat-rooms.js";
import "./freelance.js";
import "./projects.js";

import { createServer } from "node:http";

import { dispatch, route, send } from "./registry.js";

const port = Number(process.env.MOCK_BACKEND_PORT ?? 3199);

route("GET", "/__health", ({ response }) => send(response, 200, { ok: true }));

createServer((request, response) => dispatch(request, response, port)).listen(port, "127.0.0.1");
