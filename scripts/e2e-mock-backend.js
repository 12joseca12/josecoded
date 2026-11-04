import { createServer } from "node:http";

const port = Number(process.env.MOCK_BACKEND_PORT ?? 3199);
const acceptedSecret = "test-turnstile-secret";
const rejectedToken = "bad-token";

const fakeWidget = `
(function () {
  var store = {};
  function token() {
    try { return window.localStorage.getItem("fakeTurnstileToken") || "mock-token"; } catch (e) { return "mock-token"; }
  }
  window.turnstile = {
    render: function (el, options) {
      var id = "fake-" + Object.keys(store).length;
      store[id] = options;
      el.setAttribute("data-fake-turnstile", "");
      setTimeout(function () { options.callback(token()); }, 40);
      return id;
    },
    reset: function (id) {
      var options = store[id];
      if (options) setTimeout(function () { options.callback(token()); }, 40);
    },
    remove: function (id) { delete store[id]; }
  };
})();
`;

let calls = { rpc: [], siteverify: [] };

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function send(response, status, body, type = "application/json") {
  response.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);

  if (url.pathname === "/__health") return send(response, 200, { ok: true });
  if (url.pathname === "/__calls") return send(response, 200, calls);
  if (url.pathname === "/__reset") {
    calls = { rpc: [], siteverify: [] };
    return send(response, 200, { ok: true });
  }
  if (url.pathname === "/turnstile/api.js") {
    return send(response, 200, fakeWidget, "text/javascript");
  }

  if (url.pathname === "/turnstile/siteverify" && request.method === "POST") {
    const params = new URLSearchParams(await readBody(request));
    const entry = Object.fromEntries(params.entries());
    calls.siteverify.push(entry);
    const success = entry.secret === acceptedSecret && entry.response !== rejectedToken;
    return send(response, 200, {
      success,
      hostname: "localhost",
      action: "contact",
    });
  }

  if (url.pathname === "/rest/v1/rpc/submit_lead" && request.method === "POST") {
    const args = JSON.parse(await readBody(request));
    calls.rpc.push({
      args,
      authorization: request.headers.authorization ?? null,
      apikey: request.headers.apikey ?? null,
    });
    const email = String(args.p_email ?? "");
    if (email.startsWith("quota@")) {
      return send(response, 400, {
        code: "P0001",
        message: "form_quota_exceeded",
        details: null,
        hint: "contact_alternatives",
      });
    }
    if (email.startsWith("down@")) {
      return send(response, 500, {
        code: "XX000",
        message: "internal",
        details: null,
        hint: null,
      });
    }
    return send(response, 200, JSON.stringify("00000000-0000-4000-8000-000000000001"));
  }

  return send(response, 404, { message: "not found" });
});

server.listen(port, "127.0.0.1");
