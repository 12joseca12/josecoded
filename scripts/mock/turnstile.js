import { readBody, route, send } from "./registry.js";

const acceptedSecret = "test-turnstile-secret";
const rejectedToken = "bad-token";

const fakeWidget = `
(function () {
  var store = {};
  function token() {
    try { return window.localStorage.getItem("fakeTurnstileToken") || "mock-token"; } catch (e) { return "mock-token"; }
  }
  function withAction(value, options) {
    return options.action && options.action !== "contact" ? value + ":" + options.action : value;
  }
  function field(el) {
    var input = el.querySelector("input[name='cf-turnstile-response']");
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "cf-turnstile-response";
      el.appendChild(input);
    }
    return input;
  }
  function deliver(el, options) {
    setTimeout(function () {
      var value = withAction(token(), options);
      field(el).value = value;
      options.callback(value);
    }, 40);
  }
  window.turnstile = {
    render: function (el, options) {
      var id = "fake-" + Object.keys(store).length;
      store[id] = { options: options, el: el };
      el.setAttribute("data-fake-turnstile", "");
      var frame = document.createElement("div");
      frame.style.minWidth = options.size === "compact" ? "150px" : "300px";
      frame.style.height = "65px";
      el.appendChild(frame);
      field(el).value = "";
      deliver(el, options);
      return id;
    },
    reset: function (id) {
      var entry = store[id];
      if (!entry) return;
      field(entry.el).value = "";
      deliver(entry.el, entry.options);
    },
    remove: function (id) { delete store[id]; }
  };
})();
`;

let calls = { rpc: [], siteverify: [] };

route("GET", "/__calls", ({ response }) => send(response, 200, calls));

route("POST", "/__reset", ({ response }) => {
  calls = { rpc: [], siteverify: [] };
  return send(response, 200, { ok: true });
});

route("GET", "/turnstile/api.js", ({ response }) =>
  send(response, 200, fakeWidget, "text/javascript"),
);

route("POST", "/turnstile/siteverify", async ({ request, response }) => {
  const params = new URLSearchParams(await readBody(request));
  const entry = Object.fromEntries(params.entries());
  calls.siteverify.push(entry);
  const [baseToken, widgetAction] = String(entry.response ?? "").split(":");
  const success = entry.secret === acceptedSecret && baseToken !== rejectedToken;
  return send(response, 200, {
    success,
    hostname: "localhost",
    action: widgetAction ?? "contact",
  });
});

route("POST", "/rest/v1/rpc/submit_lead", async ({ request, response }) => {
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
});
