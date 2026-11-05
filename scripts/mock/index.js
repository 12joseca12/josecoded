import "./turnstile.js";
import "./auth.js";
import "./catalog.js";
import "./profiles.js";
import "./leads.js";
import "./users.js";
import "./invitations.js";
import "./prices.js";
import "./system.js";

import { createServer } from "node:http";

import { dispatch, route, send } from "./registry.js";

const port = Number(process.env.MOCK_BACKEND_PORT ?? 3199);

route("GET", "/__health", ({ response }) => send(response, 200, { ok: true }));

createServer((request, response) => dispatch(request, response, port)).listen(port, "127.0.0.1");
